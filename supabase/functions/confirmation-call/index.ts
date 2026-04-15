import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TWILIO_GATEWAY = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase env vars");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");
    if (!TWILIO_PHONE_NUMBER) throw new Error("TWILIO_PHONE_NUMBER is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();

    // Support both lead-based and direct data
    let nome: string;
    let telefone: string;
    let empresa: string;
    let contexto: string;
    let leadId: string | null = null;
    let presencaId: string | null = null;
    let tableName: "leads" | "sala_presencas" = "leads";

    if (body.leadId) {
      leadId = body.leadId;
      const { data: lead, error } = await supabase.from("leads").select("*").eq("id", leadId).single();
      if (error || !lead) throw new Error(`Lead not found: ${leadId}`);
      nome = lead.nome;
      telefone = lead.whatsapp;
      empresa = lead.empresa || "sua empresa";
      contexto = `Reunião de demonstração do Orbit Gestão agendada para ${lead.data_reuniao} às ${lead.horario_reuniao}. A pessoa é ${lead.cargo || "profissional"} da empresa ${empresa}, que fatura ${lead.faturamento || "não informado"} e tem ${lead.funcionarios || "não informado"} funcionários. Setor: ${lead.oque_faz || "não informado"}.`;
      tableName = "leads";
    } else if (body.presencaId) {
      presencaId = body.presencaId;
      const { data: presenca, error } = await supabase.from("sala_presencas").select("*").eq("id", presencaId).single();
      if (error || !presenca) throw new Error(`Presença not found: ${presencaId}`);
      nome = presenca.nome;
      telefone = presenca.whatsapp || "";
      empresa = "sua empresa";
      contexto = `Sessão de sala agendada para ${presenca.data_sessao}. Participante confirmado.`;
      tableName = "sala_presencas";
    } else if (body.nome && body.telefone) {
      nome = body.nome;
      telefone = body.telefone;
      empresa = body.empresa || "sua empresa";
      contexto = body.contexto || "Reunião agendada em breve.";
    } else {
      throw new Error("Must provide leadId, presencaId, or {nome, telefone}");
    }

    if (!telefone || telefone.replace(/\D/g, "").length < 10) {
      throw new Error(`Invalid phone number: ${telefone}`);
    }

    // Normalize phone to E.164
    let phoneDigits = telefone.replace(/\D/g, "");
    if (!phoneDigits.startsWith("55") && phoneDigits.length <= 11) {
      phoneDigits = "55" + phoneDigits;
    }
    const phoneE164 = "+" + phoneDigits;

    console.log(`[confirmation-call] Generating script for ${nome} (${phoneE164})`);

    // 1. Generate provocative script via Lovable AI (Gemini Flash)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é a Olívia, assistente de inteligência artificial da Orbit Gestão. Sua missão é gerar um SCRIPT DE LIGAÇÃO curto e impactante para confirmar a presença de alguém em uma reunião/sessão que começa em poucos minutos.

REGRAS DO SCRIPT:
- Comece SEMPRE com: "Oi [nome do participante], aqui é a Olívia, da Orbit Gestão."
- Máximo 3-4 frases curtas após a saudação (15-20 segundos de fala total)
- Tom profissional, direto e levemente provocativo — enfatize o custo de oportunidade de NÃO participar
- Se tiver dados de faturamento/funcionários, use-os para personalizar o impacto ("empresas do porte da ${empresa}, com X funcionários, costumam perder Y horas por semana sem processos estruturados")
- Finalize com uma frase curta pedindo confirmação: "Posso confirmar sua presença?"
- NÃO use emojis, hashtags, aspas ou formatação — é texto puro para ser falado em voz alta
- Português brasileiro natural e fluido, como uma conversa real
- Varie o estilo a cada geração — não repita estruturas idênticas
- NUNCA mencione que você é uma IA ou assistente virtual na ligação`,
          },
          {
            role: "user",
            content: `Gere o script de ligação para confirmar a presença de ${nome} da empresa ${empresa}.\n\nContexto: ${contexto}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const script = aiData.choices?.[0]?.message?.content?.trim();
    if (!script) throw new Error("AI returned empty script");

    console.log(`[confirmation-call] Script generated (${script.length} chars): ${script.substring(0, 100)}...`);

    // 2. Convert to audio via OpenAI TTS
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: script,
        voice: "nova",
        response_format: "mp3",
        speed: 1.05,
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error("OpenAI TTS error:", ttsResponse.status, errText);
      throw new Error(`OpenAI TTS error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log(`[confirmation-call] Audio generated: ${audioBuffer.byteLength} bytes`);

    // 3. Upload MP3 to call-audio bucket
    const fileName = `call-${Date.now()}-${phoneDigits}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("call-audio")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/call-audio/${fileName}`;
    console.log(`[confirmation-call] Audio uploaded: ${audioUrl}`);

    // 4. Initiate call via Twilio Gateway
    const twiml = `<Response><Play>${audioUrl}</Play></Response>`;

    const twilioResponse = await fetch(`${TWILIO_GATEWAY}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneE164,
        From: TWILIO_PHONE_NUMBER,
        Twiml: twiml,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", twilioResponse.status, JSON.stringify(twilioData));
      throw new Error(`Twilio error [${twilioResponse.status}]: ${JSON.stringify(twilioData)}`);
    }

    console.log(`[confirmation-call] Call initiated! SID: ${twilioData.sid}`);

    // 5. Mark as sent in database
    const recordId = leadId || presencaId;
    if (recordId) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ ligacao_confirmacao_enviada: true })
        .eq("id", recordId);

      if (updateError) {
        console.warn(`Failed to update ${tableName}:`, updateError);
      }
    }

    // 6. Log in email_logs
    try {
      await supabase.from("email_logs").insert({
        email_type: "ligacao_confirmacao",
        recipient_email: telefone,
        recipient_name: nome,
        lead_id: leadId,
        resend_id: twilioData.sid || null,
        success: true,
      });
    } catch (logErr) {
      console.warn("Failed to log call:", logErr);
    }

    // 7. Schedule cleanup of audio file after 10 minutes
    setTimeout(async () => {
      try {
        await supabase.storage.from("call-audio").remove([fileName]);
        console.log(`[cleanup] Removed ${fileName}`);
      } catch (e) {
        console.warn(`[cleanup] Failed to remove ${fileName}:`, e);
      }
    }, 10 * 60 * 1000);

    return new Response(
      JSON.stringify({
        success: true,
        callSid: twilioData.sid,
        phone: phoneE164,
        scriptLength: script.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[confirmation-call] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
