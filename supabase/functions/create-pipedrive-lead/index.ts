import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://api.pipedrive.com/v1';
const BASE_URL_V2 = 'https://api.pipedrive.com/api/v2';

async function pipedriveFetch(
  endpoint: string,
  method: string,
  token: string,
  body?: unknown,
  baseUrl: string = BASE_URL,
  retries = 3,
): Promise<any> {
  const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${token}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (res.status === 429) {
      const waitSec = Math.min(2 ** (attempt + 1), 10);
      console.warn(`[Pipedrive] Rate limited on ${endpoint}, waiting ${waitSec}s (attempt ${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Pipedrive ${endpoint} returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok || !data.success) {
      // If the deal was deleted, return a soft error instead of crashing
      if (data.code === "ERR_DEAL_DELETED" || data.code === "ERR_FORBIDDEN" && String(data.error).includes("deleted")) {
        console.warn(`[Pipedrive] Deal deleted on ${endpoint}, skipping: ${data.error}`);
        return { success: false, deleted: true, data: null };
      }
      throw new Error(`Pipedrive ${endpoint} failed: ${JSON.stringify(data)}`);
    }
    return data;
  }
  throw new Error(`Pipedrive ${endpoint} failed after ${retries} retries (rate limited)`);
}

function normalizeLabelIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }

  return [];
}

function isConsultorLead(oqueFaz?: string, cargo?: string): boolean {
  return (oqueFaz || '').toLowerCase().includes('consultoria') || (cargo || '').toLowerCase().includes('consultor');
}

function resolveDealLabel(oqueFaz?: string, cargo?: string): 'CANAL ORBIT' | 'ORBIT B2B' {
  return isConsultorLead(oqueFaz, cargo) ? 'CANAL ORBIT' : 'ORBIT B2B';
}

// Map origin_page path to a niche label name
function resolveNicheLabel(originPage?: string): string | null {
  if (!originPage) return null;
  const path = originPage.toLowerCase().replace(/^\//, '');
  const nicheMap: Record<string, string> = {
    'consultoria': 'CONSULTORIA',
    'agencia': 'AGÊNCIA',
    'contabilidade': 'CONTABILIDADE',
    'contador': 'CONTABILIDADE',
    'clinicas': 'CLÍNICAS',
    'imobiliaria': 'IMOBILIÁRIA',
    'engenharia': 'ENGENHARIA',
    'advocacia': 'ADVOCACIA',
    'franquias': 'FRANQUIAS',
    'ecommerce': 'E-COMMERCE',
    'educacao': 'EDUCAÇÃO',
  };
  return nicheMap[path] || null;
}

async function findPipelineByName(token: string, name: string) {
  const data = await pipedriveFetch('/pipelines', 'GET', token);
  const pipeline = data.data?.find((p: { name: string }) => 
    p.name.toLowerCase() === name.toLowerCase()
  );
  return pipeline || null;
}

async function getFirstStage(token: string, pipelineId: number) {
  const data = await pipedriveFetch(`/stages?pipeline_id=${pipelineId}`, 'GET', token);
  if (data.data?.length > 0) {
    const sorted = data.data.sort((a: { order_nr: number }, b: { order_nr: number }) => a.order_nr - b.order_nr);
    return sorted[0].id;
  }
  return null;
}

async function ensureCustomField(token: string, entity: 'dealFields' | 'personFields', fieldName: string, fieldType: string) {
  const data = await pipedriveFetch(`/${entity}`, 'GET', token);
  const existing = data.data?.find((f: { name: string }) => 
    f.name.toLowerCase() === fieldName.toLowerCase()
  );
  if (existing) return existing.key;

  const created = await pipedriveFetch(`/${entity}`, 'POST', token, {
    name: fieldName,
    field_type: fieldType,
  });
  return created.data.key;
}

// Find the deal label field and get/create a label option by name, then return its ID
async function ensureDealLabel(token: string, labelName: string, color?: string): Promise<number> {
  const fieldsData = await pipedriveFetch('/dealFields', 'GET', token);
  const labelField = fieldsData.data?.find((f: { key: string }) => f.key === 'label');
  if (!labelField) throw new Error('Label field not found in dealFields');
  
  const existingOption = labelField.options?.find((o: { label: string }) =>
    o.label.toLowerCase() === labelName.toLowerCase()
  );
  if (existingOption) return existingOption.id;

  // Create the label option by updating the label field with the new option added
  const currentOptions = (labelField.options || []).map((o: { id: number; label: string; color?: string }) => ({
    id: o.id,
    label: o.label,
    ...(o.color ? { color: o.color } : {}),
  }));
  currentOptions.push({ label: labelName, ...(color ? { color } : {}) } as any);

  const updated = await pipedriveFetch(`/dealFields/${labelField.id}`, 'PUT', token, {
    options: currentOptions,
  });
  const newOption = updated.data?.options?.find((o: { label: string }) =>
    o.label.toLowerCase() === labelName.toLowerCase()
  );
  if (!newOption) throw new Error(`Failed to create label "${labelName}"`);
  return newOption.id;
}

async function getValidLabelIds(token: string): Promise<Set<number>> {
  const fieldsData = await pipedriveFetch('/dealFields', 'GET', token);
  const labelField = fieldsData.data?.find((f: { key: string }) => f.key === 'label');
  if (!labelField?.options) return new Set();
  return new Set(labelField.options.map((o: { id: number }) => o.id));
}

// Mutually exclusive canal labels — setting one should remove the other
const CANAL_LABELS = ['CANAL ORBIT', 'ORBIT B2B'];

async function setDealLabel(token: string, dealId: number, labelName: string, color?: string) {
  const labelId = await ensureDealLabel(token, labelName, color);
  const currentDeal = await pipedriveFetch(`/deals/${dealId}`, 'GET', token, undefined, BASE_URL_V2);
  if (currentDeal.deleted) {
    console.warn(`[Label] Deal ${dealId} is deleted, skipping label "${labelName}"`);
    return;
  }
  const currentLabelIds = normalizeLabelIds(currentDeal.data?.label_ids);
  
  // Filter out any invalid/deleted label IDs before merging
  const validIds = await getValidLabelIds(token);
  let cleanCurrentIds = currentLabelIds.filter(id => validIds.has(id));

  // If the new label is a canal label, remove the other canal label to avoid duplicates
  if (CANAL_LABELS.includes(labelName.toUpperCase()) || CANAL_LABELS.includes(labelName)) {
    const otherCanalName = CANAL_LABELS.find(l => l !== labelName);
    if (otherCanalName) {
      try {
        const otherCanalId = await ensureDealLabel(token, otherCanalName);
        cleanCurrentIds = cleanCurrentIds.filter(id => id !== otherCanalId);
        console.log(`[Label] Removing mutually exclusive label "${otherCanalName}" (${otherCanalId}) from deal ${dealId}`);
      } catch (_) {
        // Other canal label doesn't exist yet, nothing to remove
      }
    }
  }

  const mergedLabelIds = Array.from(new Set([...cleanCurrentIds, labelId]));

  console.log(`[Label] Deal ${dealId}: current=${JSON.stringify(currentLabelIds)} clean=${JSON.stringify(cleanCurrentIds)} merged=${JSON.stringify(mergedLabelIds)} adding="${labelName}" (${labelId})`);

  if (cleanCurrentIds.includes(labelId) && cleanCurrentIds.length === mergedLabelIds.length) {
    console.log(`[Label] Deal ${dealId} already has "${labelName}"`);
    return;
  }

  try {
    await pipedriveFetch(`/deals/${dealId}`, 'PATCH', token, {
      label_ids: mergedLabelIds,
    }, BASE_URL_V2);
    console.log(`[Label] Deal ${dealId} labels updated: ${JSON.stringify(mergedLabelIds)}`);
  } catch (err) {
    console.error(`[Label] Failed to set merged labels on deal ${dealId}:`, err);
    // Fallback: try with just the new label alone
    try {
      await pipedriveFetch(`/deals/${dealId}`, 'PATCH', token, {
        label_ids: [labelId],
      }, BASE_URL_V2);
      console.log(`[Label] Fallback: set only "${labelName}" on deal ${dealId}`);
    } catch (err2) {
      console.error(`[Label] Fallback also failed for deal ${dealId}:`, err2);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PIPEDRIVE_API_TOKEN = Deno.env.get('PIPEDRIVE_API_TOKEN');
    if (!PIPEDRIVE_API_TOKEN) {
      throw new Error('PIPEDRIVE_API_TOKEN is not configured');
    }

    const payload = await req.json();
    const { action = 'create' } = payload;

    // ACTION: CREATE — initial lead with basic info (name, email, whatsapp, empresa)
    if (action === 'create') {
      const { name, whatsapp, email, empresa, oqueFaz, cargo, leadId, utmData, copyVariant } = payload;

      // IDEMPOTENCY: Check if person already exists by email to avoid duplicates
      const searchRes = await fetch(
        `${BASE_URL}/persons/search?term=${encodeURIComponent(email)}&fields=email&limit=1&api_token=${PIPEDRIVE_API_TOKEN}`
      );
      const searchData = await searchRes.json();
      const existingPerson = searchData?.data?.items?.[0]?.item;

      if (existingPerson) {
        // Person already exists — ALWAYS create a new deal (never reuse won/lost/archived deals)
        const personId = existingPerson.id;
        let orgId = existingPerson.org_id || null;

        console.log('Person already exists in Pipedrive, creating NEW deal:', { personId, orgId });

        // Create org if person has none
        if (!orgId && empresa) {
          const orgData = await pipedriveFetch('/organizations', 'POST', PIPEDRIVE_API_TOKEN, {
            name: empresa || 'Não informado',
          });
          orgId = orgData.data.id;
          await pipedriveFetch(`/persons/${personId}`, 'PUT', PIPEDRIVE_API_TOKEN, { org_id: orgId });
        }

        // Find/create Orbit pipeline
        const pipeline = await findPipelineByName(PIPEDRIVE_API_TOKEN, 'Orbit');
        let pipelineId = pipeline?.id;
        let stageId: number | null = null;
        if (pipelineId) {
          stageId = await getFirstStage(PIPEDRIVE_API_TOKEN, pipelineId);
        } else {
          const pipelineData = await pipedriveFetch('/pipelines', 'POST', PIPEDRIVE_API_TOKEN, { name: 'Orbit' });
          pipelineId = pipelineData.data.id;
          stageId = await getFirstStage(PIPEDRIVE_API_TOKEN, pipelineId);
        }

        // Ensure UTM custom fields exist
        const [utmSourceKey, utmMediumKey, utmCampaignKey, utmContentKey, utmTermKey, gclidKey, fbclidKey, landingPageKey, originPageKey] = await Promise.all([
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Source', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Medium', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Campaign', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Content', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Term', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'GCLID', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'FBCLID', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Landing Page', 'varchar'),
          ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Origin Page', 'varchar'),
        ]);

        const dealBody: Record<string, unknown> = {
          title: `${name} - ${empresa || 'Sem empresa'} | Orbit`,
          person_id: personId,
          ...(orgId ? { org_id: orgId } : {}),
          pipeline_id: pipelineId,
          ...(stageId ? { stage_id: stageId } : {}),
        };
        if (utmData) {
          if (utmData.utm_source) dealBody[utmSourceKey] = utmData.utm_source;
          if (utmData.utm_medium) dealBody[utmMediumKey] = utmData.utm_medium;
          if (utmData.utm_campaign) dealBody[utmCampaignKey] = utmData.utm_campaign;
          if (utmData.utm_content) dealBody[utmContentKey] = utmData.utm_content;
          if (utmData.utm_term) dealBody[utmTermKey] = utmData.utm_term;
          if (utmData.gclid) dealBody[gclidKey] = utmData.gclid;
          if (utmData.fbclid) dealBody[fbclidKey] = utmData.fbclid;
          if (utmData.landing_page) dealBody[landingPageKey] = utmData.landing_page;
          if (utmData.origin_page) dealBody[originPageKey] = utmData.origin_page;
        }

        const dealData = await pipedriveFetch('/deals', 'POST', PIPEDRIVE_API_TOKEN, dealBody);
        const dealId = dealData.data.id;

        // Add initial note
        const isConsultorExisting = isConsultorLead(oqueFaz, cargo);
        const noteLines = [
          `📋 Novo lead capturado (pessoa existente no Pipedrive)`,
          `👤 Nome: ${name}`,
          `📱 WhatsApp: ${whatsapp}`,
          `📧 E-mail: ${email}`,
          `🏢 Empresa: ${empresa || 'Não informado'}`,
          ...(oqueFaz ? [`💼 Segmento: ${oqueFaz}`] : []),
          ...(cargo ? [`🎯 Cargo: ${cargo}`] : []),
          ...(isConsultorExisting ? [`🏷️ Tipo: Consultor`] : []),
        ];
        await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
          content: noteLines.join('\n'),
          deal_id: dealId,
          pinned_to_deal_flag: 0,
        });

        // Apply niche label OR canal label (niche takes priority)
        const nicheLabel = resolveNicheLabel(utmData?.origin_page);
        if (nicheLabel) {
          try {
            await setDealLabel(PIPEDRIVE_API_TOKEN, dealId, nicheLabel, 'blue');
            console.log(`[Create-Existing] Applied niche label "${nicheLabel}" — skipping canal label`);
          } catch (e) {
            console.error('[Create-Existing] Failed to set niche label:', e);
          }
        } else if (oqueFaz || cargo) {
          const canalLabelExisting = resolveDealLabel(oqueFaz, cargo);
          try {
            await setDealLabel(PIPEDRIVE_API_TOKEN, dealId, canalLabelExisting);
          } catch (e) {
            console.error('[Create-Existing] Failed to set deal label:', e);
          }
        } else {
          console.log('[Create-Existing] Skipping label — no niche or oqueFaz/cargo available');
        }

        console.log('Created new deal for existing person:', { personId, orgId, dealId });

        // Ensure lead exists in DB (fallback if client-side insert failed)
        {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const sb = createClient(supabaseUrl, supabaseKey);

          if (leadId && dealId) {
            try {
              await sb.from('leads').update({
                pipedrive_person_id: personId,
                pipedrive_org_id: orgId,
                pipedrive_deal_id: dealId,
              }).eq('id', leadId);
            } catch (e) {
              console.error('Failed to update lead with Pipedrive IDs:', e);
            }
          } else if (!leadId && dealId) {
            // Client insert FAILED — try to find existing lead first, then create as fallback
            console.warn('[Fallback-Existing] No leadId, checking for existing lead before inserting');
            try {
              const phoneDigits = (whatsapp || '').replace(/\D/g, '');
              const { data: existingLead } = await sb.from('leads')
                .select('id')
                .or(`email.eq.${email},whatsapp.ilike.%${phoneDigits}%`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (existingLead) {
                console.log('[Fallback-Existing] Found existing lead, updating:', existingLead.id);
                await sb.from('leads').update({
                  pipedrive_person_id: personId,
                  pipedrive_org_id: orgId,
                  pipedrive_deal_id: dealId,
                }).eq('id', existingLead.id);
              } else {
                const { error: fbErr } = await sb.from('leads').insert({
                  nome: name?.split(' ')[0] || '',
                  sobrenome: name?.split(' ').slice(1).join(' ') || '',
                  whatsapp: whatsapp || '',
                  email: email || '',
                  empresa: empresa || '',
                  status: 'parcial',
                  pipedrive_person_id: personId,
                  pipedrive_org_id: orgId,
                  pipedrive_deal_id: dealId,
                  ...(copyVariant ? { copy_variant: copyVariant } : {}),
                  ...(utmData?.utm_source ? { utm_source: utmData.utm_source } : {}),
                  ...(utmData?.utm_medium ? { utm_medium: utmData.utm_medium } : {}),
                  ...(utmData?.utm_campaign ? { utm_campaign: utmData.utm_campaign } : {}),
                });
                if (fbErr) console.error('[Fallback-Existing] DB insert failed:', fbErr);
                else console.log('[Fallback-Existing] Lead created server-side');
              }
            } catch (e) {
              console.error('[Fallback-Existing] Exception:', e);
            }
          }
        }

        // Check if lead already completed before applying fallback tag
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const sbCheck = createClient(supabaseUrl, supabaseKey);
          const { data: currentLead } = await sbCheck.from('leads').select('status').eq('whatsapp', whatsapp).order('created_at', { ascending: false }).limit(1).maybeSingle();

          if (currentLead?.status === 'completo') {
            console.log('[create-pipedrive-lead] Lead already completed, skipping nao-respondeu tag (existing person)');
          } else {
            await fetch(`${supabaseUrl}/functions/v1/tag-manychat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                action: 'tag',
                whatsapp: whatsapp,
                tag_name: 'nao-respondeu-chat-demonstracao',
                lead_data: { nome: name?.split(' ')[0], sobrenome: name?.split(' ').slice(1).join(' ') || 'Não informado', email, empresa },
              }),
            });
            console.log('[create-pipedrive-lead] Tagged nao-respondeu-chat-demonstracao (existing person)');
          }
        } catch (e) {
          console.warn('[create-pipedrive-lead] ManyChat tag error:', e);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          person_id: personId, 
          org_id: orgId,
          deal_id: dealId,
          deduplicated: true,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const [cargoKey, segmentoPersonKey, utmSourceKey, utmMediumKey, utmCampaignKey, utmContentKey, utmTermKey, gclidKey, fbclidKey, landingPageKey, originPageKey] = await Promise.all([
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'personFields', 'Cargo', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'personFields', 'Ramo de Atividade', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Source', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Medium', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Campaign', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Content', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Term', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'GCLID', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'FBCLID', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Landing Page', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Origin Page', 'varchar'),
      ]);

      // Create Organization
      const orgData = await pipedriveFetch('/organizations', 'POST', PIPEDRIVE_API_TOKEN, {
        name: empresa || 'Não informado',
      });
      const orgId = orgData.data.id;

      // Create Person
      const personBody: Record<string, unknown> = {
        name,
        email: [{ value: email, primary: true }],
        phone: [{ value: whatsapp, primary: true }],
        org_id: orgId,
      };
      if (cargo) personBody[cargoKey] = cargo;
      if (oqueFaz) personBody[segmentoPersonKey] = oqueFaz;

      const personData = await pipedriveFetch('/persons', 'POST', PIPEDRIVE_API_TOKEN, personBody);
      const personId = personData.data.id;

      // Find/create Orbit pipeline
      const pipeline = await findPipelineByName(PIPEDRIVE_API_TOKEN, 'Orbit');
      let pipelineId = pipeline?.id;
      let stageId: number | null = null;

      if (pipelineId) {
        stageId = await getFirstStage(PIPEDRIVE_API_TOKEN, pipelineId);
      } else {
        const pipelineData = await pipedriveFetch('/pipelines', 'POST', PIPEDRIVE_API_TOKEN, {
          name: 'Orbit',
        });
        pipelineId = pipelineData.data.id;
        stageId = await getFirstStage(PIPEDRIVE_API_TOKEN, pipelineId);
      }

      // Create Deal with UTM fields
      const dealBody: Record<string, unknown> = {
        title: `${name} - ${empresa || 'Sem empresa'} | Orbit`,
        person_id: personId,
        org_id: orgId,
        pipeline_id: pipelineId,
        ...(stageId ? { stage_id: stageId } : {}),
      };
      // Populate UTM custom fields on the deal
      if (utmData) {
        if (utmData.utm_source) dealBody[utmSourceKey] = utmData.utm_source;
        if (utmData.utm_medium) dealBody[utmMediumKey] = utmData.utm_medium;
        if (utmData.utm_campaign) dealBody[utmCampaignKey] = utmData.utm_campaign;
        if (utmData.utm_content) dealBody[utmContentKey] = utmData.utm_content;
        if (utmData.utm_term) dealBody[utmTermKey] = utmData.utm_term;
        if (utmData.gclid) dealBody[gclidKey] = utmData.gclid;
        if (utmData.fbclid) dealBody[fbclidKey] = utmData.fbclid;
        if (utmData.landing_page) dealBody[landingPageKey] = utmData.landing_page;
        if (utmData.origin_page) dealBody[originPageKey] = utmData.origin_page;
      }

      const dealData = await pipedriveFetch('/deals', 'POST', PIPEDRIVE_API_TOKEN, dealBody);
      const dealId = dealData.data.id;

      // Add initial note with UTM data
      const utmLines: string[] = [];
      if (utmData) {
        if (utmData.utm_source) utmLines.push(`🔗 Fonte: ${utmData.utm_source}`);
        if (utmData.utm_medium) utmLines.push(`📢 Mídia: ${utmData.utm_medium}`);
        if (utmData.utm_campaign) utmLines.push(`🎯 Campanha: ${utmData.utm_campaign}`);
        if (utmData.utm_content) utmLines.push(`📝 Conteúdo: ${utmData.utm_content}`);
        if (utmData.utm_term) utmLines.push(`🔑 Termo: ${utmData.utm_term}`);
        if (utmData.gclid) utmLines.push(`📊 GCLID: ${utmData.gclid}`);
        if (utmData.fbclid) utmLines.push(`📊 FBCLID: ${utmData.fbclid}`);
        if (utmData.landing_page) utmLines.push(`🌐 LP: ${utmData.landing_page}`);
        if (utmData.origin_page) utmLines.push(`↩️ Origem: ${utmData.origin_page}`);
      }
      const isConsultorNew = isConsultorLead(oqueFaz, cargo);
      const dealNote = [
        `📋 Lead parcial capturado`,
        `👤 Nome: ${name}`,
        `📱 WhatsApp: ${whatsapp}`,
        `📧 E-mail: ${email}`,
        `🏢 Empresa: ${empresa || 'Não informado'}`,
        ...(oqueFaz ? [`💼 Segmento: ${oqueFaz}`] : []),
        ...(cargo ? [`🎯 Cargo: ${cargo}`] : []),
        ...(isConsultorNew ? [`🏷️ Tipo: Consultor`] : []),
        ...(utmLines.length > 0 ? ['', '--- Tracking ---', ...utmLines] : []),
      ].join('\n');

      await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
        content: dealNote,
        deal_id: dealId,
        pinned_to_deal_flag: 0,
      });

      // Apply niche label OR canal label (niche takes priority)
      const nicheLabelNew = resolveNicheLabel(utmData?.origin_page);
      if (nicheLabelNew) {
        try {
          await setDealLabel(PIPEDRIVE_API_TOKEN, dealId, nicheLabelNew, 'blue');
          console.log(`[Create-New] Applied niche label "${nicheLabelNew}" — skipping canal label`);
        } catch (e) {
          console.error('[Create-New] Failed to set niche label:', e);
        }
      } else if (oqueFaz || cargo) {
        const canalLabelNew = resolveDealLabel(oqueFaz, cargo);
        try {
          await setDealLabel(PIPEDRIVE_API_TOKEN, dealId, canalLabelNew);
        } catch (e) {
          console.error('[Create-New] Failed to set deal label:', e);
        }
      } else {
        console.log('[Create-New] Skipping label — no niche or oqueFaz/cargo available');
      }

      // Ensure lead exists in DB (fallback if client-side insert failed)
      {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sb = createClient(supabaseUrl, supabaseKey);

        if (leadId) {
          // Client insert succeeded — just update with Pipedrive IDs
          try {
            await sb.from('leads').update({
              pipedrive_person_id: personId,
              pipedrive_org_id: orgId,
              pipedrive_deal_id: dealId,
            }).eq('id', leadId);
          } catch (e) {
            console.error('Failed to update lead with Pipedrive IDs:', e);
          }
        } else {
          // Client insert FAILED — check for existing lead first, then create as fallback
          console.warn('[Fallback] No leadId received, checking for existing lead before inserting');
          try {
            const phoneDigits = (whatsapp || '').replace(/\D/g, '');
            const { data: existingLead } = await sb.from('leads')
              .select('id')
              .or(`email.eq.${email},whatsapp.ilike.%${phoneDigits}%`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (existingLead) {
              console.log('[Fallback] Found existing lead, updating:', existingLead.id);
              await sb.from('leads').update({
                pipedrive_person_id: personId,
                pipedrive_org_id: orgId,
                pipedrive_deal_id: dealId,
              }).eq('id', existingLead.id);
            } else {
              const { data: fallbackLead, error: fbErr } = await sb.from('leads').insert({
                nome: name?.split(' ')[0] || '',
                sobrenome: name?.split(' ').slice(1).join(' ') || '',
                whatsapp: whatsapp || '',
                email: email || '',
                empresa: empresa || '',
                status: 'parcial',
                pipedrive_person_id: personId,
                pipedrive_org_id: orgId,
                pipedrive_deal_id: dealId,
                ...(copyVariant ? { copy_variant: copyVariant } : {}),
                ...(utmData?.utm_source ? { utm_source: utmData.utm_source } : {}),
                ...(utmData?.utm_medium ? { utm_medium: utmData.utm_medium } : {}),
                ...(utmData?.utm_campaign ? { utm_campaign: utmData.utm_campaign } : {}),
                ...(utmData?.utm_content ? { utm_content: utmData.utm_content } : {}),
                ...(utmData?.utm_term ? { utm_term: utmData.utm_term } : {}),
                ...(utmData?.gclid ? { gclid: utmData.gclid } : {}),
                ...(utmData?.fbclid ? { fbclid: utmData.fbclid } : {}),
                ...(utmData?.landing_page ? { landing_page: utmData.landing_page } : {}),
                ...(utmData?.origin_page ? { origin_page: utmData.origin_page } : {}),
              }).select('id').maybeSingle();
              if (fbErr) {
                console.error('[Fallback] DB insert failed:', fbErr);
              } else {
                console.log('[Fallback] Lead created server-side:', fallbackLead?.id);
              }
            }
          } catch (e) {
            console.error('[Fallback] Exception inserting lead:', e);
          }
        }

      // Check if lead already completed before applying fallback tag
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sbCheck2 = createClient(supabaseUrl, supabaseKey);
        const { data: currentLead2 } = await sbCheck2.from('leads').select('status').eq('whatsapp', whatsapp).order('created_at', { ascending: false }).limit(1).maybeSingle();

        if (currentLead2?.status === 'completo') {
          console.log('[create-pipedrive-lead] Lead already completed, skipping nao-respondeu tag (new person)');
        } else {
          await fetch(`${supabaseUrl}/functions/v1/tag-manychat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              action: 'tag',
              whatsapp: whatsapp,
              tag_name: 'nao-respondeu-chat-demonstracao',
              lead_data: { nome: name?.split(' ')[0], sobrenome: name?.split(' ').slice(1).join(' ') || 'Não informado', email, empresa, oqueFaz, cargo },
            }),
          });
          console.log('[create-pipedrive-lead] Tagged nao-respondeu-chat-demonstracao (new person)');
        }
      } catch (e) {
        console.warn('[create-pipedrive-lead] ManyChat tag error:', e);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        person_id: personId, 
        org_id: orgId,
        deal_id: dealId,
        pipeline_id: pipelineId,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    }

    // ACTION: UPDATE — update existing deal/person with new data
    if (action === 'update') {
      let { person_id, org_id, deal_id, oqueFaz: rawOqueFaz, cargo: rawCargo, softwareGestao, faturamento, funcionarios, prioridade, date, time, utmData } = payload;

      // Fetch existing lead data from DB to merge with partial updates
      let oqueFaz = rawOqueFaz;
      let cargo = rawCargo;
      if (deal_id && (!oqueFaz || !cargo)) {
        try {
          const supabaseUrlUpdate = Deno.env.get('SUPABASE_URL')!;
          const supabaseKeyUpdate = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const sb = createClient(supabaseUrlUpdate, supabaseKeyUpdate);
          const { data: existingLead } = await sb.from('leads')
            .select('oque_faz, cargo')
            .eq('pipedrive_deal_id', deal_id)
            .limit(1)
            .maybeSingle();
          if (existingLead) {
            oqueFaz = oqueFaz || existingLead.oque_faz || '';
            cargo = cargo || existingLead.cargo || '';
            console.log(`[Update] Merged from DB: oqueFaz="${oqueFaz}", cargo="${cargo}"`);
          }
        } catch (e) {
          console.warn('[Update] Failed to fetch existing lead for merge:', e);
        }
      }

      // Check if the deal was deleted in Pipedrive — if so, recreate it
      if (deal_id) {
        const checkDeal = await pipedriveFetch(`/deals/${deal_id}`, 'GET', PIPEDRIVE_API_TOKEN);
        const isDealDeleted = checkDeal.deleted || checkDeal.data?.active_flag === false || checkDeal.data?.deleted === true || checkDeal.data?.status === 'deleted';
        console.log(`[Update] Deal ${deal_id} check: active_flag=${checkDeal.data?.active_flag}, deleted=${checkDeal.data?.deleted}, status=${checkDeal.data?.status}, isDealDeleted=${isDealDeleted}`);
        if (isDealDeleted) {
          console.log(`[Update] Deal ${deal_id} is deleted in Pipedrive, recreating...`);
          try {
            const supabaseUrlRec = Deno.env.get('SUPABASE_URL')!;
            const supabaseKeyRec = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const sbRec = createClient(supabaseUrlRec, supabaseKeyRec);

            // Fetch full lead data from DB
            const { data: leadForRecreate } = await sbRec.from('leads')
              .select('*')
              .eq('pipedrive_deal_id', deal_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (leadForRecreate) {
              const fullName = `${leadForRecreate.nome} ${leadForRecreate.sobrenome || ''}`.trim();

              // Find Orbit pipeline
              const pipeline = await findPipelineByName(PIPEDRIVE_API_TOKEN, 'Orbit');
              const pipelineId = pipeline?.id;
              let stageId: number | null = null;
              if (pipelineId) stageId = await getFirstStage(PIPEDRIVE_API_TOKEN, pipelineId);

              // Create new deal linked to existing person/org
              const newDealBody: Record<string, unknown> = {
                title: `${fullName} - ${leadForRecreate.empresa || 'Sem empresa'} | Orbit`,
                person_id: person_id,
                org_id: org_id,
                ...(pipelineId ? { pipeline_id: pipelineId } : {}),
                ...(stageId ? { stage_id: stageId } : {}),
              };
              const newDealData = await pipedriveFetch('/deals', 'POST', PIPEDRIVE_API_TOKEN, newDealBody);
              const newDealId = newDealData.data.id;
              console.log(`[Update] New deal created: ${newDealId} (replacing deleted ${deal_id})`);

              // Update DB with new deal_id
              await sbRec.from('leads')
                .update({ pipedrive_deal_id: newDealId })
                .eq('id', leadForRecreate.id);

              // Add note explaining recreation
              await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
                content: `⚠️ Negócio recriado automaticamente.\nO deal anterior (${deal_id}) havia sido deletado no Pipedrive.\n\n👤 ${fullName}\n📧 ${leadForRecreate.email}\n🏢 ${leadForRecreate.empresa}`,
                deal_id: newDealId,
                pinned_to_deal_flag: 0,
              });

              // Use the new deal_id for all subsequent operations
              deal_id = newDealId;
            }
          } catch (e) {
            console.error(`[Update] Failed to recreate deal for deleted ${deal_id}:`, e);
          }
        }
      }

      const [cargoKey, segmentoPersonKey, faturamentoKey, funcionariosKey, prioridadeKey, reuniaoKey, utmSourceKey, utmMediumKey, utmCampaignKey, utmContentKey, utmTermKey, gclidKey, fbclidKey, landingPageKey, originPageKey] = await Promise.all([
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'personFields', 'Cargo', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'personFields', 'Ramo de Atividade', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Qual o faturamento ?', 'varchar'),
        Promise.resolve('e3aa6db84dfdf3594d0f75c3aa36b6c6a82a426f'), // Faixa de Funcionários - fixed key
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Prioridade', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Data Reunião', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Source', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Medium', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Campaign', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Content', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'UTM Term', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'GCLID', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'FBCLID', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Landing Page', 'varchar'),
        ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Origin Page', 'varchar'),
      ]);

      // Update Person fields if provided
      const personUpdate: Record<string, unknown> = {};
      if (cargo) personUpdate[cargoKey] = cargo;
      if (oqueFaz) personUpdate[segmentoPersonKey] = oqueFaz;
      if (Object.keys(personUpdate).length > 0 && person_id) {
        await pipedriveFetch(`/persons/${person_id}`, 'PUT', PIPEDRIVE_API_TOKEN, personUpdate);
      }

      // Update Deal fields if provided
      const dealUpdate: Record<string, unknown> = {};
      if (faturamento) dealUpdate[faturamentoKey] = faturamento;
      if (funcionarios) dealUpdate[funcionariosKey] = funcionarios;
      if (prioridade) dealUpdate[prioridadeKey] = prioridade;
      if (date && time) dealUpdate[reuniaoKey] = `${date} às ${time}`;
      // UTM fields on update too (in case they weren't set on create)
      if (utmData) {
        if (utmData.utm_source) dealUpdate[utmSourceKey] = utmData.utm_source;
        if (utmData.utm_medium) dealUpdate[utmMediumKey] = utmData.utm_medium;
        if (utmData.utm_campaign) dealUpdate[utmCampaignKey] = utmData.utm_campaign;
        if (utmData.utm_content) dealUpdate[utmContentKey] = utmData.utm_content;
        if (utmData.utm_term) dealUpdate[utmTermKey] = utmData.utm_term;
        if (utmData.gclid) dealUpdate[gclidKey] = utmData.gclid;
        if (utmData.fbclid) dealUpdate[fbclidKey] = utmData.fbclid;
        if (utmData.landing_page) dealUpdate[landingPageKey] = utmData.landing_page;
        if (utmData.origin_page) dealUpdate[originPageKey] = utmData.origin_page;
      }
      if (Object.keys(dealUpdate).length > 0 && deal_id) {
        await pipedriveFetch(`/deals/${deal_id}`, 'PUT', PIPEDRIVE_API_TOKEN, dealUpdate);
      }

      // Apply niche label OR canal label (niche takes priority)
      if (deal_id) {
        const nicheLabelUpdate = resolveNicheLabel(utmData?.origin_page);
        if (nicheLabelUpdate) {
          try {
            await setDealLabel(PIPEDRIVE_API_TOKEN, deal_id, nicheLabelUpdate, 'blue');
            console.log(`[Update] Applied niche label "${nicheLabelUpdate}" — skipping canal label`);
          } catch (e) {
            console.error('[Update] Failed to set niche label:', e);
          }
        } else if (oqueFaz || cargo) {
          const canalLabelEarly = resolveDealLabel(oqueFaz, cargo);
          try {
            await setDealLabel(PIPEDRIVE_API_TOKEN, deal_id, canalLabelEarly);
          } catch (e) {
            console.error('[Update] Failed to set deal label:', e);
          }
        }
      }

      // If scheduling is complete: move stage, create activity, update note
      if (date && time && deal_id) {
        // 1) Move deal to "Reunião Agendada" stage
        try {
          const pipeline = await findPipelineByName(PIPEDRIVE_API_TOKEN, 'Orbit');
          if (pipeline) {
            const stagesData = await pipedriveFetch(`/stages?pipeline_id=${pipeline.id}`, 'GET', PIPEDRIVE_API_TOKEN);
            const reuniaoStage = stagesData.data?.find((s: { name: string }) =>
              s.name.toLowerCase().includes('reunião agendada') || s.name.toLowerCase().includes('reuniao agendada')
            );
            if (reuniaoStage) {
              await pipedriveFetch(`/deals/${deal_id}`, 'PUT', PIPEDRIVE_API_TOKEN, {
                stage_id: reuniaoStage.id,
              });
              console.log(`[Update] Deal ${deal_id} moved to stage "${reuniaoStage.name}" (${reuniaoStage.id})`);
            } else {
              console.warn('[Update] Stage "Reunião Agendada" not found in Orbit pipeline');
            }
          }
        } catch (e) {
          console.error('[Update] Failed to move deal stage:', e);
        }

        // 2) Create activity "Reunião Online" with the scheduled date/time
        try {
          // Parse date: expected format "D/M/YYYY" -> "YYYY-MM-DD"
          const dateParts = date.split('/');
          let dueDate = date;
          if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            dueDate = `${year}-${month}-${day}`;
          }
          // Compensate for Pipedrive timezone: API interprets due_time as UTC
          // but displays in account timezone (America/Sao_Paulo = UTC-3).
          // So we add 3h to the user's chosen time so it displays correctly.
          const [hh, mm] = time.split(':').map(Number);
          const utcHour = (hh + 3) % 24; // wrap around midnight
          const dueTime = `${utcHour.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;

          // If adding 3h crosses midnight, advance the due_date by 1 day
          let activityDueDate = dueDate;
          if (hh + 3 >= 24 && dateParts.length === 3) {
            const d = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]) + 1);
            activityDueDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
          }

          // Get deal owner to set as activity owner
          let dealOwnerId: number | undefined;
          try {
            const dealInfo = await pipedriveFetch(`/deals/${deal_id}`, 'GET', PIPEDRIVE_API_TOKEN);
            dealOwnerId = dealInfo.data?.user_id?.id || dealInfo.data?.user_id;
            console.log(`[Update] Deal owner user_id: ${dealOwnerId}`);
          } catch (e) {
            console.error('[Update] Failed to get deal owner:', e);
          }

          // Find the "Reunião Virtual" activity type key
          let activityTypeKey = 'meeting'; // fallback
          try {
            const typesRes = await pipedriveFetch('/activityTypes', 'GET', PIPEDRIVE_API_TOKEN);
            const virtualType = typesRes.data?.find((t: { name: string; key_string: string }) =>
              t.name.toLowerCase().includes('reunião virtual') || t.name.toLowerCase().includes('reuniao virtual')
            );
            if (virtualType) {
              activityTypeKey = virtualType.key_string;
              console.log(`[Update] Using activity type: ${virtualType.name} (${activityTypeKey})`);
            } else {
              console.warn('[Update] Activity type "Reunião Virtual" not found, using "meeting"');
            }
          } catch (e) {
            console.error('[Update] Failed to fetch activity types:', e);
          }

          await pipedriveFetch('/activities', 'POST', PIPEDRIVE_API_TOKEN, {
            subject: `Reunião Online - ${time}`,
            type: activityTypeKey,
            due_date: activityDueDate,
            due_time: dueTime,
            duration: '01:00',
            deal_id: deal_id,
            ...(person_id ? { person_id } : {}),
            ...(org_id ? { org_id } : {}),
            ...(dealOwnerId ? { user_id: dealOwnerId } : {}),
            note: `Reunião online agendada pelo chat Orbit.\n📅 ${date} às ${time}`,
          });
          console.log(`[Update] Activity "${activityTypeKey}" created for deal ${deal_id} on ${activityDueDate} ${dueTime}`);
        } catch (e) {
          console.error('[Update] Failed to create activity:', e);
        }

        const { name, whatsapp, email, empresa } = payload;

        // Classify lead type
        const isConsultor = isConsultorLead(oqueFaz, cargo);
        const isLowRevenue = (faturamento || '').toLowerCase().includes('até') && (faturamento || '').toLowerCase().includes('100 mil');
        let leadType = 'Grande';
        let salaName = 'Orbit Grande';
        let salaLink = 'https://meet.google.com/ycz-dosc-znk';
        if (isConsultor) {
          leadType = 'Consultor';
          salaName = 'Orbit Consultor';
          salaLink = 'https://meet.google.com/xuc-mrnp-sec';
        } else if (isLowRevenue) {
          leadType = 'Pequeno';
          salaName = 'Orbit Pequeno';
          salaLink = 'https://meet.google.com/efd-bbnc-zfc';
        }

        // Set Pipedrive deal label based on lead type
        const canalLabel = resolveDealLabel(oqueFaz, cargo);
        try {
          await setDealLabel(PIPEDRIVE_API_TOKEN, deal_id, canalLabel);
        } catch (e) {
          console.error('[Update] Failed to set deal label:', e);
        }

        const noteLines = [
          `📋 Lead completo — Reunião agendada`,
          '',
          `🏷️ Tipo de Lead: ${leadType}`,
          `🚪 Sala: ${salaName}`,
          `🔗 Link da Sala: ${salaLink}`,
          '',
          `👤 Nome: ${name || '-'}`,
          `📱 WhatsApp: ${whatsapp || '-'}`,
          `📧 E-mail: ${email || '-'}`,
          `🏢 Empresa: ${empresa || '-'}`,
          `💼 Segmento / O que faz: ${oqueFaz || '-'}`,
          `🎯 Cargo: ${cargo || '-'}`,
          ...(softwareGestao ? [`🖥️ Software de Gestão: ${softwareGestao}`] : []),
          `💰 Faturamento: ${faturamento || '-'}`,
          `👥 Funcionários: ${funcionarios || '-'}`,
          `⏰ Prioridade: ${prioridade || '-'}`,
          `📅 Reunião: ${date} às ${time}`,
        ];
        // UTM / Tracking
        const utmLines: string[] = [];
        if (utmData) {
          if (utmData.utm_source) utmLines.push(`🔗 Fonte: ${utmData.utm_source}`);
          if (utmData.utm_medium) utmLines.push(`📢 Mídia: ${utmData.utm_medium}`);
          if (utmData.utm_campaign) utmLines.push(`🎯 Campanha: ${utmData.utm_campaign}`);
          if (utmData.utm_content) utmLines.push(`📝 Conteúdo: ${utmData.utm_content}`);
          if (utmData.utm_term) utmLines.push(`🔑 Termo: ${utmData.utm_term}`);
          if (utmData.gclid) utmLines.push(`📊 GCLID: ${utmData.gclid}`);
          if (utmData.fbclid) utmLines.push(`📊 FBCLID: ${utmData.fbclid}`);
          if (utmData.landing_page) utmLines.push(`🌐 LP: ${utmData.landing_page}`);
          if (utmData.origin_page) utmLines.push(`↩️ Origem: ${utmData.origin_page}`);
        }
        if (utmLines.length > 0) {
          noteLines.push('', '--- Tracking ---', ...utmLines);
        }
        const fullNote = noteLines.join('\n');

        // Get existing notes to find the main one (first note added to the deal)
        try {
          const notesData = await pipedriveFetch(`/deals/${deal_id}/notes`, 'GET', PIPEDRIVE_API_TOKEN);
          const existingNote = notesData.data?.[0];
          if (existingNote) {
            await pipedriveFetch(`/notes/${existingNote.id}`, 'PUT', PIPEDRIVE_API_TOKEN, {
              content: fullNote,
            });
          } else {
            await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
              content: fullNote,
              deal_id,
              pinned_to_deal_flag: 0,
            });
          }
        } catch {
          // If notes update fails, just add a new one
          await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
            content: fullNote,
            deal_id,
            pinned_to_deal_flag: 0,
          });
        }
      }

      // SERVER-SIDE DB FALLBACK: Always ensure scheduling data is persisted in DB
      if (deal_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sb = createClient(supabaseUrl, supabaseKey);

        const dbUpdate: Record<string, unknown> = {};
        if (oqueFaz) dbUpdate.oque_faz = oqueFaz;
        if (cargo) dbUpdate.cargo = cargo;
        if (faturamento) dbUpdate.faturamento = faturamento;
        if (funcionarios) dbUpdate.funcionarios = funcionarios;
        if (prioridade) dbUpdate.prioridade = prioridade;
        if (date) dbUpdate.data_reuniao = date;
        if (time) dbUpdate.horario_reuniao = time;
        if (date && time) dbUpdate.status = 'completo';

        if (Object.keys(dbUpdate).length > 0) {
          try {
            const { error: dbErr } = await sb.from('leads').update(dbUpdate).eq('pipedrive_deal_id', deal_id);
            if (dbErr) console.error('[Update-Fallback] DB update failed:', dbErr);
            else console.log('[Update-Fallback] DB updated for deal', deal_id, dbUpdate);
          } catch (e) {
            console.error('[Update-Fallback] Exception:', e);
          }
        }
      }

      // SERVER-SIDE n8n FALLBACK: trigger n8n call when scheduling is complete
      if (date && time) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          
          // Get lead info for phone number
          const sbN8n = createClient(supabaseUrl, supabaseKey);
          let leadPhone = payload.whatsapp || '';
          let leadName = payload.name || '';
          if (deal_id && (!leadPhone || !leadName)) {
            const { data: leadRow } = await sbN8n.from('leads').select('nome, sobrenome, whatsapp').eq('pipedrive_deal_id', deal_id).limit(1).maybeSingle();
            if (leadRow) {
              leadPhone = leadPhone || leadRow.whatsapp;
              leadName = leadName || `${leadRow.nome} ${leadRow.sobrenome || ''}`.trim();
            }
          }

          if (leadPhone && leadName) {
            const dateParts2 = date.split('/');
            const callDatetime = dateParts2.length === 3
              ? `${dateParts2[2]}-${dateParts2[1].padStart(2, '0')}-${dateParts2[0].padStart(2, '0')}T${time}:00-03:00`
              : `${date}T${time}:00-03:00`;
            const phone = leadPhone.startsWith('+') ? leadPhone : `+55${leadPhone.replace(/\D/g, '')}`;

            const n8nRes = await fetch(`${supabaseUrl}/functions/v1/trigger-n8n-call`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
              body: JSON.stringify({
                lead_name: leadName,
                lead_phone: phone,
                call_datetime: callDatetime,
                subscriber_id: null,
                deal_id: deal_id,
              }),
            });
            const n8nText = await n8nRes.text();
            console.log(`[Update-n8n-Fallback] trigger-n8n-call response: ${n8nRes.status} ${n8nText}`);
          } else {
            console.warn('[Update-n8n-Fallback] Missing leadPhone or leadName, skipping n8n trigger');
          }
        } catch (e) {
          console.error('[Update-n8n-Fallback] Failed to trigger n8n:', e);
        }
      }

      return new Response(JSON.stringify({ success: true, ...(deal_id !== payload.deal_id ? { new_deal_id: deal_id } : {}) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: RESCHEDULE — update existing deal with new date/time (for no-show leads)
    if (action === 'reschedule') {
      const { deal_id, person_id, org_id, date, time, name } = payload;

      if (!deal_id || !date || !time) {
        throw new Error('deal_id, date, and time are required for reschedule');
      }

      // Update deal custom field "Data Reunião"
      const reuniaoKey = await ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Data Reunião', 'varchar');
      await pipedriveFetch(`/deals/${deal_id}`, 'PUT', PIPEDRIVE_API_TOKEN, {
        [reuniaoKey]: `${date} às ${time}`,
      });

      // Move deal back to "Reunião Agendada" stage
      try {
        const pipeline = await findPipelineByName(PIPEDRIVE_API_TOKEN, 'Orbit');
        if (pipeline) {
          const stagesData = await pipedriveFetch(`/stages?pipeline_id=${pipeline.id}`, 'GET', PIPEDRIVE_API_TOKEN);
          const reuniaoStage = stagesData.data?.find((s: { name: string }) =>
            s.name.toLowerCase().includes('reunião agendada') || s.name.toLowerCase().includes('reuniao agendada')
          );
          if (reuniaoStage) {
            await pipedriveFetch(`/deals/${deal_id}`, 'PUT', PIPEDRIVE_API_TOKEN, {
              stage_id: reuniaoStage.id,
            });
          }
        }
      } catch (e) {
        console.error('[Reschedule] Failed to move deal stage:', e);
      }

      // Create new activity
      try {
        const dateParts = date.split('/');
        let dueDate = date;
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          dueDate = `${year}-${month}-${day}`;
        }
        const [hh, mm] = time.split(':').map(Number);
        const utcHour = (hh + 3) % 24;
        const dueTime = `${utcHour.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;

        let activityDueDate = dueDate;
        if (hh + 3 >= 24 && dateParts.length === 3) {
          const d = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]) + 1);
          activityDueDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        }

        // Get deal owner
        let dealOwnerId: number | undefined;
        try {
          const dealInfo = await pipedriveFetch(`/deals/${deal_id}`, 'GET', PIPEDRIVE_API_TOKEN);
          dealOwnerId = dealInfo.data?.user_id?.id || dealInfo.data?.user_id;
        } catch (e) {
          console.error('[Reschedule] Failed to get deal owner:', e);
        }

        // Find activity type
        let activityTypeKey = 'meeting';
        try {
          const typesRes = await pipedriveFetch('/activityTypes', 'GET', PIPEDRIVE_API_TOKEN);
          const virtualType = typesRes.data?.find((t: { name: string; key_string: string }) =>
            t.name.toLowerCase().includes('reunião virtual') || t.name.toLowerCase().includes('reuniao virtual')
          );
          if (virtualType) activityTypeKey = virtualType.key_string;
        } catch (e) {
          console.error('[Reschedule] Failed to fetch activity types:', e);
        }

        await pipedriveFetch('/activities', 'POST', PIPEDRIVE_API_TOKEN, {
          subject: `Reunião Reagendada - ${time}`,
          type: activityTypeKey,
          due_date: activityDueDate,
          due_time: dueTime,
          duration: '01:00',
          deal_id: deal_id,
          ...(person_id ? { person_id } : {}),
          ...(org_id ? { org_id } : {}),
          ...(dealOwnerId ? { user_id: dealOwnerId } : {}),
          note: `Reunião reagendada pelo link de reagendamento.\n📅 ${date} às ${time}`,
        });
      } catch (e) {
        console.error('[Reschedule] Failed to create activity:', e);
      }

      // Add note to deal
      try {
        await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
          content: `🔄 Reagendamento\n\n${name || 'Lead'} reagendou a demonstração para ${date} às ${time}.`,
          deal_id,
          pinned_to_deal_flag: 0,
        });
      } catch (e) {
        console.error('[Reschedule] Failed to add note:', e);
      }

      // SERVER-SIDE n8n FALLBACK for reschedule
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sbN8n = createClient(supabaseUrl, supabaseKey);

        let leadPhone = '';
        let leadName2 = name || '';
        const { data: leadRow } = await sbN8n.from('leads').select('nome, sobrenome, whatsapp, manychat_subscriber_id').eq('pipedrive_deal_id', deal_id).limit(1).maybeSingle();
        if (leadRow) {
          leadPhone = leadRow.whatsapp;
          leadName2 = leadName2 || `${leadRow.nome} ${leadRow.sobrenome || ''}`.trim();
        }

        if (leadPhone && leadName2) {
          const dateParts2 = date.split('/');
          const callDatetime = dateParts2.length === 3
            ? `${dateParts2[2]}-${dateParts2[1].padStart(2, '0')}-${dateParts2[0].padStart(2, '0')}T${time}:00-03:00`
            : `${date}T${time}:00-03:00`;
          const phone = leadPhone.startsWith('+') ? leadPhone : `+55${leadPhone.replace(/\D/g, '')}`;

          const n8nRes = await fetch(`${supabaseUrl}/functions/v1/trigger-n8n-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
            body: JSON.stringify({
              lead_name: leadName2,
              lead_phone: phone,
              call_datetime: callDatetime,
              subscriber_id: leadRow?.manychat_subscriber_id || null,
              deal_id: deal_id,
            }),
          });
          const n8nText = await n8nRes.text();
          console.log(`[Reschedule-n8n-Fallback] trigger-n8n-call response: ${n8nRes.status} ${n8nText}`);
        }
      } catch (e) {
        console.error('[Reschedule-n8n-Fallback] Failed to trigger n8n:', e);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: SYNC — fetch recent Pipedrive deals from Orbit pipeline and insert missing ones into DB
    if (action === 'sync') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const sb = createClient(supabaseUrl, supabaseKey);

      // Find Orbit pipeline
      const pipeline = await findPipelineByName(PIPEDRIVE_API_TOKEN, 'Orbit');
      if (!pipeline) {
        return new Response(JSON.stringify({ success: false, error: 'Orbit pipeline not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch deals from Orbit pipeline (single page, use 'start' param for pagination)
      const startOffset = payload.start || 0;
      const dealsRes = await pipedriveFetch(`/deals?pipeline_id=${pipeline.id}&status=all_not_deleted&limit=100&start=${startOffset}`, 'GET', PIPEDRIVE_API_TOKEN);
      const deals = dealsRes.data || [];
      const hasMorePages = dealsRes.additional_data?.pagination?.more_items_in_collection === true;

      // Get existing deal IDs from DB
      const { data: existingLeads } = await sb.from('leads').select('pipedrive_deal_id').not('pipedrive_deal_id', 'is', null);
      const existingDealIds = new Set((existingLeads || []).map((l: { pipedrive_deal_id: number }) => l.pipedrive_deal_id));

      const synced: string[] = [];
      const skipped: string[] = [];

      for (const deal of deals) {
        if (existingDealIds.has(deal.id)) {
          skipped.push(`${deal.title} (deal ${deal.id})`);
          continue;
        }

        // Fetch person details
        let personEmail = '';
        let personPhone = '';
        let personName = '';
        if (deal.person_id) {
          try {
            const personRes = await pipedriveFetch(`/persons/${deal.person_id.value || deal.person_id}`, 'GET', PIPEDRIVE_API_TOKEN);
            const person = personRes.data;
            personName = person.name || '';
            personEmail = person.email?.[0]?.value || '';
            personPhone = person.phone?.[0]?.value || '';
          } catch { /* skip */ }
        }

        // Fetch notes for this deal to extract scheduling info
        let dataReuniao = '';
        let horarioReuniao = '';
        try {
          const notesRes = await pipedriveFetch(`/deals/${deal.id}/notes`, 'GET', PIPEDRIVE_API_TOKEN);
          const mainNote = notesRes.data?.find((n: any) => n.content?.includes('Reunião:')) || notesRes.data?.[0];
          if (mainNote?.content) {
            const reuniaoMatch = mainNote.content.match(/Reunião:\s*(\d{2}\/\d{2}\/\d{4})\s*às\s*(\d{2}:\d{2})/);
            if (reuniaoMatch) {
              dataReuniao = reuniaoMatch[1];
              horarioReuniao = reuniaoMatch[2];
            }
          }
        } catch { /* skip */ }

        const orgName = deal.org_name || '';
        const parts = personName.trim().split(' ');

        if (!personEmail) {
          skipped.push(`${deal.title} (no email)`);
          continue;
        }

        const { error: insertErr } = await sb.from('leads').insert({
          nome: parts[0] || '',
          sobrenome: parts.slice(1).join(' ') || '',
          whatsapp: personPhone || '',
          email: personEmail,
          empresa: orgName,
          status: dataReuniao ? 'completo' : 'parcial',
          data_reuniao: dataReuniao || '',
          horario_reuniao: horarioReuniao || '',
          pipedrive_person_id: deal.person_id?.value || deal.person_id || null,
          pipedrive_org_id: deal.org_id?.value || deal.org_id || null,
          pipedrive_deal_id: deal.id,
        });

        if (insertErr) {
          console.error(`[Sync] Failed to insert deal ${deal.id}:`, insertErr);
          skipped.push(`${deal.title} (insert error: ${insertErr.message})`);
        } else {
          synced.push(`${personName} <${personEmail}> (deal ${deal.id})`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        total_deals: deals.length,
        synced: synced.length,
        skipped: skipped.length,
        has_more: hasMorePages,
        next_start: startOffset + 100,
        synced_details: synced,
        skipped_details: skipped,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: SEARCH — search for a person by email in Pipedrive and sync to DB
    if (action === 'search') {
      const { email: searchEmail } = payload;
      if (!searchEmail) throw new Error('email is required for search');

      const searchRes = await fetch(
        `${BASE_URL}/persons/search?term=${encodeURIComponent(searchEmail)}&fields=email&limit=5&api_token=${PIPEDRIVE_API_TOKEN}`
      );
      const searchData = await searchRes.json();
      const items = searchData?.data?.items || [];
      
      const results: unknown[] = [];
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const sb = createClient(supabaseUrl, supabaseKey);

      for (const item of items) {
        const person = item.item;
        const personId = person.id;
        const personName = person.name || '';
        const personEmail = person.primary_email || searchEmail;
        const personPhone = person.phones?.[0] || '';

        // Get deals for this person
        try {
          const dealsRes = await pipedriveFetch(`/persons/${personId}/deals?status=all_not_deleted`, 'GET', PIPEDRIVE_API_TOKEN);
          for (const deal of (dealsRes.data || [])) {
            // Check if already in DB
            const { data: existing } = await sb.from('leads').select('id').eq('pipedrive_deal_id', deal.id).maybeSingle();
            if (existing) {
              results.push({ deal_id: deal.id, title: deal.title, status: 'already_in_db' });
              continue;
            }

            // Fetch notes for scheduling info
            let dataReuniao = '';
            let horarioReuniao = '';
            try {
              const notesRes = await pipedriveFetch(`/deals/${deal.id}/notes`, 'GET', PIPEDRIVE_API_TOKEN);
              const mainNote = notesRes.data?.find((n: any) => n.content?.includes('Reunião:')) || notesRes.data?.[0];
              if (mainNote?.content) {
                const m = pinnedNote.content.match(/Reunião:\s*(\d{2}\/\d{2}\/\d{4})\s*às\s*(\d{2}:\d{2})/);
                if (m) { dataReuniao = m[1]; horarioReuniao = m[2]; }
              }
            } catch { /* skip */ }

            const parts = personName.trim().split(' ');
            const orgName = deal.org_name || '';

            const { error: insertErr } = await sb.from('leads').insert({
              nome: parts[0] || '',
              sobrenome: parts.slice(1).join(' ') || '',
              whatsapp: personPhone || '',
              email: personEmail,
              empresa: orgName,
              status: dataReuniao ? 'completo' : 'parcial',
              data_reuniao: dataReuniao,
              horario_reuniao: horarioReuniao,
              pipedrive_person_id: personId,
              pipedrive_org_id: deal.org_id?.value || deal.org_id || null,
              pipedrive_deal_id: deal.id,
            });

            results.push({ 
              deal_id: deal.id, title: deal.title, 
              status: insertErr ? `error: ${insertErr.message}` : 'synced',
              dataReuniao, horarioReuniao,
            });
          }
        } catch (e) {
          results.push({ person_id: personId, error: String(e) });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: REPAIR — fix leads that exist in DB but have missing scheduling data
    if (action === 'repair') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const sb = createClient(supabaseUrl, supabaseKey);

      // Find leads with pipedrive_deal_id but missing scheduling data
      const limit = payload.limit || 5;
      let query = sb.from('leads')
        .select('id, pipedrive_deal_id, email, nome')
        .not('pipedrive_deal_id', 'is', null)
        .or('data_reuniao.is.null,data_reuniao.eq.')
        .limit(limit);
      
      // Optional: filter by specific deal_id
      if (payload.deal_id) {
        query = sb.from('leads')
          .select('id, pipedrive_deal_id, email, nome')
          .eq('pipedrive_deal_id', payload.deal_id);
      }

      const { data: brokenLeads } = await query;

      if (!brokenLeads || brokenLeads.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No leads to repair', repaired: 0 }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the "Data Reunião" custom field key
      const reuniaoKey = await ensureCustomField(PIPEDRIVE_API_TOKEN, 'dealFields', 'Data Reunião', 'varchar');

      const repaired: string[] = [];
      const failed: string[] = [];

      for (const lead of brokenLeads) {
        try {
          // Fetch deal from Pipedrive to get custom field "Data Reunião"
          const dealRes = await pipedriveFetch(`/deals/${lead.pipedrive_deal_id}`, 'GET', PIPEDRIVE_API_TOKEN);
          const deal = dealRes.data;
          const reuniaoValue = deal?.[reuniaoKey] || ''; // e.g. "05/03/2026 às 14:00"

          let dataReuniao = '';
          let horarioReuniao = '';

          if (reuniaoValue) {
            const m = reuniaoValue.match(/(\d{2}\/\d{2}\/\d{4})\s*às\s*(\d{2}:\d{2})/);
            if (m) { dataReuniao = m[1]; horarioReuniao = m[2]; }
          }

          // If not in custom field, try notes
          if (!dataReuniao) {
            try {
              const notesRes = await pipedriveFetch(`/deals/${lead.pipedrive_deal_id}/notes`, 'GET', PIPEDRIVE_API_TOKEN);
              const mainNote = notesRes.data?.find((n: any) => n.content?.includes('Reunião:')) || notesRes.data?.[0];
              if (mainNote?.content) {
                const m = pinnedNote.content.match(/Reunião:\s*(\d{2}\/\d{2}\/\d{4})\s*às\s*(\d{2}:\d{2})/);
                if (m) { dataReuniao = m[1]; horarioReuniao = m[2]; }
              }
            } catch { /* skip */ }
          }

          // Also extract other fields from notes if available
          let oqueFaz = '', cargo = '', faturamento = '', funcionarios = '', prioridade = '';
          try {
            const notesRes = await pipedriveFetch(`/deals/${lead.pipedrive_deal_id}/notes`, 'GET', PIPEDRIVE_API_TOKEN);
            const mainNote = notesRes.data?.find((n: any) => n.content?.includes('Segmento') || n.content?.includes('Cargo')) || notesRes.data?.[0];
            if (mainNote?.content) {
              const c = mainNote.content;
              const seg = c.match(/Segmento.*?:\s*(.+)/); if (seg) oqueFaz = seg[1].trim();
              const car = c.match(/Cargo:\s*(.+)/); if (car) cargo = car[1].trim();
              const fat = c.match(/Faturamento:\s*(.+)/); if (fat) faturamento = fat[1].trim();
              const func = c.match(/Funcion.rios:\s*(.+)/); if (func) funcionarios = func[1].trim();
              const pri = c.match(/Prioridade:\s*(.+)/); if (pri) prioridade = pri[1].trim();
            }
          } catch { /* skip */ }

          const update: Record<string, unknown> = {};
          if (dataReuniao) { update.data_reuniao = dataReuniao; update.horario_reuniao = horarioReuniao; update.status = 'completo'; }
          if (oqueFaz && oqueFaz !== '-') update.oque_faz = oqueFaz;
          if (cargo && cargo !== '-') update.cargo = cargo;
          if (faturamento && faturamento !== '-') update.faturamento = faturamento;
          if (funcionarios && funcionarios !== '-') update.funcionarios = funcionarios;
          if (prioridade && prioridade !== '-') update.prioridade = prioridade;

          if (Object.keys(update).length > 0) {
            await sb.from('leads').update(update).eq('id', lead.id);
            repaired.push(`${lead.nome} <${lead.email}> → ${dataReuniao || 'no date'} ${horarioReuniao}`);
          } else {
            failed.push(`${lead.nome} <${lead.email}> (no data in Pipedrive)`);
          }
        } catch (e) {
          failed.push(`${lead.nome} <${lead.email}> (error: ${String(e)})`);
        }
      }

      return new Response(JSON.stringify({ success: true, total: brokenLeads.length, repaired: repaired.length, failed: failed.length, repaired_details: repaired, failed_details: failed }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: ADD_LABEL — add a label to an existing deal (merge, don't overwrite)
    if (action === 'add_label') {
      const { deal_id, label_name, label_color } = payload;
      if (!deal_id || !label_name) {
        return new Response(JSON.stringify({ success: false, error: 'deal_id and label_name are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await setDealLabel(PIPEDRIVE_API_TOKEN, deal_id, label_name, label_color);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: ARCHIVE_DEAL — mark deal as lost in Pipedrive
    if (action === 'archive_deal') {
      const { deal_id, lost_reason } = payload;
      if (!deal_id) {
        return new Response(JSON.stringify({ success: false, error: 'deal_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await pipedriveFetch(`/deals/${deal_id}`, 'PUT', PIPEDRIVE_API_TOKEN, {
        status: 'lost',
        lost_reason: lost_reason || 'Faturamento abaixo do mínimo (< R$ 30 mil)',
      });
      console.log(`[Archive] Deal ${deal_id} marked as lost`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: ADD_NOTE — add a note to a deal
    if (action === 'add_note') {
      const { deal_id, note_content } = payload;
      if (!deal_id || !note_content) {
        return new Response(JSON.stringify({ success: false, error: 'deal_id and note_content are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await pipedriveFetch('/notes', 'POST', PIPEDRIVE_API_TOKEN, {
        content: note_content,
        deal_id,
        pinned_to_deal_flag: 0,
      });
      console.log(`[AddNote] Note added to deal ${deal_id}`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    console.error('Error in Pipedrive function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
