import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase env vars");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Current time in Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffsetMs = -3 * 60 * 60 * 1000;
    const nowBrasilia = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + brasiliaOffsetMs);

    console.log(`[batch-confirmation-calls] Brasília time: ${nowBrasilia.toISOString()}`);

    const results: string[] = [];

    // ========== 1. Check LEADS ==========
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "completo")
      .eq("ligacao_confirmacao_enviada", false)
      .not("data_reuniao", "is", null)
      .not("horario_reuniao", "is", null)
      .neq("data_reuniao", "")
      .neq("horario_reuniao", "")
      .neq("whatsapp", "");

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
    }

    for (const lead of leads || []) {
      try {
        const parts = lead.data_reuniao!.split("/");
        if (parts.length !== 3) continue;

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        const [h, m] = lead.horario_reuniao!.split(":").map(Number);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(h) || isNaN(m)) continue;

        const meetingBrasilia = new Date(year, month, day, h, m, 0);
        const diffMinutes = (meetingBrasilia.getTime() - nowBrasilia.getTime()) / (1000 * 60);

        // Trigger call 3-7 minutes before
        if (diffMinutes >= 3 && diffMinutes <= 7) {
          console.log(`[batch] Triggering call for lead ${lead.nome} (${lead.email}), meeting in ${diffMinutes.toFixed(1)}min`);

          // Fire and forget — call the confirmation-call function
          const callResp = await fetch(`${SUPABASE_URL}/functions/v1/confirmation-call`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ leadId: lead.id }),
          });

          const callResult = await callResp.json();
          results.push(`lead:${lead.nome}:${callResp.ok ? "ok" : callResult.error}`);
        }
      } catch (e) {
        console.error(`Error processing lead ${lead.id}:`, e);
        results.push(`lead:${lead.id}:error`);
      }
    }

    // ========== 2. Check SALA_PRESENCAS ==========
    // We need to join with sala_horarios to get the time
    const todayBrasilia = `${nowBrasilia.getFullYear()}-${String(nowBrasilia.getMonth() + 1).padStart(2, "0")}-${String(nowBrasilia.getDate()).padStart(2, "0")}`;

    const { data: presencas, error: presencasError } = await supabase
      .from("sala_presencas")
      .select("*, sala_horarios!inner(horario)")
      .eq("data_sessao", todayBrasilia)
      .eq("ligacao_confirmacao_enviada", false)
      .neq("whatsapp", "");

    if (presencasError) {
      console.error("Error fetching presencas:", presencasError);
    }

    for (const presenca of presencas || []) {
      try {
        const horario = (presenca as any).sala_horarios?.horario;
        if (!horario) continue;

        const [h, m] = horario.split(":").map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const sessionBrasilia = new Date(
          nowBrasilia.getFullYear(),
          nowBrasilia.getMonth(),
          nowBrasilia.getDate(),
          h, m, 0
        );
        const diffMinutes = (sessionBrasilia.getTime() - nowBrasilia.getTime()) / (1000 * 60);

        if (diffMinutes >= 3 && diffMinutes <= 7) {
          console.log(`[batch] Triggering call for presenca ${presenca.nome}, session in ${diffMinutes.toFixed(1)}min`);

          const callResp = await fetch(`${SUPABASE_URL}/functions/v1/confirmation-call`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ presencaId: presenca.id }),
          });

          const callResult = await callResp.json();
          results.push(`presenca:${presenca.nome}:${callResp.ok ? "ok" : callResult.error}`);
        }
      } catch (e) {
        console.error(`Error processing presenca ${presenca.id}:`, e);
        results.push(`presenca:${presenca.id}:error`);
      }
    }

    console.log(`[batch-confirmation-calls] Done. Results: ${JSON.stringify(results)}`);

    return new Response(
      JSON.stringify({
        success: true,
        leads_checked: leads?.length || 0,
        presencas_checked: presencas?.length || 0,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[batch-confirmation-calls] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
