import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generateICS(date: string, time: string, name: string, meetingLink: string, email: string): string {
  const parts = date.split("/");
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  const [h, m] = time.split(":").map(Number);

  const startUTC = new Date(Date.UTC(year, month, day, h + 3, m, 0));
  const endUTC = new Date(startUTC.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.getUTCFullYear().toString() +
    (d.getUTCMonth() + 1).toString().padStart(2, "0") +
    d.getUTCDate().toString().padStart(2, "0") +
    "T" +
    d.getUTCHours().toString().padStart(2, "0") +
    d.getUTCMinutes().toString().padStart(2, "0") +
    "00Z";

  const now = new Date();
  const uid = `orbit-${now.getTime()}@orbitgestao.com.br`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Orbit Gestão//Demonstração//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(now)}`,
    `DTSTART:${fmt(startUTC)}`,
    `DTEND:${fmt(endUTC)}`,
    `SUMMARY:Demonstração Orbit Gestão - ${name}`,
    `DESCRIPTION:Olá ${name}!\\n\\nSua demonstração do Orbit Gestão está confirmada.\\n\\nLink da reunião: ${meetingLink}\\n\\nNos vemos em breve!`,
    `LOCATION:${meetingLink}`,
    `URL:${meetingLink}`,
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    `ORGANIZER;CN=Orbit Gestão:mailto:demonstracao@orbitgestao.com.br`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Demonstração Orbit em 30 minutos",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Demonstração Orbit em 10 minutos",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildEmailHTML(name: string, date: string, time: string, meetingLink: string): string {
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
  <span style="display:inline-block;background:#E8F5E9;color:#2E7D32;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;">
    ✅ DEMONSTRAÇÃO CONFIRMADA
  </span>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 40px 0;text-align:center;">
  <h1 style="margin:0;font-size:26px;color:#0F1319;font-weight:700;">Olá, ${name}!</h1>
  <p style="margin:8px 0 0;font-size:16px;color:#6B7280;line-height:1.5;">
    Sua demonstração do Orbit Gestão está agendada. Estamos ansiosos para te mostrar como transformar a gestão da sua empresa.
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
    Acessar Reunião
  </a>
  <p style="margin:12px 0 0;font-size:13px;color:#9CA3AF;">
    ou copie: <a href="${meetingLink}" style="color:#CC9511;text-decoration:underline;">${meetingLink}</a>
  </p>
</td></tr>

<!-- Computer warning -->
<tr><td style="padding:0 40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEE2E2;border:1px solid #FECACA;border-radius:10px;">
    <tr><td style="padding:16px 20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:28px;line-height:1;">🚫📱</p>
      <p style="margin:0;font-size:14px;color:#991B1B;line-height:1.5;font-weight:600;">
        Acesse pelo computador — a experiência não funciona pelo celular.
      </p>
    </td></tr>
  </table>
</td></tr>

<!-- Calendar tip -->
<tr><td style="padding:0 40px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0;font-size:14px;color:#795548;line-height:1.5;">
        📎 <strong>Dica:</strong> Anexamos um convite de calendário a este e-mail. Aceite-o para bloquear automaticamente o horário na sua agenda (Google, Outlook ou Apple).
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
    const { email, name, date, time, meetingLink } = await req.json();

    if (!email || !name || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, name, date, time" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const link = meetingLink || "https://meet.google.com/qpy-himp-cxj";
    const icsContent = generateICS(date, time, name, link, email);
    const emailHTML = buildEmailHTML(name, date, time, link);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orbit Gestão <demonstracao@orbitgestao.com.br>",
        to: [email],
        subject: `Demonstração confirmada — ${date} às ${time} 🚀`,
        html: emailHTML,
        attachments: [
          {
            filename: "demonstracao-orbit.ics",
            content: btoa(icsContent),
            content_type: "text/calendar; method=REQUEST",
          },
        ],
      }),
    });

    const emailResult = await emailResponse.json();

    // Log email
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      await sb.from("email_logs").insert({
        email_type: "convite_agendamento",
        recipient_email: email,
        recipient_name: name,
        resend_id: emailResult?.id || null,
        success: emailResponse.ok,
        error_message: emailResponse.ok ? null : JSON.stringify(emailResult),
      });
    } catch (logErr) {
      console.warn("Failed to log email:", logErr);
    }

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calendar invite sent successfully to:", email, "Resend ID:", emailResult.id);
    return new Response(
      JSON.stringify({ success: true, message: "Calendar invite sent", id: emailResult.id }),
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
