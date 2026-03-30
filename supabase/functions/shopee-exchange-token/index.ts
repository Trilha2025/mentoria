import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { code, shopId, userId } = await req.json();
    const partnerId = Deno.env.get('SHOPEE_PARTNER_ID')!;
    const partnerKey = Deno.env.get('SHOPEE_PARTNER_KEY')!;
    const timestamp = Math.floor(Date.now() / 1000);
    const apiPath = "/api/v2/auth/token/get";

    const sign = await generateSign(partnerKey, partnerId, apiPath, timestamp);

    const body = {
      code,
      partner_id: parseInt(partnerId),
      shop_id: parseInt(shopId),
    };

    const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.error) throw new Error(`Shopee Error: ${data.message || data.error}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: dbError } = await supabase
      .from('PlatformConnection')
      .upsert({
        id: crypto.randomUUID(),
        userId,
        platform: 'SHOPEE',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expire_in * 1000).toISOString(),
        externalUserId: shopId.toString(),
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'userId,platform'
      });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
