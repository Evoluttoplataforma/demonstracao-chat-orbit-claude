import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORBIT_RECOMMENDATION_CATALOG = [
  "Estratégico",
  "Processos",
  "Workflows / Automações",
  "Indicadores / Qualidade",
  "Pessoas / Estrutura",
  "Treinamentos",
  "CRM / Comercial",
  "Projetos",
  "Compras",
  "Reuniões / Execução / Tarefas",
] as const;

interface DiagnosticData {
  lead_nome: string;
  lead_empresa: string | null;
  setor: string;
  score_gestao: number | null;
  score_ia: number | null;
  score_total: number | null;
  maturity_level: string | null;
  ai_summary: string | null;
  sala_nome?: string | null;
  questions: Array<{ id: number; category: string; question: string; theme?: string }>;
  answers: number[] | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { responses, scope_label } = await req.json() as {
      responses: DiagnosticData[];
      scope_label?: string;
    };

    if (!responses || responses.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma resposta para analisar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const setores = responses.map(r => r.setor).filter(Boolean);
    const setorCount: Record<string, number> = {};
    setores.forEach(s => { setorCount[s] = (setorCount[s] || 0) + 1; });

    const salas = responses.map(r => r.sala_nome).filter(Boolean) as string[];
    const salaCount: Record<string, number> = {};
    salas.forEach(s => { salaCount[s] = (salaCount[s] || 0) + 1; });

    const maturityCount: Record<string, number> = {};
    responses.forEach(r => {
      if (r.maturity_level) maturityCount[r.maturity_level] = (maturityCount[r.maturity_level] || 0) + 1;
    });

    const questionScores: Record<string, { question: string; category: string; theme?: string; total: number; count: number }> = {};
    responses.forEach(r => {
      if (!r.questions || !r.answers) return;
      r.questions.forEach((q, i) => {
        const key = `${q.id}-${q.category}-${q.theme || "sem-tema"}`;
        if (!questionScores[key]) questionScores[key] = { question: q.question, category: q.category, theme: q.theme, total: 0, count: 0 };
        if (typeof r.answers?.[i] === "number") {
          questionScores[key].total += r.answers[i];
          questionScores[key].count += 1;
        }
      });
    });

    const questionAvgs = Object.values(questionScores)
      .map(q => ({ ...q, avg: q.count > 0 ? (q.total / q.count).toFixed(2) : "N/A" }))
      .sort((a, b) => (a.count > 0 && b.count > 0 ? a.total / a.count - b.total / b.count : 0));

    const weakestQuestions = questionAvgs.slice(0, 5);
    const strongestQuestions = questionAvgs.slice(-5).reverse();

    const avgGestao = responses.reduce((a, r) => a + (r.score_gestao || 0), 0) / responses.length;
    const avgIa = responses.reduce((a, r) => a + (r.score_ia || 0), 0) / responses.length;
    const avgTotal = responses.reduce((a, r) => a + (r.score_total || 0), 0) / responses.length;

    const summaries = responses
      .filter(r => r.ai_summary)
      .map(r => `[${r.setor}] ${r.ai_summary}`)
      .slice(0, 30);

    const prompt = `Você é um analista estratégico e consultor comercial da Orbit Gestão.

Analise os dados agregados de ${responses.length} diagnósticos de maturidade respondidos por leads e gere um relatório estratégico para uso do time comercial e da apresentação da turma.

## ESCOPO DA ANÁLISE
- Escopo selecionado: ${scope_label || "Visão geral"}
- Quantidade de diagnósticos: ${responses.length}

## CATÁLOGO CURADO DE MÓDULOS ELEGÍVEIS
${ORBIT_RECOMMENDATION_CATALOG.map(item => `- ${item}`).join("\n")}

REGRAS CRÍTICAS:
- O módulo obrigatório deve ser SEMPRE "Estratégico"
- Além do obrigatório, recomende exatamente 3 módulos adicionais no campo "modulos_sugeridos"
- Os 3 módulos sugeridos devem ser os mais aderentes ao grupo analisado
- NÃO repita "Estratégico" na lista de modulos_sugeridos
- Considere Projetos e Compras quando houver sinais de execução complexa, dependências, implantação, fornecedores, suprimentos, aprovações ou rastreabilidade
- O relatório deve ser objetivo e comercialmente acionável

## DADOS AGREGADOS

**Setores dos respondentes:** ${JSON.stringify(setorCount)}

**Turmas/salas presentes no recorte:** ${JSON.stringify(salaCount)}

**Distribuição de maturidade:** ${JSON.stringify(maturityCount)}

**Médias gerais:** Gestão: ${avgGestao.toFixed(2)} | IA: ${avgIa.toFixed(2)} | Total: ${avgTotal.toFixed(2)} (escala 1-5)

**Top 5 perguntas com MENOR score (maiores dores):**
${weakestQuestions.map(q => `- [${q.category}${q.theme ? `/${q.theme}` : ""}] "${q.question}" → média ${q.avg}`).join("\n")}

**Top 5 perguntas com MAIOR score (pontos fortes):**
${strongestQuestions.map(q => `- [${q.category}${q.theme ? `/${q.theme}` : ""}] "${q.question}" → média ${q.avg}`).join("\n")}

**Resumos individuais (amostra):**
${summaries.join("\n")}

## GERE O RELATÓRIO NO SEGUINTE FORMATO JSON (sem markdown, sem blocos de código):

{
  "titulo": "Título impactante do relatório",
  "escopo_analise": "Resumo curto do recorte analisado",
  "resumo_executivo": "Parágrafo de 3-4 frases com visão geral dos achados principais",
  "modulo_obrigatorio": {
    "modulo": "Estratégico",
    "porque": "Por que esse módulo é obrigatório neste contexto"
  },
  "modulos_sugeridos": [
    {
      "modulo": "Nome do módulo sugerido",
      "porque": "Justificativa comercial objetiva",
      "dores_relacionadas": ["Dor 1", "Dor 2"],
      "o_que_mostrar": "Que tipo de prova, fluxo ou demonstração mostrar na apresentação"
    }
  ],
  "principais_dores": [
    {
      "dor": "Nome curto da dor",
      "descricao": "Descrição detalhada do problema identificado",
      "percentual_afetados": "Estimativa de % dos respondentes afetados",
      "conexao_orbit": "Como a Orbit pode resolver isso especificamente"
    }
  ],
  "oportunidades_orbit": [
    {
      "oportunidade": "Nome da oportunidade",
      "descricao": "Descrição da oportunidade de negócio",
      "argumento_venda": "Pitch direto para usar na abordagem comercial"
    }
  ],
  "perfil_predominante": {
    "nivel": "Nível de maturidade predominante",
    "caracteristicas": "Descrição do perfil típico dos respondentes",
    "gaps_principais": ["Gap 1", "Gap 2", "Gap 3"]
  },
  "insights_por_setor": [
    {
      "setor": "Nome do setor",
      "insight": "Insight específico daquele setor",
      "abordagem_sugerida": "Como abordar comercialmente"
    }
  ],
  "recomendacoes_estrategicas": [
    "Recomendação 1 acionável",
    "Recomendação 2 acionável",
    "Recomendação 3 acionável"
  ]
}

IMPORTANTE: Retorne APENAS o JSON puro, sem nenhum texto adicional, sem markdown.`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error: ${err}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    const insights = JSON.parse(content);

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error generating insights:", e);
    return new Response(JSON.stringify({ error: e.message || "Erro ao gerar insights" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});