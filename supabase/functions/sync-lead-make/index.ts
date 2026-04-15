import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAKE_WEBHOOK_URL = "https://hook.us1.make.com/mo56te9czy4s7h10gumjbmke05dqohn5";
const PLATAFORMA_URL = "https://plataforma-email.vercel.app/api/leads-lovable/ingest";
const PLATAFORMA_API_KEY = "6e6bdf1cd5db76e53f413040af604fb4f7b1c69c98486888aff701d716738d6e";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: lead, error: dbError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (dbError || !lead) {
      console.error("[sync-lead-make] Lead not found:", dbError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to Plataforma (all leads, always)
    const plataformaPromise = fetch(PLATAFORMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PLATAFORMA_API_KEY,
      },
      body: JSON.stringify(lead),
    }).then(async (r) => {
      const txt = await r.text();
      console.log(`[sync-lead-make] Plataforma response: ${r.status} ${txt}`);
      return { target: "plataforma", status: r.status, ok: r.ok, body: txt };
    }).catch((e) => {
      console.error(`[sync-lead-make] Plataforma error:`, e);
      return { target: "plataforma", status: 0, ok: false, body: e.message };
    });

    // Send to Make.com only for Meta Ads leads (have fbclid)
    let makeResult = { target: "make", status: 0, ok: true, body: "skipped (no fbclid)", skipped: true };
    if (lead.fbclid) {
      console.log(`[sync-lead-make] Sending Meta Ads lead ${lead_id} to Make.com`);
      makeResult = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      }).then(async (r) => {
        const txt = await r.text();
        console.log(`[sync-lead-make] Make.com response: ${r.status} ${txt}`);
        return { target: "make", status: r.status, ok: r.ok, body: txt, skipped: false };
      }).catch((e) => {
        console.error(`[sync-lead-make] Make.com error:`, e);
        return { target: "make", status: 0, ok: false, body: e.message, skipped: false };
      });
    }

    const platResult = await plataformaPromise;

    return new Response(
      JSON.stringify({ success: true, plataforma: platResult, make: makeResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-lead-make] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
