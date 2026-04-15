import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const N8N_URL = "https://webhook.rodriguinhodomarketing.com.br/webhook/salva-supabase";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch leads with scheduled meetings that haven't been sent to n8n
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, nome, sobrenome, whatsapp, email, empresa, pipedrive_deal_id, data_reuniao, horario_reuniao, manychat_subscriber_id")
      .eq("ligacao_agendada", false)
      .not("data_reuniao", "is", null)
      .not("data_reuniao", "eq", "")
      .not("horario_reuniao", "is", null)
      .not("horario_reuniao", "eq", "");

    if (error) {
      console.error("[batch] DB query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[batch] Found ${leads?.length || 0} leads with ligacao_agendada=false`);

    const now = new Date();
    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const lead of leads || []) {
      try {
        // Parse date: formats like "DD/MM/YYYY" or "D/M/YYYY"
        const dateParts = lead.data_reuniao.split("/");
        if (dateParts.length !== 3) {
          console.log(`[batch] Skipping lead ${lead.id}: invalid date format "${lead.data_reuniao}"`);
          skipped++;
          continue;
        }

        const [dd, mm, yyyy] = dateParts;
        const isoDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${lead.horario_reuniao}:00-03:00`;
        const meetingDate = new Date(isoDate);

        // Only process future meetings
        if (meetingDate <= now) {
          console.log(`[batch] Skipping lead ${lead.id}: meeting in the past (${isoDate})`);
          skipped++;
          continue;
        }

        const phone = lead.whatsapp.startsWith("+")
          ? lead.whatsapp
          : `+55${lead.whatsapp.replace(/\D/g, "")}`;

        const payload = {
          lead_name: `${lead.nome} ${lead.sobrenome || ""}`.trim(),
          lead_phone: phone,
          call_datetime: isoDate,
          subscriber_id: lead.manychat_subscriber_id || null,
          deal_id: lead.pipedrive_deal_id || null,
          link_reuniao: "https://meet.google.com/qpy-himp-cxj",
          vendedor_phone: "+5519266029722",
          vendedor_name: "Olivia",
        };

        console.log(`[batch] Sending lead ${lead.id} (${lead.nome}):`, JSON.stringify(payload));

        const res = await fetch(N8N_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();

        if (res.ok) {
          // Mark as sent
          await supabase.from("leads").update({ ligacao_agendada: true }).eq("id", lead.id);
          processed++;
          console.log(`[batch] ✅ Lead ${lead.id} sent successfully`);
        } else {
          console.error(`[batch] ❌ Lead ${lead.id} n8n error: ${res.status} ${text}`);
          errors.push(`${lead.id}: ${res.status}`);
        }
      } catch (e) {
        console.error(`[batch] ❌ Lead ${lead.id} exception:`, e);
        errors.push(`${lead.id}: ${e.message}`);
      }
    }

    const summary = {
      total_found: leads?.length || 0,
      processed,
      skipped,
      errors: errors.length,
      error_details: errors,
    };

    console.log("[batch] Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[batch] Fatal error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
