import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORBIT_MODULE_CATALOG = [
  {
    module: "Estratégico",
    focus: "direção, prioridades, indicadores, rituais de gestão e tomada de decisão",
  },
  {
    module: "Processos",
    focus: "padronização, gargalos, retrabalho, delegação e previsibilidade operacional",
  },
  {
    module: "Workflows / Automações",
    focus: "handoffs entre áreas, aprovações, alertas, automações e fluxo de execução",
  },
  {
    module: "Indicadores / Qualidade",
    focus: "KPIs, metas, qualidade, desvios, acompanhamento e melhoria contínua",
  },
  {
    module: "Pessoas / Estrutura",
    focus: "clareza de papéis, liderança, capacidade de execução, dependência de pessoas-chave",
  },
  {
    module: "Treinamentos",
    focus: "onboarding, capacitação, retenção de conhecimento e consistência de entrega",
  },
  {
    module: "CRM / Comercial",
    focus: "pipeline, follow-up, previsibilidade comercial, conversão e rotina de vendas",
  },
  {
    module: "Projetos",
    focus: "priorização, cronogramas, dependências, implantação, portfólio e acompanhamento de entregas",
  },
  {
    module: "Compras",
    focus: "fornecedores, suprimentos, aprovações, rastreabilidade, cotações e prazo de abastecimento",
  },
  {
    module: "Reuniões / Execução / Tarefas",
    focus: "cadência, follow-up, responsabilização, execução semanal e cobrança de plano de ação",
  },
] as const;

async function callAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    if (response.status === 429) throw { status: 429, message: "Rate limit exceeded" };
    if (response.status === 402) throw { status: 402, message: "Payment required" };
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  const finishReason = aiResponse.choices?.[0]?.finish_reason;
  console.log("AI finish_reason:", finishReason, "content length:", content?.length ?? 0);

  if (!content) throw new Error(`No content in AI response. finish_reason: ${finishReason}`);
  return content;
}

function parseQuestionsJSON(content: string): any[] {
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  let clean = codeBlockMatch ? codeBlockMatch[1].trim() : content.trim();

  clean = clean.replace(/,(\s*[}\]])/g, "$1");

  const parsed = JSON.parse(clean);
  const questions = parsed.questions || parsed;

  if (!Array.isArray(questions) || questions.length < 10) {
    throw new Error(`Only ${questions?.length ?? 0} questions generated, need at least 10`);
  }

  for (const q of questions) {
    if (!q.id || !q.question || !q.levels || !q.category) {
      throw new Error("Invalid question structure: missing id, category, question, or levels");
    }
  }

  return questions;
}

async function findLatestSalaPresence(supabase: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await supabase
    .from("sala_presencas")
    .select("sala_id, data_sessao, created_at, salas(nome, categoria)")
    .eq("email", email.trim().toLowerCase())
    .order("data_sessao", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error loading latest sala presence:", error);
    return null;
  }

  return data?.[0] || null;
}

