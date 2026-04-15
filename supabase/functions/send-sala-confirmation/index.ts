import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildConfirmationHTML(
  nome: string,
  salaNome: string,
  categoria: string,
  dataSessao: string,
  horario: string,
  linkSala: string,
): string {
  const isOnboarding = categoria.startsWith("onboarding");
  const badgeText = isOnboarding ? "ONBOARDING CONFIRMADO" : "PRESENÇA CONFIRMADA";
  const badgeBg = isOnboarding ? "#E8F5E9" : "#E3F2FD";
  const badgeColor = isOnboarding ? "#2E7D32" : "#1565C0";
  const emoji = isOnboarding ? "🚀" : "✅";
  const subtitleText = isOnboarding
    ? "Sua sessão de onboarding do Orbit está confirmada. Prepare-se para configurar tudo e começar a usar a plataforma."
    : "Sua presença na sessão de tira-dúvidas está confirmada. Prepare suas perguntas!";

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
  <span style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;">
    ${emoji} ${badgeText}
  </span>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 40px 0;text-align:center;">
  <h1 style="margin:0;font-size:26px;color:#0F1319;font-weight:700;">Olá, ${nome}!</h1>
  <p style="margin:8px 0 0;font-size:16px;color:#6B7280;line-height:1.5;">
    ${subtitleText}
  </p>
</td></tr>

<!-- Session info -->
  <tr><td style="padding:24px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;">
    <tr>
      <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;" width="25%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">📅 Data</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${dataSessao}</p>
      </td>
      <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;" width="25%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">🕐 Horário</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${horario}</p>
      </td>
      <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;" width="25%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">⏱️ Duração</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${isOnboarding ? "3 horas" : "1 hora"}</p>
      </td>
      <td style="padding:20px;text-align:center;" width="25%">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">🎯 Sala</p>
        <p style="margin:0;font-size:18px;color:#0F1319;font-weight:700;">${salaNome}</p>
      </td>
    </tr>
  </table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:0 40px 24px;text-align:center;">
  <a href="${linkSala}" style="display:inline-block;background:#CC9511;color:#ffffff;padding:16px 48px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">
    Acessar Sala
  </a>
  <p style="margin:12px 0 0;font-size:13px;color:#9CA3AF;">
    ou copie: <a href="${linkSala}" style="color:#CC9511;text-decoration:underline;">${linkSala}</a>
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

<!-- Tip -->
<tr><td style="padding:0 40px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0;font-size:14px;color:#795548;line-height:1.5;">
        💡 <strong>Dica:</strong> Salve o link da sala e entre no horário agendado. A sessão será ao vivo por videoconferência.
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
    const { nome, email, sala_nome, categoria, data_sessao, horario, link_sala } = await req.json();

    if (!nome || !email || !sala_nome || !data_sessao || !horario) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Format date for display (YYYY-MM-DD -> DD/MM/YYYY)
    const [y, m, d] = data_sessao.split("-");
    const displayDate = `${d}/${m}/${y}`;

    const isOnboarding = (categoria || "").startsWith("onboarding");
    const subject = isOnboarding
      ? `Onboarding confirmado — ${displayDate} às ${horario} 🚀`
      : `Presença confirmada — ${displayDate} às ${horario} ✅`;

    const emailHTML = buildConfirmationHTML(
      nome, sala_nome, categoria || "onboarding", displayDate, horario, link_sala || ""
    );

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orbit Gestão <demonstracao@orbitgestao.com.br>",
        to: [email],
        subject,
        html: emailHTML,
      }),
    });

    const emailResult = await emailResponse.json();

    // Log email
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      await sb.from("email_logs").insert({
        email_type: isOnboarding ? "confirmacao_onboarding" : "confirmacao_tira_duvidas",
        recipient_email: email,
        recipient_name: nome,
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

    console.log("Sala confirmation sent to:", email, "Resend ID:", emailResult.id);
    return new Response(
      JSON.stringify({ success: true, id: emailResult.id }),
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
