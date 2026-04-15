import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIPEDRIVE_API = "https://api.pipedrive.com/v1";

// Round-robin vendedores by email (order matters!)
const ROLETA_VENDEDORES = [
  "gisele.rocha@templum.com.br",
  "pedro.maia@evolutto.com",
  "thayane.duarte@evolutto.com",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { deal_id, flow } = await req.json();

    if (!deal_id) {
      return new Response(JSON.stringify({ error: "deal_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("PIPEDRIVE_API_TOKEN");
    if (!token) throw new Error("PIPEDRIVE_API_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let selectedEmail: string;

    if (flow === "gabriel_direto") {
      // Direct assignment to Gabriel Carvente — no roleta
      selectedEmail = "gabriel.carvente@evolutto.com.br";
      console.log(`[assign-owner] Direct assignment to Gabriel Carvente (desqualificado)`);
    } else {
      // 1. Get current counter and increment atomically
      const { data: counter } = await sb
        .from("roleta_counter")
        .select("current_index")
        .eq("id", 1)
        .single();

      const currentIndex = counter?.current_index ?? 0;
      const nextIndex = (currentIndex + 1) % ROLETA_VENDEDORES.length;

      // Update counter for next call
      await sb.from("roleta_counter").update({ current_index: nextIndex }).eq("id", 1);

      selectedEmail = ROLETA_VENDEDORES[currentIndex];
      console.log(`[assign-owner] Roleta index ${currentIndex} → ${selectedEmail}`);
    }

    // 2. Get all Pipedrive users to find the selected vendedor
    const usersRes = await fetch(`${PIPEDRIVE_API}/users?api_token=${token}`);
    const usersData = await usersRes.json();
    if (!usersData?.success) throw new Error("Failed to fetch Pipedrive users");

    let assignedUser: { id: number; email: string; name: string } | null = null;
    for (const user of usersData.data || []) {
      if ((user.email || "").toLowerCase() === selectedEmail) {
        assignedUser = { id: user.id, email: user.email, name: user.name };
        break;
      }
    }

    if (!assignedUser) {
      console.error(`[assign-owner] User not found in Pipedrive for email: ${selectedEmail}`);
      return new Response(JSON.stringify({ error: "User not found", success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Assign owner on the deal
    await fetch(`${PIPEDRIVE_API}/deals/${deal_id}?api_token=${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: assignedUser.id }),
    });
    console.log(`[assign-owner] Deal ${deal_id} assigned to ${assignedUser.name}`);

    // 4. Move deal to appropriate stage (only for "sala" flow; "vendedor" and "gabriel_direto" stay at current stage)
    if (flow === "sala") {
      const pipeline = await findPipelineByName(token, "Orbit");
      if (pipeline) {
        const stagesRes = await fetch(
          `${PIPEDRIVE_API}/stages?pipeline_id=${pipeline.id}&api_token=${token}`
        );
        const stagesData = await stagesRes.json();
        const stages = stagesData?.data || [];

        const targetStage = stages.find((s: { name: string }) => {
          const n = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return n.includes("reuniao agendada") || n.includes("reunião agendada");
        });

        if (targetStage) {
          await fetch(`${PIPEDRIVE_API}/deals/${deal_id}?api_token=${token}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage_id: targetStage.id }),
          });
          console.log(`[assign-owner] Deal ${deal_id} moved to "${targetStage.name}"`);
        } else {
          console.warn(`[assign-owner] Stage "Reunião Agendada" not found`);
        }
      }
    } else {
      console.log(`[assign-owner] Flow "vendedor" — deal ${deal_id} stays at current stage (Lead Novo)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        assigned_user: { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[assign-owner] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function findPipelineByName(token: string, name: string) {
  const res = await fetch(`${PIPEDRIVE_API}/pipelines?api_token=${token}`);
  const data = await res.json();
  return data?.data?.find((p: { name: string; id: number }) =>
    p.name.toLowerCase() === name.toLowerCase()
  ) || null;
}
