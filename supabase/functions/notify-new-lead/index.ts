import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NOTIFY_EMAIL = "roberta.soares@evolutto.com";

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const lead = await req.json();
    const nome = lead.nome || "Sem nome";
    const empresa = lead.empresa || "—";

    const fieldLabels: Record<string, string> = {
      nome: "Nome",
      sobrenome: "Sobrenome",
      whatsapp: "WhatsApp",
      email: "E-mail",
      empresa: "Empresa",
      cargo: "Cargo",
      oque_faz: "O que faz",
      faturamento: "Faturamento",
      funcionarios: "Funcionários",
      prioridade: "Prioridade",
      software_gestao: "Software de Gestão",
      data_reuniao: "Data da Reunião",
      horario_reuniao: "Horário da Reunião",
      status: "Status",
      copy_variant: "Variante",
      origin_page: "Página de Origem",
      landing_page: "Landing Page",
      utm_source: "UTM Source",
      utm_medium: "UTM Medium",
      utm_campaign: "UTM Campaign",
      utm_content: "UTM Content",
      utm_term: "UTM Term",
    };

    const rows = Object.entries(fieldLabels)
      .filter(([key]) => lead[key] && String(lead[key]).trim() !== "")
      .map(([key, label]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#0F1319;width:180px">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333">${escapeHtml(String(lead[key]))}</td>
        </tr>`)
      .join("");

    const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0F1319;padding:24px 32px">
        <h1 style="color:#CC9511;margin:0;font-size:20px">🚀 Novo Lead Capturado</h1>
        <p style="color:#ccc;margin:6px 0 0;font-size:14px">${escapeHtml(nome)} — ${escapeHtml(empresa)}</p>
      </div>
      <div style="padding:24px 32px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${rows}
        </table>
      </div>
      <div style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#888">
        Orbit Gestão — Notificação automática
      </div>
    </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orbit Gestão <notify@orbitgestao.com.br>",
        to: [NOTIFY_EMAIL],
        subject: `🚀 Novo Lead: ${nome} — ${empresa}`,
        html,
      }),
    });

    const result = await res.json();
    console.log(`[notify-new-lead] Resend response: ${res.status}`, result);

    return new Response(JSON.stringify({ success: res.ok, result }), {
      status: res.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[notify-new-lead] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
