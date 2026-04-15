import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, existingSlide } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um assistente especialista em criar slides para apresentações comerciais do Orbit — plataforma de gestão com IA do Grupo GSN (Templum + Evolutto).

Contexto do produto:
- Orbit usa IA (Olivia) para mapear processos, criar KPIs e organizar gestão
- Público: empresários de PMEs e consultores de gestão
- Tom: direto, provocativo, profissional, urgente
- Referências: "Mapa de Guerra", "balde furado", "apagar incêndios", "língua do lucro"

${existingSlide ? `Slide atual para editar:
- Título: "${existingSlide.title}"
- Layout: "${existingSlide.layoutType}"
- Conteúdo: ${JSON.stringify(existingSlide.content)}

Edite conforme solicitado mantendo o estilo e tom.` : "Crie um novo slide com conteúdo persuasivo e impactante."}

IMPORTANTE: Gere todo conteúdo em português brasileiro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_slide",
            description: "Cria ou edita um slide de apresentação",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título principal do slide" },
                layoutType: {
                  type: "string",
                  enum: ["hero", "statement", "stats", "split", "cards", "steps", "comparison", "cta"],
                  description: "Tipo de layout: hero (capa), statement (afirmação), stats (estatísticas), split (lista dividida), cards (cartões), steps (passos), comparison (antes/depois), cta (chamada para ação)",
                },
                content: {
                  type: "object",
                  properties: {
                    tag: { type: "string", description: "Categoria/tag do slide" },
                    subtitle: { type: "string" },
                    body: { type: "string", description: "Texto principal (para layout statement)" },
                    items: { type: "array", items: { type: "string" }, description: "Lista de itens (para layout split)" },
                    cards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { title: { type: "string" }, desc: { type: "string" }, badge: { type: "string" } },
                        required: ["title", "desc"],
                      },
                    },
                    stats: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { value: { type: "string" }, label: { type: "string" } },
                        required: ["value", "label"],
                      },
                    },
                    steps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { num: { type: "string" }, title: { type: "string" }, desc: { type: "string" } },
                        required: ["num", "title", "desc"],
                      },
                    },
                    comparisons: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { before: { type: "string" }, after: { type: "string" } },
                        required: ["before", "after"],
                      },
                    },
                    footer: { type: "string" },
                    buttonText: { type: "string" },
                    buttonLink: { type: "string" },
                    badges: { type: "array", items: { type: "string" } },
                    highlight: { type: "string", description: "Parte do título que deve ficar destacada em cor" },
                  },
                },
              },
              required: ["title", "layoutType", "content"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_slide" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "IA não retornou resultado estruturado" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slide = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ slide }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-slide error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
