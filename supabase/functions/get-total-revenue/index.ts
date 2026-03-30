import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ml-access-token, shopee-access-token',
};

async function generateSign(partnerKey: string, partnerId: string, apiPath: string, timestamp: number) {
  const baseString = partnerId + apiPath + timestamp;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(partnerKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(baseString)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function refreshMLToken(connection: any, supabase: any) {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');

  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: connection.refreshToken,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`ML Refresh failed: ${data.message || data.error}`);

  const { error } = await supabase
    .from('PlatformConnection')
    .update({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', connection.id);

  if (error) throw error;
  return data.access_token;
}

async function refreshShopeeToken(connection: any, supabase: any) {
  const partnerId = Deno.env.get('SHOPEE_PARTNER_ID')!;
  const partnerKey = Deno.env.get('SHOPEE_PARTNER_KEY')!;
  const timestamp = Math.floor(Date.now() / 1000);
  const apiPath = "/api/v2/auth/access_token/get";
  const sign = await generateSign(partnerKey, partnerId, apiPath, timestamp);

  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: connection.refreshToken,
      partner_id: parseInt(partnerId),
      shop_id: parseInt(connection.externalUserId),
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Shopee Refresh failed: ${data.message || data.error}`);

  await supabase
    .from('PlatformConnection')
    .update({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expire_in * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', connection.id);

  return data.access_token;
}

async function fetchMLOrders(externalUserId: string, accessToken: string, from: string, to: string) {
  let allOrders: any[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `https://api.mercadolibre.com/orders/search?seller=${externalUserId}&order.date_closed.from=${from}&order.date_closed.to=${to}&offset=${offset}&limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    allOrders = allOrders.concat(data.results || []);
    if (!data.paging || offset + limit >= data.paging.total) break;
    offset += limit;
  }
  return allOrders;
}

async function fetchShopeeOrders(shopId: string, accessToken: string, from: number, to: number) {
  const partnerId = Deno.env.get('SHOPEE_PARTNER_ID')!;
  const partnerKey = Deno.env.get('SHOPEE_PARTNER_KEY')!;
  const timestamp = Math.floor(Date.now() / 1000);
  const apiPath = "/api/v2/order/get_order_list";
  
  // Shopee requires time in seconds for the list query
  const sign = await generateSign(partnerKey, partnerId, apiPath, timestamp);
  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&access_token=${accessToken}&shop_id=${shopId}`;
  
  const response = await fetch(`${url}&time_range_field=create_time&time_from=${from}&time_to=${to}&page_size=50`, {
    headers: { "Content-Type": "application/json" }
  });
  
  const data = await response.json();
  if (data.error) return [];

  const orderList = data.response?.order_list || [];
  if (orderList.length === 0) return [];

  // Fetch details for revenue (expensive, but necessary for first pass)
  const detailPath = "/api/v2/order/get_order_detail";
  const detailSign = await generateSign(partnerKey, partnerId, detailPath, timestamp);
  const detailUrl = `https://partner.shopeemobile.com${detailPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${detailSign}&access_token=${accessToken}&shop_id=${shopId}`;
  
  const detailsResponse = await fetch(`${detailUrl}&order_sn_list=${orderList.map((o: any) => o.order_sn).join(',')}`, {
    headers: { "Content-Type": "application/json" }
  });
  
  const detailData = await detailsResponse.json();
  return detailData.response?.order_list || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { platform, userId, dateRange } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const fromDate = new Date(dateRange?.from || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = new Date(dateRange?.to || Date.now());

    let query = supabase.from('PlatformConnection').select('*').eq('userId', userId);
    if (platform && platform !== 'geral') query = query.eq('platform', platform.toUpperCase());
    const { data: connections } = await query;

    const dailyData: Record<string, { date: string, ml: number, shopee: number, total: number }> = {};
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyData[dateStr] = { date: dateStr, ml: 0, shopee: 0, total: 0 };
    }

    let totalRevenue = 0;
    let totalOrders = 0;

    for (const conn of (connections || [])) {
      if (conn.platform === 'MERCADOLIVRE') {
        let accessToken = conn.accessToken;
        if (new Date(conn.expiresAt) < new Date()) accessToken = await refreshMLToken(conn, supabase);
        const orders = await fetchMLOrders(conn.externalUserId, accessToken, fromDate.toISOString(), toDate.toISOString());
        orders.forEach(order => {
          const date = (order.date_closed || order.date_created).split('T')[0];
          const amount = order.total_amount || 0;
          if (dailyData[date]) { dailyData[date].ml += amount; dailyData[date].total += amount; }
          totalRevenue += amount; totalOrders++;
        });
      }
      
      if (conn.platform === 'SHOPEE') {
        let accessToken = conn.accessToken;
        if (new Date(conn.expiresAt) < new Date()) accessToken = await refreshShopeeToken(conn, supabase);
        const orders = await fetchShopeeOrders(conn.externalUserId, accessToken, Math.floor(fromDate.getTime()/1000), Math.floor(toDate.getTime()/1000));
        orders.forEach(order => {
          const date = new Date(order.create_time * 1000).toISOString().split('T')[0];
          const amount = parseFloat(order.total_amount) || 0;
          if (dailyData[date]) { dailyData[date].shopee += amount; dailyData[date].total += amount; }
          totalRevenue += amount; totalOrders++;
        });
      }
    }

    return new Response(JSON.stringify({
      revenue: totalRevenue,
      totalOrders,
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error in get-total-revenue:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
