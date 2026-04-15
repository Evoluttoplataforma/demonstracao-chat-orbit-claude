import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcription, lead_nome, setor } = await req.json();

    if (!transcription || transcription.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Transcrição muito curta. Cole pelo menos um trecho significativo da reunião." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um analista de vendas especialista em consultoria de gestão empresarial e implementação de IA. 
Sua tarefa é analisar a transcrição de uma reunião de demonstração e gerar um resumo estruturado.

CONTEXTO:
- A empresa é a Orbit Gestão, que vende agentes de IA para gestão empresarial
- O lead se chama "${lead_nome}" e atua no setor "${setor}"

RETORNE EXATAMENTE este JSON (sem markdown, sem blocos de código):
{
  "resumo": "Resumo executivo da reunião em 2-3 parágrafos. Inclua os principais pontos discutidos, dores identificadas e interesses demonstrados.",
  "proximos_passos_lead": ["Lista de 3-5 ações que o lead precisa tomar como próximos passos"],
  "acoes_vendedor": ["Lista de 3-5 ações que o vendedor precisa executar para avançar este lead no funil"],
  "temperatura": "quente|morno|frio",
  "observacoes": "Observações adicionais relevantes sobre o perfil do lead, objeções levantadas, ou oportunidades identificadas"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcrição da reunião:\n\n${transcription}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response, handling potential markdown wrapping
    let summary;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      summary = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-transcription error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
