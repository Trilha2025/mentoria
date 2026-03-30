import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ML_CLIENT_ID = '5647657845823420';
const ML_CLIENT_SECRET = 'Z4rwBN47DnyxOavXiUbOZ6xsa4pnx0uO';
const ML_REDIRECT_URI = 'https://uvexbrjuiqwjdgqveamy.supabase.co/functions/v1/ml-callback';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');
  const platformUrl = Deno.env.get('PLATFORM_URL') || 'http://localhost:3000';

  if (!code || !rawState) {
    return new Response(JSON.stringify({ error: 'Faltando code ou state' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Decode state: { userId, codeVerifier }
  let userId: string;
  let codeVerifier: string | undefined;
  try {
    const decoded = JSON.parse(atob(rawState));
    userId = decoded.userId;
    codeVerifier = decoded.codeVerifier;
  } catch {
    // Fallback: state is just userId (legacy)
    userId = rawState;
    codeVerifier = undefined;
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
      code: code,
      redirect_uri: ML_REDIRECT_URI,
    });

    if (codeVerifier) {
      body.set('code_verifier', codeVerifier);
    }

    console.log('ML Callback - userId:', userId);
    console.log('ML Callback - hasVerifier:', !!codeVerifier);
    console.log('ML Callback - body:', body.toString());

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString(),
    });

    const responseText = await response.text();
    console.log('ML Callback - status:', response.status);
    console.log('ML Callback - response:', responseText);

    if (!response.ok) {
      return Response.redirect(
        `${platformUrl}/dashboard/ferramentas/faturamento?error=${encodeURIComponent('ML: ' + responseText)}`, 
        302
      );
    }

    const data = JSON.parse(responseText);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: dbError } = await supabase
      .from('PlatformConnection')
      .upsert({
        id: crypto.randomUUID(),
        userId: userId,
        platform: 'MERCADOLIVRE',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        externalUserId: String(data.user_id),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'userId,platform', ignoreDuplicates: false });

    if (dbError) {
      return Response.redirect(
        `${platformUrl}/dashboard/ferramentas/faturamento?error=${encodeURIComponent('DB: ' + JSON.stringify(dbError))}`, 
        302
      );
    }

    return Response.redirect(`${platformUrl}/dashboard/ferramentas/faturamento?success=true`, 302);
  } catch (error) {
    console.error('ML Callback Error:', error);
    return Response.redirect(
      `${platformUrl}/dashboard/ferramentas/faturamento?error=${encodeURIComponent(String(error))}`, 
      302
    );
  }
});
