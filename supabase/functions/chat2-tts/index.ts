import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Pre-process text to improve TTS naturalness for Brazilian Portuguese.
 */
function prepareTextForTTS(text: string): string {
  let processed = text;

  // Remove emojis (Extended_Pictographic covers emoji; also strip ZWJ, variation selectors and keycap/tag modifiers)
  processed = processed.replace(/\p{Extended_Pictographic}/gu, '');
  processed = processed.replace(/\u200D/g, '');
  processed = processed.replace(/[\uFE00-\uFE0F]/g, '');
  processed = processed.replace(/\u20E3/g, '');
  processed = processed.replace(/[\u{E0020}-\u{E007F}]/gu, '');

  // Expand common abbreviations
  processed = processed.replace(/\bR\$\s*/g, 'reais ');
  processed = processed.replace(/\bIA\b/g, 'inteligência artificial');
  processed = processed.replace(/\bhr\b/gi, 'hora');
  processed = processed.replace(/\bhrs\b/gi, 'horas');
  processed = processed.replace(/\bqtd\b/gi, 'quantidade');
  processed = processed.replace(/\bfunc\b/gi, 'funcionários');
  processed = processed.replace(/\bmin\b/gi, 'minutos');

  // Add slight pause after greetings
  processed = processed.replace(/^(Oi|Olá|Hey|E aí|Eai),?\s/i, '$1... ');

  // Ensure sentences end with proper punctuation
  processed = processed.replace(/([a-záàâãéèêíïóôõúç])\s*\n/gi, '$1.\n');

  // Clean up multiple spaces
  processed = processed.replace(/\s{2,}/g, ' ').trim();

  // Remove markdown bold/italic
  processed = processed.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');

  return processed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    const processedText = prepareTextForTTS(text);
    console.log("[TTS] Original length:", text.length, "Processed length:", processedText.length);
    console.log("[TTS] Processed:", processedText.substring(0, 80));

    // Voice: Olívia Newton Johnson (cloned voice)
    const voiceId = "pwigl9i2aXzf2wKYzN9y";

    // For longer texts, use higher stability and normal speed to avoid slowdowns
    const isLongText = processedText.length > 300;
    const voiceSettings = isLongText
      ? { stability: 0.55, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true, speed: 1.0 }
      : { stability: 0.4, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed: 1.0 };

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);
      return new Response(JSON.stringify({ audio: null, fallback: true, reason: `ElevenLabs TTS ${response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);

    return new Response(JSON.stringify({ audio: audioBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat2-tts error:", e);
    return new Response(JSON.stringify({ audio: null, fallback: true, reason: e instanceof Error ? e.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
