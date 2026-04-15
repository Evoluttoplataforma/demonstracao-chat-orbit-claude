import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CRM_BASE_URL = "https://cvanwvoddchatcdstwry.supabase.co/functions/v1";
const WEBFORM_ID = "b84131b3-feff-4766-bff6-7d8c6d3dd2c8";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, email, whatsapp, empresa } = await req.json();

    if (!nome || !email) {
      return new Response(
        JSON.stringify({ error: "nome and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Syncing lead to CRM: ${nome} <${email}>`);

    // Try the webform-submit endpoint (common pattern for Supabase CRM webforms)
    const submitUrl = `${CRM_BASE_URL}/crm-webform-submit`;
    
    const payload = {
      form_id: WEBFORM_ID,
      name: nome,
      email: email,
      phone: whatsapp || "",
      company: empresa || "",
    };

    const response = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { raw: result };
    }

    if (!response.ok) {
      console.error("CRM submit failed:", response.status, parsed);
      return new Response(
        JSON.stringify({ success: false, status: response.status, details: parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("CRM sync success:", parsed);
    return new Response(
      JSON.stringify({ success: true, crm_response: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error syncing to CRM:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