async function findSalaByCurrentSession(supabase: ReturnType<typeof createClient>) {
  // Get current date/time in Brasilia timezone (UTC-3)
  const now = new Date();
  const brNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const dayOfWeek = brNow.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const todayISO = brNow.toISOString().split("T")[0]; // YYYY-MM-DD
  const currentHour = brNow.getHours();

  console.log(`Finding sala by session: dayOfWeek=${dayOfWeek}, date=${todayISO}, hour=${currentHour}`);

  // Try data_especifica first
  const { data: especifica } = await supabase
    .from("sala_horarios")
    .select("sala_id, horario, salas(nome, categoria)")
    .eq("data_especifica", todayISO)
    .eq("ativo", true)
    .eq("tipo", "pontual");

  let candidates = especifica || [];

  // Then try recorrente by dia_semana
  if (candidates.length === 0) {
    const { data: recorrente } = await supabase
      .from("sala_horarios")
      .select("sala_id, horario, salas(nome, categoria)")
      .eq("dia_semana", dayOfWeek)
      .eq("ativo", true)
      .eq("tipo", "recorrente");
    candidates = recorrente || [];
  }

  if (candidates.length === 0) {
    console.log("No sala_horarios found for today");
    return null;
  }

  // Pick the closest session by time (within ±3 hours)
  let best: typeof candidates[0] | null = null;
  let bestDiff = Infinity;

  for (const c of candidates) {
    const [h] = (c.horario as string).split(":").map(Number);
    const diff = Math.abs(currentHour - h);
    if (diff <= 3 && diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }

  if (!best) {
    console.log("No sala session within ±3h window");
    return null;
  }

  const salaInfo = best.salas as { nome?: string; categoria?: string } | null;
  console.log(`Matched sala by session: ${salaInfo?.nome} (${best.horario})`);
  return { sala_id: best.sala_id, salas: best.salas };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, setor_manual, nome_manual, celular_manual, empresa_manual } = await req.json();
    if (!email && !nome_manual) {
      return new Response(JSON.stringify({ error: "Email ou nome é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : `${(nome_manual || "anon").trim().toLowerCase().replace(/\s+/g, ".")}@placeholder.local`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1);

    const lead = leads?.[0] || null;
    let salaPresence = await findLatestSalaPresence(supabase, normalizedEmail);
    // Fallback: if no sala_presencas match, try to infer from current sala session
    if (!salaPresence) {
      console.log("No sala_presencas match, trying session-based fallback...");
      salaPresence = await findSalaByCurrentSession(supabase);
    }
    const salaInfo = (salaPresence?.salas as { nome?: string | null; categoria?: string | null } | null) ?? null;

    const setor = (setor_manual && setor_manual.trim()) ? setor_manual.trim() : (lead?.oque_faz || "empresa");
    const empresa = empresa_manual?.trim() || lead?.empresa || "";
    const cargo = lead?.cargo || "";
    const salaContext = salaInfo?.nome
      ? `Turma/Sala mais recente vinculada por presença: ${salaInfo.nome}${salaInfo.categoria ? ` (${salaInfo.categoria})` : ""}`
      : "Sem turma/sala vinculada";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um consultor especialista em gestão empresarial, desenho operacional e inteligência artificial da Orbit Gestão.
Responda APENAS com JSON válido, sem markdown, sem texto adicional.

REGRAS CRÍTICAS:
- Gere exatamente 13 perguntas
- Cada pergunta deve ter 5 níveis de resposta (escala 1-5)
- Personalize PROFUNDAMENTE para o contexto informado
- Linguagem direta, sem jargão
- Labels curtos (máx 10 palavras por nível)
- O objetivo é diagnosticar maturidade e também detectar sinais comerciais para recomendar módulos da Orbit sem citar os nomes dos módulos nas perguntas
- O campo "setor" pode conter segmento, atividade, nicho ou até o cargo do lead; use isso para inferir contexto real de operação
- Cada pergunta deve incluir o campo adicional "theme"
- Temas permitidos: "estrategia", "processos", "pessoas", "comercial", "projetos", "compras", "ia"`;

    const catalogText = ORBIT_MODULE_CATALOG
      .map(item => `- ${item.module}: ${item.focus}`)
      .join("\n");

    const userPrompt = `DADOS:
- Setor/Atividade informado pelo lead: "${setor}"
- Empresa: ${empresa}
- Cargo: ${cargo}
- Contexto de turma: ${salaContext}

CATÁLOGO CURADO ORBIT (use apenas como mapa de dores e capacidades, sem citar módulos literalmente nas perguntas):
${catalogText}

OBJETIVO:
Gerar 13 perguntas de diagnóstico ALTAMENTE PERSONALIZADAS para descobrir o nível de maturidade da empresa e captar sinais para recomendações comerciais futuras.

DISTRIBUIÇÃO OBRIGATÓRIA:
- Perguntas 1-10: category="gestao"
- Perguntas 11-13: category="ia"
- Perguntas 1-3 devem ter theme="estrategia"
- Perguntas 11-13 devem ter theme="ia"

COBERTURA MÍNIMA NAS PERGUNTAS 1-10:
- Estratégia e prioridades
- Processos, execução e gargalos operacionais
- Pessoas, estrutura e retenção de conhecimento
- Rotina comercial / CRM / follow-up
- Sinais de gestão de projetos / entregas / implantação / dependências quando fizer sentido para o contexto
- Sinais de compras / suprimentos / fornecedores / aprovações quando fizer sentido para o contexto

REGRAS DE ADERÊNCIA:
- Se o contexto sugerir operação com entregas, obras, implantação, carteira de projetos, cronogramas, múltiplas demandas simultâneas ou dependências entre áreas, inclua pelo menos 1 pergunta com theme="projetos"
- Se o contexto sugerir fornecedores, estoque, insumos, cotações, abastecimento, compras recorrentes, aprovações ou impacto de suprimentos na operação, inclua pelo menos 1 pergunta com theme="compras"
- Se o contexto não pedir explicitamente projetos ou compras, ainda assim investigue execução e dependências de forma concreta dentro do negócio
- Não use frases genéricas como "na sua empresa" ou "no seu setor" sem contexto; seja específico
- NÃO cite nomes de módulos da Orbit nas perguntas

FORMATO JSON:
{
  "questions": [
    {
      "id": 1,
      "category": "gestao",
      "theme": "estrategia",
      "question": "pergunta personalizada mencionando processos reais do contexto",
      "levels": {
        "1": "nível 1",
        "2": "nível 2",
        "3": "nível 3",
        "4": "nível 4",
        "5": "nível 5"
      }
    }
  ]
}

IMPORTANTE:
- Responda APENAS com o JSON, nada mais
- As perguntas devem soar como consultoria prática, não como questionário genérico
- Os níveis devem mostrar evolução clara de maturidade
- As perguntas 11-13 devem medir prontidão de dados, uso prático de IA e visão estratégica de automação/IA.`;

    const MAX_RETRIES = 3;
    let lastError: any = null;
    let questions: any[] | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${MAX_RETRIES} for sector: ${setor}`);
        const content = await callAI(systemPrompt, userPrompt, LOVABLE_API_KEY);
        questions = parseQuestionsJSON(content);
        console.log(`Success on attempt ${attempt}: ${questions.length} questions generated`);
        break;
      } catch (err: any) {
        lastError = err;
        console.error(`Attempt ${attempt} failed:`, err.message || err);

        if (err.status === 429 || err.status === 402) {
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: err.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (attempt < MAX_RETRIES) {
          const waitMs = attempt * 2000;
          console.log(`Waiting ${waitMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }
    }

    if (!questions) {
      console.error("All retries exhausted. Last error:", lastError);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar perguntas após múltiplas tentativas. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadNome = lead ? `${lead.nome} ${lead.sobrenome || ""}`.trim() : (nome_manual?.trim() || normalizedEmail.split("@")[0]);
    const { data: diagnostic, error: insertError } = await supabase
      .from("diagnostic_responses")
      .insert({
        lead_id: lead?.id || null,
        lead_email: normalizedEmail,
        lead_nome: leadNome,
        lead_celular: celular_manual?.trim() || lead?.whatsapp || null,
        lead_empresa: empresa || null,
        setor,
        questions,
        meeting_date: lead?.data_reuniao || null,
        meeting_time: lead?.horario_reuniao || null,
        sala_id: salaPresence?.sala_id || null,
        sala_nome: salaInfo?.nome || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save diagnostic");
    }

    return new Response(JSON.stringify({
      diagnostic_id: diagnostic.id,
      lead_nome: leadNome,
      empresa,
      setor,
      questions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-diagnostic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});