import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIPEDRIVE_API = "https://api.pipedrive.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { leads, add_note } = await req.json();
    // leads: Array<{ id: string, email: string, nome: string, pipedrive_deal_id?: number }>
    // add_note?: { deal_id: number, content: string } — optional, posts a note to the deal

    const pipedriveToken = Deno.env.get("PIPEDRIVE_API_TOKEN");
    if (!pipedriveToken) throw new Error("PIPEDRIVE_API_TOKEN not configured");

    // If add_note is provided, post the note to Pipedrive
    if (add_note?.deal_id && add_note?.content) {
      const noteRes = await fetch(`${PIPEDRIVE_API}/notes?api_token=${pipedriveToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: add_note.content,
          deal_id: add_note.deal_id,
          pinned_to_deal_flag: 0,
        }),
      });
      const noteData = await noteRes.json();
      console.log("[get-pipedrive-owners] Note added:", noteData?.success);
    }

    const results: Record<string, { owner_name: string; deal_id?: number }> = {};

    // Process in parallel batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (lead: any) => {
        try {
          // Strategy 1: If we already have a deal_id, fetch directly
          if (lead.pipedrive_deal_id) {
            const owner = await getDealOwner(lead.pipedrive_deal_id, pipedriveToken);
            if (owner) {
              results[lead.id] = { owner_name: owner, deal_id: lead.pipedrive_deal_id };
              return;
            }
          }

          // Strategy 2: Search by email
          const byEmail = await searchPersonByEmail(lead.email, pipedriveToken);
          if (byEmail) {
            const owner = await getDealOwnerByPersonId(byEmail.personId, pipedriveToken);
            if (owner) {
              results[lead.id] = { owner_name: owner.ownerName, deal_id: owner.dealId };
              return;
            }
          }

          // Strategy 3: Fallback search by name
          const byName = await searchPersonByName(lead.nome, pipedriveToken);
          if (byName) {
            const owner = await getDealOwnerByPersonId(byName.personId, pipedriveToken);
            if (owner) {
              results[lead.id] = { owner_name: owner.ownerName, deal_id: owner.dealId };
              return;
            }
          }
        } catch (e) {
          console.error(`Error fetching owner for lead ${lead.id}:`, e);
        }
      }));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-pipedrive-owners error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getDealOwner(dealId: number, token: string): Promise<string | null> {
  const res = await fetch(`${PIPEDRIVE_API}/deals/${dealId}?api_token=${token}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.user_id?.name || null;
}

async function searchPersonByEmail(email: string, token: string): Promise<{ personId: number } | null> {
  const res = await fetch(`${PIPEDRIVE_API}/persons/search?term=${encodeURIComponent(email)}&fields=email&limit=1&api_token=${token}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.data?.items?.[0]?.item;
  if (!item) return null;
  return { personId: item.id };
}

async function searchPersonByName(name: string, token: string): Promise<{ personId: number } | null> {
  const res = await fetch(`${PIPEDRIVE_API}/persons/search?term=${encodeURIComponent(name)}&fields=name&limit=1&api_token=${token}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.data?.items?.[0]?.item;
  if (!item) return null;
  return { personId: item.id };
}

async function getDealOwnerByPersonId(personId: number, token: string): Promise<{ ownerName: string; dealId: number } | null> {
  const res = await fetch(`${PIPEDRIVE_API}/persons/${personId}/deals?limit=1&sort=add_time DESC&api_token=${token}`);
  if (!res.ok) return null;
  const data = await res.json();
  const deal = data?.data?.[0];
  if (!deal) return null;
  return {
    ownerName: deal.user_id?.name || deal.owner_name || "—",
    dealId: deal.id,
  };
}
