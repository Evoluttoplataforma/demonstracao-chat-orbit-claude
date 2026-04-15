import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIPEDRIVE_BASE = "https://api.pipedrive.com/v1";
const PIPEDRIVE_V2 = "https://api.pipedrive.com/api/v2";

function normalizeLabelIds(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === 'string') return value.split(',').map(s => Number(s.trim())).filter(Number.isFinite);
  return [];
}

async function ensureDealLabel(token: string, labelName: string, color?: string): Promise<number> {
  const res = await fetch(`${PIPEDRIVE_BASE}/dealFields?api_token=${token}`);
  const fieldsData = await res.json();
  const labelField = fieldsData.data?.find((f: { key: string }) => f.key === 'label');
  if (!labelField) throw new Error('Label field not found');

  const existing = labelField.options?.find((o: { label: string }) =>
    o.label.toLowerCase() === labelName.toLowerCase()
  );
  if (existing) return existing.id;

  const currentOptions = (labelField.options || []).map((o: { id: number; label: string; color?: string }) => ({
    id: o.id,
    label: o.label, ...(o.color ? { color: o.color } : {}),
  }));
  currentOptions.push({ label: labelName, ...(color ? { color } : {}) } as any);

  const updateRes = await fetch(`${PIPEDRIVE_BASE}/dealFields/${labelField.id}?api_token=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ options: currentOptions }),
  });
  const updated = await updateRes.json();
  const newOption = updated.data?.options?.find((o: { label: string }) =>
    o.label.toLowerCase() === labelName.toLowerCase()
  );
  if (!newOption) throw new Error(`Failed to create label "${labelName}"`);
  return newOption.id;
}

async function addDealLabel(token: string, dealId: number, labelName: string, color?: string) {
  const labelId = await ensureDealLabel(token, labelName, color);

  // Get existing labels on the deal via v2
  const dealRes = await fetch(`${PIPEDRIVE_V2}/deals/${dealId}?api_token=${token}`);
  const dealData = await dealRes.json();
  const existingIds = normalizeLabelIds(dealData.data?.label_ids);

  if (existingIds.includes(labelId)) {
    console.log(`[Label] Deal ${dealId} already has "${labelName}"`);
    return;
  }

  const mergedIds = [...existingIds, labelId];
  console.log(`[Label] Existing label_ids on deal ${dealId}: ${JSON.stringify(existingIds)}, new labelId: ${labelId}, merging to: ${JSON.stringify(mergedIds)}`);
  const patchRes = await fetch(`${PIPEDRIVE_V2}/deals/${dealId}?api_token=${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label_ids: mergedIds }),
  });
  const patchData = await patchRes.json();
  console.log(`[Label] PATCH response: success=${patchData.success}, result_label_ids=${JSON.stringify(patchData.data?.label_ids)}`);
}

function getMaturityLevel(score: number, isConsultor = false): string {
  if (isConsultor) {
    if (score <= 1.5) return "Consultor Iniciante";
    if (score <= 2.5) return "Consultor em Estruturação";
    if (score <= 3.5) return "Consultor Consolidado";
    if (score <= 4.5) return "Canal Avançado";
    return "Canal Referência";
  }
  if (score <= 1.5) return "Iniciante";
  if (score <= 2.5) return "Básico";
  if (score <= 3.5) return "Intermediário";
  if (score <= 4.5) return "Avançado";
  return "Referência";
}

