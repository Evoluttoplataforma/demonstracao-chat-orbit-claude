import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://api.pipedrive.com/v1';

async function pipedriveFetch(endpoint: string, method: string, token: string, body?: unknown) {
  const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${token}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, rating, comment, deseja_contato_vendedor } = await req.json();

    if (!email || !rating) {
      return new Response(JSON.stringify({ success: false, error: 'Email e nota são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const PIPEDRIVE_API_TOKEN = Deno.env.get('PIPEDRIVE_API_TOKEN')!;

    // Find lead by email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadError || !lead) {
      console.error('[confirm-participation] Lead not found:', email, leadError);
      return new Response(JSON.stringify({ success: false, error: 'Email não encontrado. Verifique se usou o mesmo email do cadastro.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[confirm-participation] Found lead: ${lead.id}, deal_id: ${lead.pipedrive_deal_id}`);

    // Update lead in DB
    const dbUpdate: Record<string, unknown> = {
      confirmou_participacao: true,
      status_reuniao: 'participou',
    };
    if (deseja_contato_vendedor !== undefined && deseja_contato_vendedor !== null) {
      dbUpdate.deseja_contato_vendedor = deseja_contato_vendedor;
    }
    await supabase
      .from('leads')
      .update(dbUpdate)
      .eq('id', lead.id);

    // Update Pipedrive if deal exists
    if (lead.pipedrive_deal_id) {
      // First get the deal to know its pipeline
      const dealData = await pipedriveFetch(`/deals/${lead.pipedrive_deal_id}`, 'GET', PIPEDRIVE_API_TOKEN);
      const pipelineId = dealData.data?.pipeline_id;
      console.log(`[confirm-participation] Deal ${lead.pipedrive_deal_id} is in pipeline ${pipelineId}`);

      // Find "Participou Reunião Grupo" stage in the same pipeline
      const stagesData = await pipedriveFetch(`/stages?pipeline_id=${pipelineId}`, 'GET', PIPEDRIVE_API_TOKEN);
      const stageNames = stagesData.data?.map((s: any) => `${s.id}: "${s.name}"`);
      console.log(`[confirm-participation] Pipeline ${pipelineId} stages:`, JSON.stringify(stageNames));

      let targetStage = stagesData.data?.find((s: any) =>
        s.name.toLowerCase().includes('participou')
      );

      // If not found, create the stage in this pipeline
      if (!targetStage) {
        console.log(`[confirm-participation] Stage not found, creating "Participou Reunião Grupo" in pipeline ${pipelineId}`);
        // Find the position: after "Passou na Levantada de mão" or at the end
        const stages = stagesData.data || [];
        const sorted = stages.sort((a: any, b: any) => a.order_nr - b.order_nr);
        // Insert after the last existing stage
        const lastOrder = sorted.length > 0 ? sorted[sorted.length - 1].order_nr : 0;
        // Find "Contato Realizado" to insert before it, or just append
        const contatoIdx = sorted.findIndex((s: any) => s.name.toLowerCase().includes('contato realizado'));
        const insertOrder = contatoIdx >= 0 ? sorted[contatoIdx].order_nr : lastOrder + 1;

        const createResult = await pipedriveFetch('/stages', 'POST', PIPEDRIVE_API_TOKEN, {
          name: 'Participou Reunião Grupo',
          pipeline_id: pipelineId,
          order_nr: insertOrder,
        });

        if (createResult.success && createResult.data) {
          targetStage = createResult.data;
          console.log(`[confirm-participation] Created stage ${targetStage.id}: "${targetStage.name}"`);
        } else {
          console.error('[confirm-participation] Failed to create stage:', JSON.stringify(createResult));
        }
      }

      if (targetStage) {
        console.log(`[confirm-participation] Moving deal ${lead.pipedrive_deal_id} to stage "${targetStage.name}" (${targetStage.id})`);
        await pipedriveFetch(`/deals/${lead.pipedrive_deal_id}`, 'PUT', PIPEDRIVE_API_TOKEN, {
          stage_id: targetStage.id,
        });
      } else {
        console.warn('[confirm-participation] Could not find or create target stage');
      }

      // Add note with rating
      const ratingLabels: Record<number, string> = {
        1: '⭐ Ruim',
        2: '⭐⭐ Regular',
        3: '⭐⭐⭐ Bom',
        4: '⭐⭐⭐⭐ Muito bom',
        5: '⭐⭐⭐⭐⭐ Excelente',
      };

      const contatoLabel = deseja_contato_vendedor === true ? '✅ Sim' : deseja_contato_vendedor === false ? '❌ Não' : '—';
      let noteContent = `<b>✅ Participou da Reunião Grupo</b><br><br>`;
      noteContent += `<b>Nota:</b> ${ratingLabels[rating] || rating}/5<br>`;
      if (comment) {
        noteContent += `<b>Comentário:</b> ${comment}<br>`;
      }
      noteContent += `<b>Deseja contato vendedor:</b> ${contatoLabel}<br>`;
      noteContent += `<br><i>Registrado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</i>`;

      await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
        content: noteContent,
        deal_id: lead.pipedrive_deal_id,
        pinned_to_deal_flag: 0,
      });

      console.log(`[confirm-participation] Note added to deal ${lead.pipedrive_deal_id}`);
    } else {
      console.warn(`[confirm-participation] Lead ${lead.id} has no pipedrive_deal_id`);
    }

    // Update ManyChat stage
    try {
      await fetch(`${supabaseUrl}/functions/v1/tag-manychat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: 'set_field',
          whatsapp: lead.whatsapp,
          field_name: 'etapa_pipedrive',
          field_value: 'participou reuniao grupo',
        }),
      });
    } catch (e) {
      console.warn('[confirm-participation] ManyChat update error:', e);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[confirm-participation] Error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
