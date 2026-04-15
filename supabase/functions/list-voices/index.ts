import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  const data = await response.json();
  
  // Return just name + voice_id for each voice
  const voices = data.voices?.map((v: any) => ({ name: v.name, voice_id: v.voice_id, category: v.category })) || [];

  return new Response(JSON.stringify({ voices }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