function getMaturityColor(level: string): string {
  const map: Record<string, string> = {
    "Iniciante": "#ef4444",
    "Básico": "#f97316",
    "Intermediário": "#eab308",
    "Avançado": "#22c55e",
    "Referência": "#3b82f6",
  };
  return map[level] || "#6b7280";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { diagnostic_id, answers, source } = await req.json();
    const isFromChat = source === "chat";
    if (!diagnostic_id || !answers || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "diagnostic_id e answers são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: diag, error: diagError } = await supabase
      .from("diagnostic_responses")
      .select("*")
      .eq("id", diagnostic_id)
      .single();

    if (diagError || !diag) {
      return new Response(JSON.stringify({ error: "Diagnóstico não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const questions = diag.questions as Array<{ id: number; category: string; question: string; levels?: Record<string, string> }>;
    const isConsultorDiag = questions.some(q => q.category === "canal");

    let scoreGestao: number;
    let scoreIa: number;
    let scoreTotal: number;

    if (isConsultorDiag) {
      // Consultant: split into "Negócio" (questions 1-5) and "Escala" (questions 6-10)
      const negocioAnswers = answers.slice(0, 5);
      const escalaAnswers = answers.slice(5, 10);
      scoreGestao = negocioAnswers.reduce((a: number, b: number) => a + b, 0) / negocioAnswers.length;
      scoreIa = escalaAnswers.reduce((a: number, b: number) => a + b, 0) / escalaAnswers.length;
      scoreTotal = answers.reduce((a: number, b: number) => a + b, 0) / answers.length;
    } else {
      // Standard: gestao vs ia categories
      const gestaoAnswers = answers.filter((_: number, i: number) => questions[i]?.category === "gestao");
      const iaAnswers = answers.filter((_: number, i: number) => questions[i]?.category === "ia");
      scoreGestao = gestaoAnswers.length > 0
        ? gestaoAnswers.reduce((a: number, b: number) => a + b, 0) / gestaoAnswers.length
        : 0;
      scoreIa = iaAnswers.length > 0
        ? iaAnswers.reduce((a: number, b: number) => a + b, 0) / iaAnswers.length
        : 0;
      scoreTotal = answers.reduce((a: number, b: number) => a + b, 0) / answers.length;
    }

    const maturityLevel = getMaturityLevel(scoreTotal, isConsultorDiag);

    // Generate AI summary
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiSummary = "";

    if (LOVABLE_API_KEY) {
      try {
        const qaPairs = questions.map((q, i) => `${q.question}: ${answers[i]}/5`).join("\n");

        const systemContent = isConsultorDiag
          ? `Você é um estrategista de canais do Orbit Gestão. O Orbit oferece um modelo Full White Label para consultores, onde eles revendem o Orbit com sua própria marca e geram receita recorrente passiva. Gere uma análise estruturada do perfil do consultor usando EXATAMENTE este formato:

**Seu Perfil como Canal**
Um parágrafo de 3-4 frases avaliando o potencial do consultor como parceiro de canal. Seja direto e provocativo.

**Onde você está deixando dinheiro na mesa**
Liste 2-3 oportunidades perdidas com bullet points (use •). Para cada uma, explique como o Orbit resolve.

**Como o Orbit transforma seu modelo**
Para cada fraqueza identificada, explique como o modelo Full White Label + Recorrência Passiva do Orbit resolve. Use bullet points (•). Exemplos: ticket médio maior com tecnologia embarcada, recorrência passiva sem aumentar horas, diferenciação com IA e marca própria.

**Potencial de Receita**
Um parágrafo curto sobre o potencial de receita recorrente que o consultor pode construir com o Orbit, baseado no perfil detectado.

REGRAS:
- Use ** para negritar títulos de seção e termos importantes
- Use • para bullet points
- Separe seções com quebra de linha dupla
- Foque 100% na proposta de valor do Orbit para consultores: White Label, Recorrência Passiva, Escalabilidade, IA
- Referencie os scores reais do diagnóstico
- NÃO use markdown de heading (#), apenas **negrito**`
          : `Você é um consultor estratégico do Orbit Gestão. Gere uma análise estruturada do diagnóstico da empresa usando EXATAMENTE este formato com os marcadores abaixo (use ** para negrito):

**Resumo Executivo**
Um parágrafo de 3-4 frases identificando os pontos críticos da empresa em gestão e IA. Seja direto e provocativo.

**Onde sua empresa mais sangra**
Liste 2-3 áreas críticas com bullet points (use •). Para cada uma, explique o impacto no negócio em 1 frase.

**Como o Orbit eleva sua nota**
Para cada área fraca, explique objetivamente qual agente ou módulo do Orbit resolve (Estrategista, Processos, Treinamento, Indicadores) e qual a melhoria esperada. Use bullet points (•). Exemplo: "• O agente Estrategista redefine sua cadência decisória, elevando o score de Direção de X para próximo de 4+."

**Maturidade em IA**
Um parágrafo curto sobre o nível de preparo da empresa para adotar IA e como o Orbit acelera essa jornada.

REGRAS:
- Use ** para negritar títulos de seção e termos importantes
- Use • para bullet points
- Separe seções com quebra de linha dupla
- Seja conciso mas acionável
- Referencie os scores reais do diagnóstico
- NÃO use markdown de heading (#), apenas **negrito**`;

        const userContent = isConsultorDiag
          ? `Consultor de ${diag.setor}\nNível: ${maturityLevel}\nScore Negócio (receita, carteira, retenção, digitalização, white label): ${scoreGestao.toFixed(1)}/5\nScore Escala (vendas, escalabilidade, ticket, diferenciação, visão): ${scoreIa.toFixed(1)}/5\nScore Total: ${scoreTotal.toFixed(1)}/5\n\nRespostas:\n${qaPairs}`
          : `Empresa do setor: ${diag.setor}\nNível: ${maturityLevel}\nScore Gestão (Direção + Processos + Pessoas, P1-10): ${scoreGestao.toFixed(1)}/5\nScore Maturidade IA (P11-13): ${scoreIa.toFixed(1)}/5\nScore Total: ${scoreTotal.toFixed(1)}/5\n\nRespostas:\n${qaPairs}`;

        const summaryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemContent },
              { role: "user", content: userContent },
            ],
          }),
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          aiSummary = summaryData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI summary error:", e);
      }
    }

    // Update diagnostic record
    const { error: updateError } = await supabase
      .from("diagnostic_responses")
      .update({
        answers,
        score_gestao: parseFloat(scoreGestao.toFixed(2)),
        score_ia: parseFloat(scoreIa.toFixed(2)),
        score_total: parseFloat(scoreTotal.toFixed(2)),
        maturity_level: maturityLevel,
        ai_summary: aiSummary,
      })
      .eq("id", diagnostic_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save answers");
    }

    // Update lead status — only for sala diagnostics, NOT inline chat
    if (diag.lead_id && !isFromChat) {
      await supabase
        .from("leads")
        .update({
          status_reuniao: "participou",
          confirmou_participacao: true,
          etapa_pipedrive: "Participou Reunião Grupo",
        })
        .eq("id", diag.lead_id);
    }

    // Pipedrive: always add note, only move deal stage for sala diagnostics (not chat)
    const pipedriveToken = Deno.env.get("PIPEDRIVE_API_TOKEN");
    if (pipedriveToken && diag.lead_id) {
      try {
        const { data: lead } = await supabase
          .from("leads")
          .select("pipedrive_deal_id")
          .eq("id", diag.lead_id)
          .single();

        if (lead?.pipedrive_deal_id) {
          // Move deal stage only for sala diagnostics, NOT inline chat
          if (!isFromChat) {
            const dealRes = await fetch(`${PIPEDRIVE_BASE}/deals/${lead.pipedrive_deal_id}?api_token=${pipedriveToken}`);
            const dealData = await dealRes.json();
            const pipelineId = dealData.data?.pipeline_id;

            if (pipelineId) {
              const stagesRes = await fetch(`${PIPEDRIVE_BASE}/stages?pipeline_id=${pipelineId}&api_token=${pipedriveToken}`);
              const stagesData = await stagesRes.json();

              let targetStage = stagesData.data?.find((s: { name: string }) =>
                s.name.toLowerCase().includes("participou")
              );

              if (!targetStage) {
                const stages = stagesData.data || [];
                const sorted = stages.sort((a: { order_nr: number }, b: { order_nr: number }) => a.order_nr - b.order_nr);
                const lastOrder = sorted.length > 0 ? sorted[sorted.length - 1].order_nr : 0;
                const createRes = await fetch(`${PIPEDRIVE_BASE}/stages?api_token=${pipedriveToken}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: "Participou Reunião Grupo", pipeline_id: pipelineId, order_nr: lastOrder + 1 }),
                });
                const createResult = await createRes.json();
                if (createResult.success) targetStage = createResult.data;
              }

              if (targetStage) {
                await fetch(`${PIPEDRIVE_BASE}/deals/${lead.pipedrive_deal_id}?api_token=${pipedriveToken}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stage_id: targetStage.id }),
                });
              }
            }
          }

          // Always add diagnostic note to Pipedrive (HTML format for better readability)
          const formatAnswerRow = (q: typeof questions[0], i: number) => {
            const v = answers[i];
            const txt = q.levels?.[String(v)] || '';
            const barWidth = (v / 5) * 100;
            const barColor = v <= 2 ? '#e74c3c' : v <= 3 ? '#f39c12' : '#27ae60';
            return `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;width:50%">${q.question}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;color:${barColor}">${v}/5</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;color:#666">${txt}</td>
            </tr>`;
          };

          const answersTable = `<table style="width:100%;border-collapse:collapse;margin-top:8px">
            <tr style="background:#f5f5f5">
              <th style="padding:6px 8px;text-align:left;font-size:12px;color:#666">Pergunta</th>
              <th style="padding:6px 8px;text-align:center;font-size:12px;color:#666">Nota</th>
              <th style="padding:6px 8px;text-align:left;font-size:12px;color:#666">Resposta</th>
            </tr>
            ${questions.map((q, i) => formatAnswerRow(q, i)).join("")}
          </table>`;

          const title = isConsultorDiag
            ? `📊 Diagnóstico de Canal${isFromChat ? " (via Chat)" : ""}`
            : `📊 Diagnóstico de Maturidade${isFromChat ? " (via Chat)" : ""}`;

          const scoresHtml = isConsultorDiag
            ? `<div style="display:flex;gap:16px;margin:12px 0">
                <div><strong>💼 Negócio:</strong> ${scoreGestao.toFixed(1)}/5</div>
                <div><strong>📈 Escala:</strong> ${scoreIa.toFixed(1)}/5</div>
                <div><strong>⭐ Total:</strong> ${scoreTotal.toFixed(1)}/5</div>
                <div><strong>🏷️ Nível:</strong> ${maturityLevel}</div>
              </div>`
            : `<div style="display:flex;gap:16px;margin:12px 0">
                <div><strong>🎯 Gestão:</strong> ${scoreGestao.toFixed(1)}/5</div>
                <div><strong>🤖 IA:</strong> ${scoreIa.toFixed(1)}/5</div>
                <div><strong>⭐ Total:</strong> ${scoreTotal.toFixed(1)}/5</div>
                <div><strong>🏷️ Nível:</strong> ${maturityLevel}</div>
              </div>`;

          const sectorLine = !isConsultorDiag ? `<div style="margin-bottom:8px"><strong>Setor:</strong> ${diag.setor}</div>` : `<div style="margin-bottom:8px"><strong>Perfil:</strong> Consultor/Canal</div>`;

          // Truncate AI summary for Pipedrive readability (max ~500 chars)
          const truncatedSummary = aiSummary
            ? (aiSummary.length > 500 ? aiSummary.substring(0, 500).replace(/\s+\S*$/, '...') : aiSummary)
            : '';

          const summaryBlock = truncatedSummary
            ? `<div style="background:#f9f9f0;border-left:3px solid #c8a52e;padding:10px 12px;margin:12px 0;font-size:13px;color:#333">${truncatedSummary.replace(/\n/g, '<br>')}</div>`
            : '';

          const noteContent = `<h3>${title}</h3>${sectorLine}${scoresHtml}${summaryBlock}<h4>📝 Respostas</h4>${answersTable}`;

          await fetch(`${PIPEDRIVE_BASE}/notes?api_token=${pipedriveToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: noteContent,
              deal_id: lead.pipedrive_deal_id,
              pinned_to_deal_flag: 0,
            }),
          });
          console.log(`[submit-diagnostic] Pipedrive note added for deal ${lead.pipedrive_deal_id} (source: ${isFromChat ? "chat" : "sala"})`);

          // Add "Diagnóstico" label to deal (preserving existing labels)
          try {
            await addDealLabel(pipedriveToken, lead.pipedrive_deal_id, "DIAGNÓSTICO", "purple");
          } catch (labelErr) {
            console.error("[submit-diagnostic] Failed to add Diagnóstico label:", labelErr);
          }
        }
      } catch (e) {
        console.error("Pipedrive error:", e);
      }
    }

    // Send email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && diag.lead_email) {
      try {
        const matColor = getMaturityColor(maturityLevel);
        const emailTitle = isConsultorDiag ? "Seu Diagnóstico de Canal" : "Seu Diagnóstico de Maturidade";
        const emailSubtitle = isConsultorDiag ? "Potencial como Parceiro — Orbit Gestão" : "Gestão & Inteligência Artificial — Orbit Gestão";
        const emailIntro = isConsultorDiag
          ? "Aqui está o resultado do seu diagnóstico de potencial como canal parceiro Orbit."
          : "Aqui está o resultado do seu diagnóstico de maturidade em Gestão e Inteligência Artificial.";
        const label1 = isConsultorDiag ? "Negócio" : "Gestão";
        const label2 = isConsultorDiag ? "Escala" : "IA";

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#1a1a2e;font-size:24px;margin:0;">${emailTitle}</h1>
    <p style="color:#666;font-size:14px;">${emailSubtitle}</p>
  </div>
  
  <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="margin:0 0 8px;color:#333;">Olá <strong>${diag.lead_nome}</strong>,</p>
    <p style="margin:0;color:#666;font-size:14px;">${emailIntro}</p>
  </div>

  <div style="display:flex;gap:12px;margin-bottom:24px;">
    <div style="flex:1;background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">${label1}</p>
      <p style="color:#c8a52e;font-size:28px;font-weight:bold;margin:0;">${scoreGestao.toFixed(1)}</p>
      <p style="color:#666;font-size:12px;margin:4px 0 0;">/5.0</p>
    </div>
    <div style="flex:1;background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">${label2}</p>
      <p style="color:#c8a52e;font-size:28px;font-weight:bold;margin:0;">${scoreIa.toFixed(1)}</p>
      <p style="color:#666;font-size:12px;margin:4px 0 0;">/5.0</p>
    </div>
    <div style="flex:1;background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Total</p>
      <p style="color:#c8a52e;font-size:28px;font-weight:bold;margin:0;">${scoreTotal.toFixed(1)}</p>
      <p style="color:#666;font-size:12px;margin:4px 0 0;">/5.0</p>
    </div>
  </div>

  <div style="text-align:center;margin-bottom:24px;">
    <span style="display:inline-block;background:${matColor};color:white;padding:8px 24px;border-radius:20px;font-weight:bold;font-size:16px;">
      ${maturityLevel}
    </span>
  </div>

  ${aiSummary ? `<div style="background:#f0f4ff;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
    <p style="margin:0;color:#333;font-size:14px;line-height:1.6;">${aiSummary}</p>
  </div>` : ""}

  <div style="margin-bottom:24px;">
    <h2 style="color:#1a1a2e;font-size:16px;margin:0 0 16px;">Suas Respostas</h2>
    ${questions.map((q, i) => `
    <div style="padding:12px 0;border-bottom:1px solid #eee;">
      <p style="margin:0 0 4px;color:#333;font-size:13px;">${q.question}</p>
      <p style="margin:0;color:#c8a52e;font-weight:bold;font-size:14px;">${answers[i]}/5</p>
    </div>`).join("")}
  </div>

  <div style="text-align:center;padding:24px 0;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">Orbit Gestão — Transformando empresas com IA</p>
  </div>
</div>
</body>
</html>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Orbit Gestão <demonstracao@orbitgestao.com.br>",
            to: [diag.lead_email],
            subject: isConsultorDiag ? `Seu Diagnóstico de Canal — ${maturityLevel}` : `Seu Diagnóstico de Maturidade — ${maturityLevel}`,
            html: emailHtml,
          }),
        });
        console.log(`[submit-diagnostic] Email sent to ${diag.lead_email}`);
      } catch (e) {
        console.error("Email error:", e);
      }
    }

    return new Response(JSON.stringify({
      score_gestao: parseFloat(scoreGestao.toFixed(2)),
      score_ia: parseFloat(scoreIa.toFixed(2)),
      score_total: parseFloat(scoreTotal.toFixed(2)),
      maturity_level: maturityLevel,
      ai_summary: aiSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-diagnostic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
