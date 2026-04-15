import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildReminderHTML(name: string, date: string, time: string, meetingLink: string): string {
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
    ⏰ LEMBRETE — SUA REUNIÃO É EM 1 HORA
  </span>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 40px 0;text-align:center;">
  <h1 style="margin:0;font-size:26px;color:#0F1319;font-weight:700;">Falta pouco, ${name}!</h1>
  <p style="margin:8px 0 0;font-size:16px;color:#6B7280;line-height:1.5;">
    Sua demonstração do Orbit Gestão começa em <strong>1 hora</strong>. Prepare-se para conhecer como podemos transformar a gestão da sua empresa.
  </p>
</td></tr>

<!-- Date Card -->
<tr><td style="padding:24px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;">
    <tr>
      <td style="padding:24px;text-align:center;border-right:1px solid #E5E7EB;" width="50%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">📅 Data</p>
        <p style="margin:0;font-size:22px;color:#0F1319;font-weight:700;">${date}</p>
      </td>
      <td style="padding:24px;text-align:center;" width="50%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">🕐 Horário</p>
        <p style="margin:0;font-size:22px;color:#0F1319;font-weight:700;">${time}</p>
      </td>
    </tr>
  </table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:0 40px 24px;text-align:center;">
  <a href="${meetingLink}" style="display:inline-block;background:#CC9511;color:#ffffff;padding:16px 48px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">
    Entrar na Reunião
  </a>
  <p style="margin:12px 0 0;font-size:13px;color:#9CA3AF;">
    ou copie: <a href="${meetingLink}" style="color:#CC9511;text-decoration:underline;">${meetingLink}</a>
  </p>
</td></tr>

<!-- Tip -->
<tr><td style="padding:0 40px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0;font-size:14px;color:#795548;line-height:1.5;">
        💡 <strong>Dica:</strong> Tenha em mãos informações sobre a gestão e os processos da sua empresa para aproveitarmos melhor a demonstração.
      </p>
    </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;" /></td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px 32px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
    Orbit Gestão · Transformando empresas com IA<br/>
    Precisa reagendar? <a href="https://orbitgestaolead.lovable.app/reagendar" style="color:#CC9511;text-decoration:underline;">Clique aqui para escolher um novo horário</a>
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

    // Check for force_email parameter (test mode)
    let forceEmail: string | null = null;
    try {
      const body = await req.json();
      forceEmail = body?.force_email || null;
    } catch { /* no body */ }

    // Current time in Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffsetMs = -3 * 60 * 60 * 1000;
    const nowBrasilia = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + brasiliaOffsetMs);

    console.log("Current Brasília time:", nowBrasilia.toISOString());

    // Fetch leads with status 'completo', meeting scheduled, reminder not yet sent
    let query = supabase
      .from("leads")
      .select("*")
      .eq("status", "completo")
      .not("data_reuniao", "is", null)
      .not("horario_reuniao", "is", null)
      .neq("data_reuniao", "")
      .neq("horario_reuniao", "");

    if (forceEmail) {
      query = query.eq("email", forceEmail);
      console.log(`Force mode: sending to ${forceEmail}`);
    } else {
      query = query.eq("lembrete_enviado", false);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      throw error;
    }

    console.log(`Found ${leads?.length || 0} leads to check for reminders`);

    const fallbackLink = "https://meet.google.com/qpy-himp-cxj";
    let sentCount = 0;

    for (const lead of leads || []) {
      try {
        // Parse date (DD/MM/YYYY) and time (HH:MM) as Brasília local time
        const parts = lead.data_reuniao!.split("/");
        if (parts.length !== 3) continue;

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        const [h, m] = lead.horario_reuniao!.split(":").map(Number);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(h) || isNaN(m)) continue;

        // Build meeting datetime in Brasília
        const meetingBrasilia = new Date(year, month, day, h, m, 0);

        // Difference in minutes between meeting time and current Brasília time
        const diffMs = meetingBrasilia.getTime() - nowBrasilia.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        console.log(`Lead ${lead.email}: meeting ${lead.data_reuniao} ${lead.horario_reuniao}, diff=${diffMinutes.toFixed(1)}min`);

        // Send reminder if forced or if meeting is between 30 and 75 minutes away
        if (forceEmail || (diffMinutes >= 30 && diffMinutes <= 75)) {
          console.log(`Sending reminder to ${lead.email}`);

          const leadMeetingLink = (lead as any).link_reuniao || fallbackLink;

          const emailHTML = buildReminderHTML(
            lead.nome,
            lead.data_reuniao!,
            lead.horario_reuniao!,
            leadMeetingLink
          );

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Orbit Gestão <demonstracao@orbitgestao.com.br>",
              to: [lead.email],
              subject: `⏰ Lembrete: sua demonstração é em 1 hora — ${lead.horario_reuniao}`,
              html: emailHTML,
            }),
          });

          const emailResult = await emailResponse.json();

          // Log email
          try {
            await supabase.from("email_logs").insert({
              email_type: "lembrete_reuniao",
              recipient_email: lead.email,
              recipient_name: lead.nome,
              lead_id: lead.id,
              resend_id: emailResult?.id || null,
              success: emailResponse.ok,
              error_message: emailResponse.ok ? null : JSON.stringify(emailResult),
            });
          } catch (logErr) {
            console.warn("Failed to log email:", logErr);
          }

          if (!emailResponse.ok) {
            console.error(`Failed to send reminder to ${lead.email}:`, emailResult);
            continue;
          }

          // Mark reminder as sent
          const { error: updateError } = await supabase
            .from("leads")
            .update({ lembrete_enviado: true })
            .eq("id", lead.id);

          if (updateError) {
            console.error(`Failed to update lembrete_enviado for ${lead.email}:`, updateError);
          } else {
            sentCount++;
            console.log(`Reminder sent to ${lead.email}, Resend ID: ${emailResult.id}`);
          }
        }
      } catch (leadError) {
        console.error(`Error processing lead ${lead.email}:`, leadError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sentCount, leads_checked: leads?.length || 0 }),
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
