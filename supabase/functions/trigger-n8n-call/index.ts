import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_URL = "https://webhook.rodriguinhodomarketing.com.br/webhook/salva-supabase";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { lead_name, lead_phone, call_datetime, subscriber_id, deal_id, link_reuniao, vendedor_phone, vendedor_name } = body;

    if (!lead_name || !lead_phone || !call_datetime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      lead_name,
      lead_phone,
      call_datetime,
      subscriber_id: subscriber_id ?? null,
      deal_id: deal_id ?? null,
      link_reuniao: link_reuniao ?? "https://meet.google.com/qpy-himp-cxj",
      vendedor_phone: vendedor_phone ?? "+5519266029722",
      vendedor_name: vendedor_name ?? "Olivia",
    };

    console.log("[trigger-n8n-call] Sending to n8n:", JSON.stringify(payload));

    const res = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log(`[trigger-n8n-call] n8n response: ${res.status} ${text}`);

    if (!res.ok) {
      console.error(`[trigger-n8n-call] n8n returned non-2xx: ${res.status} ${text}`);
      return new Response(JSON.stringify({ ok: false, status: res.status, response: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, status: res.status, response: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[trigger-n8n-call] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
