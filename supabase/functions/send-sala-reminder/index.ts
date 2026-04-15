import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildReminderHTML(
  nome: string,
  salaNome: string,
  categoria: string,
  dataSessao: string,
  horario: string,
  linkSala: string,
): string {
  const isOnboarding = categoria === "onboarding";
  const sessionType = isOnboarding ? "sessão de onboarding" : "sessão de tira-dúvidas";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="background:#0F1319;padding:32px 40px;text-align:center;">
  <img src="https://nmeuxanxjnhpdcfkdrdc.supabase.co/storage/v1/object/public/email-assets/orbit-icon.png" alt="Orbit" width="60" style="display:inline-block;" />
</td></tr>

<!-- Badge -->
<tr><td style="padding:32px 40px 0;text-align:center;">
  <span style="display:inline-block;background:#FFF3E0;color:#E65100;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;">
    ⏰ LEMBRETE — SUA SESSÃO É EM 1 HORA
  </span>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 40px 0;text-align:center;">
  <h1 style="margin:0;font-size:26px;color:#0F1319;font-weight:700;">Falta pouco, ${nome}!</h1>
  <p style="margin:8px 0 0;font-size:16px;color:#6B7280;line-height:1.5;">
    Sua ${sessionType} do Orbit começa em <strong>1 hora</strong>. Não se esqueça!
  </p>
</td></tr>

<!-- Session info -->
<tr><td style="padding:24px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;">
    <tr>
      <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;" width="33%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">📅 Data</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${dataSessao}</p>
      </td>
      <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;" width="33%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">🕐 Horário</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${horario}</p>
      </td>
      <td style="padding:20px;text-align:center;" width="33%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">🎯 Sala</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${salaNome}</p>
      </td>
    </tr>
  </table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:0 40px 24px;text-align:center;">
  <a href="${linkSala}" style="display:inline-block;background:#CC9511;color:#ffffff;padding:16px 48px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">
    Entrar na Sala
  </a>
  <p style="margin:12px 0 0;font-size:13px;color:#9CA3AF;">
    ou copie: <a href="${linkSala}" style="color:#CC9511;text-decoration:underline;">${linkSala}</a>
  </p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;" /></td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px 32px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
    Orbit Gestão · Transformando empresas com IA
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Current time in Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffsetMs = -3 * 60 * 60 * 1000;
    const nowBrasilia = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + brasiliaOffsetMs);

    console.log("Current Brasília time:", nowBrasilia.toISOString());

    // Fetch presencas with their sala and horario info
    // We need to find sessions happening in 30-75 minutes
    const { data: presencas, error: presencaError } = await supabase
      .from("sala_presencas")
      .select("*");

    if (presencaError) {
      console.error("Error fetching presencas:", presencaError);
      throw presencaError;
    }

    // Fetch salas and horarios
    const { data: salas } = await supabase.from("salas").select("*").eq("ativo", true);
    const { data: horarios } = await supabase.from("sala_horarios").select("*").eq("ativo", true);

    const salasMap = new Map((salas || []).map((s: any) => [s.id, s]));
    const horariosMap = new Map((horarios || []).map((h: any) => [h.id, h]));

    console.log(`Found ${presencas?.length || 0} presencas to check`);

    let sentCount = 0;

    for (const presenca of presencas || []) {
      try {
        const horario = horariosMap.get(presenca.horario_id);
        const sala = salasMap.get(presenca.sala_id);
        if (!horario || !sala) continue;

        // Parse session date and time
        const [y, m, d] = presenca.data_sessao.split("-").map(Number);
        const [hh, mm] = horario.horario.split(":").map(Number);

        if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hh) || isNaN(mm)) continue;

        const sessionBrasilia = new Date(y, m - 1, d, hh, mm, 0);
        const diffMs = sessionBrasilia.getTime() - nowBrasilia.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Send reminder if session is between 30 and 75 minutes away
        if (diffMinutes >= 30 && diffMinutes <= 75) {
          // Check if we already sent a reminder (look in email_logs)
          const { data: existingLog } = await supabase
            .from("email_logs")
            .select("id")
            .eq("email_type", "lembrete_sala")
            .eq("recipient_email", presenca.email)
            .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (existingLog && existingLog.length > 0) {
            console.log(`Reminder already sent to ${presenca.email} for this session, skipping`);
            continue;
          }

          const displayDate = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

          console.log(`Sending sala reminder to ${presenca.email} for ${displayDate} ${horario.horario}`);

          const emailHTML = buildReminderHTML(
            presenca.nome,
            sala.nome,
            sala.categoria,
            displayDate,
            horario.horario.slice(0, 5),
            sala.link_sala,
          );

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Orbit Gestão <demonstracao@orbitgestao.com.br>",
              to: [presenca.email],
              subject: `⏰ Lembrete: sua sessão é em 1 hora — ${horario.horario.slice(0, 5)}`,
              html: emailHTML,
            }),
          });

          const emailResult = await emailResponse.json();

          // Log email
          await supabase.from("email_logs").insert({
            email_type: "lembrete_sala",
            recipient_email: presenca.email,
            recipient_name: presenca.nome,
            resend_id: emailResult?.id || null,
            success: emailResponse.ok,
            error_message: emailResponse.ok ? null : JSON.stringify(emailResult),
          });

          if (emailResponse.ok) {
            sentCount++;
            console.log(`Sala reminder sent to ${presenca.email}, Resend ID: ${emailResult.id}`);
          } else {
            console.error(`Failed to send reminder to ${presenca.email}:`, emailResult);
          }
        }
      } catch (err) {
        console.error(`Error processing presenca ${presenca.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sentCount, presencas_checked: presencas?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
