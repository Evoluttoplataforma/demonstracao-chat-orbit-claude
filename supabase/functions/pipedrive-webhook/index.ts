import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MANYCHAT_API = "https://api.manychat.com/fb";

const CUSTOM_FIELD_MAP: Record<string, string> = {
  empresa: "Empresa",
  oque_faz: "Segmento",
  cargo: "Cargo",
  faturamento: "Faturamento",
  funcionarios: "Funcionarios",
  prioridade: "Prioridade",
  data_reuniao: "Data Reuniao",
  horario_reuniao: "Horario Reuniao",
  software_gestao: "Software Gestao",
  utm_source: "UTM Source",
  utm_medium: "UTM Medium",
  utm_campaign: "UTM Campaign",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getCustomFieldId(fieldName: string, apiToken: string): Promise<number | null> {
  const data = await mcGet("page/getCustomFields", apiToken);
  if (!data?.data) {
    console.warn("[pipedrive-webhook] Failed to fetch custom fields:", JSON.stringify(data).substring(0, 300));
    return null;
  }
  const field = data.data.find((f: { name: string; id: number }) =>
    f.name.toLowerCase() === fieldName.toLowerCase()
  );
  if (field) {
    console.log(`[pipedrive-webhook] Custom field "${fieldName}" → field_id=${field.id}`);
  } else {
    console.warn(`[pipedrive-webhook] Custom field "${fieldName}" not found`);
  }
  return field?.id ?? null;
}

async function syncSystemFields(
  subscriberId: string,
  lead: Record<string, unknown>,
  apiToken: string
): Promise<void> {
  const payload: Record<string, unknown> = { subscriber_id: subscriberId };
  if (lead.nome) payload.first_name = String(lead.nome);
  if (lead.sobrenome) payload.last_name = String(lead.sobrenome);
  if (lead.email) {
    payload.email = String(lead.email);
    payload.has_opt_in_email = true;
  }
  // NOTE: Do NOT send phone/has_opt_in_sms — phone was already set during createSubscriber
  // Sending phone requires consent_phrase which causes the entire updateSubscriber to fail
  console.log(`[pipedrive-webhook] updateSubscriber for ${subscriberId}:`, JSON.stringify(payload));
  try {
    const res = await mcPost("subscriber/updateSubscriber", payload, apiToken);
    if (res?.status !== "success") {
      console.warn(`[pipedrive-webhook] updateSubscriber failed:`, JSON.stringify(res));
    }
  } catch (err) {
    console.warn(`[pipedrive-webhook] Error in updateSubscriber:`, err);
  }
  await sleep(250);
}

async function setAllCustomFields(
  subscriberId: string,
  lead: Record<string, unknown>,
  apiToken: string
): Promise<void> {
  // 1. Sync system fields (nome, sobrenome, email, phone)
  await syncSystemFields(subscriberId, lead, apiToken);

  // 2. Fetch all custom field IDs once (cache)
  const allFieldsData = await mcGet("page/getCustomFields", apiToken);
  const fieldIdCache: Record<string, number> = {};
  if (allFieldsData?.data) {
    for (const f of allFieldsData.data) {
      fieldIdCache[f.name.toLowerCase()] = f.id;
    }
    console.log(`[pipedrive-webhook] Loaded ${Object.keys(fieldIdCache).length} custom field IDs`);
  } else {
    console.error("[pipedrive-webhook] Failed to load custom fields");
    return;
  }

  // 3. Custom fields using field_id (NOT field_name) for WhatsApp compatibility
  for (const [ourKey, fieldName] of Object.entries(CUSTOM_FIELD_MAP)) {
    const value = lead[ourKey];
    if (!value) continue;

    const fieldId = fieldIdCache[fieldName.toLowerCase()];
    if (!fieldId) {
      console.warn(`[pipedrive-webhook] Field "${fieldName}" not found, skipping`);
      continue;
    }

    try {
      const res = await mcPost("subscriber/setCustomField", {
        subscriber_id: subscriberId,
        field_id: fieldId,
        field_value: String(value),
      }, apiToken);
      console.log(`[pipedrive-webhook] setCustomField ${fieldName} (id=${fieldId}):`, JSON.stringify(res));
    } catch (err) {
      console.warn(`[pipedrive-webhook] Error setting ${fieldName}:`, err);
    }
    await sleep(250);
  }

  // Set combined datetime field
  if (lead.data_reuniao && lead.horario_reuniao) {
    const isoDatetime = buildIsoDatetime(String(lead.data_reuniao), String(lead.horario_reuniao));
    if (isoDatetime) {
      const dtFieldId = fieldIdCache["horário da reunião datetime"];
      if (dtFieldId) {
        try {
          const res = await mcPost("subscriber/setCustomField", {
            subscriber_id: subscriberId,
            field_id: dtFieldId,
            field_value: isoDatetime,
          }, apiToken);
          console.log(`[pipedrive-webhook] setCustomField Datetime (id=${dtFieldId}):`, JSON.stringify(res));
        } catch (err) {
          console.warn(`[pipedrive-webhook] Error setting datetime field:`, err);
        }
      } else {
        console.warn(`[pipedrive-webhook] Field "Horário da Reunião Datetime" not found. Available: ${Object.keys(fieldIdCache).join(", ")}`);
      }
    }
  }

  console.log("[pipedrive-webhook] All custom fields synced for subscriber:", subscriberId);
}

const STAGE_TAG_MAP: Record<string, string> = {
  "reuniao agendada": "agendou-reuniao",
  "nao entrou na reuniao": "nao-entrou-na-reuniao",
  "participou reuniao grupo": "participou-reuniao",
  "negociacoes iniciadas": "negociacoes-iniciadas",
  "propostas": "propostas",
  "testando pre analise": "testando-pre-analise",
};

function buildIsoDatetime(dateStr: string, timeStr: string): string | null {
  try {
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year) return null;
    const [hour, minute] = timeStr.split(":");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${(hour || "00").padStart(2, "0")}:${(minute || "00").padStart(2, "0")}:00-03:00`;
  } catch {
    return null;
  }
}

function normalizeStage(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = "55" + digits;
  return digits;
}

async function mcPost(endpoint: string, body: Record<string, unknown>, apiToken: string) {
  const res = await fetch(`${MANYCHAT_API}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { console.warn("[pipedrive-webhook] Non-JSON response:", text.substring(0, 200)); return { status: "error", message: "Non-JSON response" }; }
}

async function mcGet(endpoint: string, apiToken: string) {
  const res = await fetch(`${MANYCHAT_API}/${endpoint}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { console.warn("[pipedrive-webhook] Non-JSON response:", text.substring(0, 200)); return { status: "error", message: "Non-JSON response" }; }
}

async function getTagId(tagName: string, apiToken: string): Promise<number | null> {
  const data = await mcGet("page/getTags", apiToken);
  if (!data?.data) return null;
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const tag = data.data.find(
    (t: { name: string; id: number }) => normalize(t.name) === normalize(tagName)
  );
  return tag?.id ?? null;
}

function extractSubscriberId(data: Record<string, unknown>): string | null {
  if (!data?.data) return null;
  const d = data.data as Record<string, unknown>;
  if (Array.isArray(d) && d.length > 0) return String((d[0] as Record<string, unknown>).id);
  if (d.id) return String(d.id);
  return null;
}

async function findSubscriber(
  lead: Record<string, unknown>,
  apiToken: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ subscriberId: string; freshLead: Record<string, unknown> } | null> {
  const whatsapp = String(lead.whatsapp);
  const email = lead.email ? String(lead.email) : null;
  const normalizedPhone = normalizePhone(whatsapp);

  // Step 0: Check cached subscriber_id from DB
  if (lead.manychat_subscriber_id) {
    console.log(`[pipedrive-webhook] Step 0: Using cached subscriber_id: ${lead.manychat_subscriber_id}`);
    return { subscriberId: String(lead.manychat_subscriber_id), freshLead: lead };
  }

  // Step 0b: Wait 5s for concurrent processes (tag-manychat) to finish, then re-read lead
  console.log(`[pipedrive-webhook] Step 0b: subscriber_id is null, waiting 5s for concurrent processes...`);
  await sleep(5000);
  const { data: freshLead } = await supabase
    .from("leads")
    .select("*")
    .eq("whatsapp", whatsapp)
    .maybeSingle();
  if (freshLead?.manychat_subscriber_id) {
    console.log(`[pipedrive-webhook] Step 0b: Found subscriber_id after retry: ${freshLead.manychat_subscriber_id}`);
    return { subscriberId: String(freshLead.manychat_subscriber_id), freshLead: freshLead as Record<string, unknown> };
  }
  console.log(`[pipedrive-webhook] Step 0b: Still no subscriber_id after retry, continuing with lookup...`);

  // Step 1: findBySystemField email (only email works for WhatsApp contacts)
  if (email) {
    console.log(`[pipedrive-webhook] Step 1: findBySystemField email=${email}`);
    const emailData = await mcGet(
      `subscriber/findBySystemField?field_name=email&field_value=${encodeURIComponent(email)}`,
      apiToken
    );
    console.log(`[pipedrive-webhook] Step 1 result:`, JSON.stringify(emailData).substring(0, 300));
    const subId = extractSubscriberId(emailData);
    if (subId) {
      console.log(`[pipedrive-webhook] Found by email: ${subId}`);
      await saveSubscriberId(supabase, whatsapp, subId);
      return { subscriberId: subId, freshLead: (freshLead || lead) as Record<string, unknown> };
    }
  }

  // Step 2: findByCustomField with dynamic field_id for Email
  if (email) {
    console.log(`[pipedrive-webhook] Step 2: findByCustomField Email=${email} (with field_id)`);
    const emailFieldId = await getCustomFieldId("Email", apiToken);
    if (emailFieldId) {
      const customEmailData = await mcGet(
        `subscriber/findByCustomField?field_id=${emailFieldId}&field_value=${encodeURIComponent(email)}`,
        apiToken
      );
      console.log(`[pipedrive-webhook] Step 2 result:`, JSON.stringify(customEmailData).substring(0, 300));
      const subId = extractSubscriberId(customEmailData);
      if (subId) {
        console.log(`[pipedrive-webhook] Found by custom Email: ${subId}`);
        await saveSubscriberId(supabase, whatsapp, subId);
        return { subscriberId: subId, freshLead: (freshLead || lead) as Record<string, unknown> };
      }
    }
  }

  // Step 3: Try createSubscriber
  console.log(`[pipedrive-webhook] Step 3: createSubscriber for ${normalizedPhone}`);
  const createData = await mcPost("subscriber/createSubscriber", {
    whatsapp_phone: normalizedPhone,
    consent_phrase: "Lead from Orbit website",
    has_opt_in_email: false,
    has_opt_in_sms: false,
  }, apiToken);
  console.log("[pipedrive-webhook] Step 3 result:", JSON.stringify(createData).substring(0, 400));

  if (createData?.data?.id) {
    const newId = String(createData.data.id);
    console.log(`[pipedrive-webhook] Created subscriber: ${newId}`);
    await saveSubscriberId(supabase, whatsapp, newId);
    return { subscriberId: newId, freshLead: (freshLead || lead) as Record<string, unknown> };
  }

  // Step 4: "already exists" — try findByCustomField with Empresa or other fields
  const errStr = JSON.stringify(createData);
  const waIdMatch = errStr.match(/already exists: (\d+)/);
  if (waIdMatch) {
    const waId = waIdMatch[1];
    console.log(`[pipedrive-webhook] Step 4: "already exists" wa_id=${waId}`);

    // 4a: Try Empresa custom field
    const empresa = lead.empresa ? String(lead.empresa) : null;
    if (empresa) {
      const empresaFieldId = await getCustomFieldId("Empresa", apiToken);
      if (empresaFieldId) {
        console.log(`[pipedrive-webhook] Step 4a: findByCustomField Empresa=${empresa}`);
        const empresaData = await mcGet(
          `subscriber/findByCustomField?field_id=${empresaFieldId}&field_value=${encodeURIComponent(empresa)}`,
          apiToken
        );
        console.log(`[pipedrive-webhook] Step 4a result:`, JSON.stringify(empresaData).substring(0, 300));
        const subId = extractSubscriberId(empresaData);
        if (subId) {
          console.log(`[pipedrive-webhook] Found by Empresa: ${subId}`);
          await saveSubscriberId(supabase, whatsapp, subId);
          return { subscriberId: subId, freshLead: (freshLead || lead) as Record<string, unknown> };
        }
      }
    }

    // 4b: Try phone lookup with wa_id
    if (waId !== normalizedPhone) {
      console.log(`[pipedrive-webhook] Step 4b: findBySystemField phone=+${waId}`);
      const waPhoneData = await mcGet(
        `subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent("+" + waId)}`,
        apiToken
      );
      console.log(`[pipedrive-webhook] Step 4b result:`, JSON.stringify(waPhoneData).substring(0, 300));
      const subId = extractSubscriberId(waPhoneData);
      if (subId) {
        console.log(`[pipedrive-webhook] Found via wa_id: ${subId}`);
        await saveSubscriberId(supabase, whatsapp, subId);
        return { subscriberId: subId, freshLead: (freshLead || lead) as Record<string, unknown> };
      }
    }
  }

  console.error("[pipedrive-webhook] FAILED: Could not find subscriber:", whatsapp, email);
  return null;
}

async function saveSubscriberId(
  supabase: ReturnType<typeof createClient>,
  whatsapp: string,
  subscriberId: string
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ manychat_subscriber_id: subscriberId })
    .eq("whatsapp", whatsapp);
  if (error) {
    console.warn("[pipedrive-webhook] Failed to save subscriber_id:", error);
  } else {
    console.log(`[pipedrive-webhook] Saved subscriber_id ${subscriberId} for ${whatsapp}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pipedriveToken = Deno.env.get("PIPEDRIVE_API_TOKEN");
    const manychatToken = Deno.env.get("MANYCHAT_API_TOKEN");
    if (!pipedriveToken || !manychatToken) {
      return new Response(JSON.stringify({ error: "Missing API tokens" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("[pipedrive-webhook] Event received:", JSON.stringify(body).substring(0, 500));

    const current = body.current || body.data;
    const previous = body.previous;
    if (!current) {
      return new Response(JSON.stringify({ ok: true, skipped: "no current data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[pipedrive-webhook] Deal ${current.id}, stage_id: ${current.stage_id}, prev: ${previous?.stage_id}`);

    const dealId = current.id;
    const stageId = current.stage_id;
    const previousStageId = previous?.stage_id;

    if (stageId === previousStageId) {
      return new Response(JSON.stringify({ ok: true, skipped: "stage not changed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stageRes = await fetch(
      `https://api.pipedrive.com/v1/stages/${stageId}?api_token=${pipedriveToken}`
    );
    const stageData = await stageRes.json();
    const stageName = stageData?.data?.name;
    console.log(`[pipedrive-webhook] Deal ${dealId} moved to stage: "${stageName}" (id: ${stageId})`);

    if (!stageName) {
      return new Response(JSON.stringify({ ok: true, skipped: "could not resolve stage name" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedStage = normalizeStage(stageName);
    const tagName = STAGE_TAG_MAP[normalizedStage];

    if (!tagName) {
      return new Response(JSON.stringify({ ok: true, skipped: `stage "${stageName}" not mapped` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[pipedrive-webhook] Matched stage → tag: "${tagName}"`);

    const CONFLICTING_TAGS: Record<string, string[]> = {
      "agendou-reuniao": ["nao-entrou-na-reuniao", "participou-reuniao", "nao-respondeu-chat-demonstracao"],
      "nao-entrou-na-reuniao": ["agendou-reuniao", "participou-reuniao", "nao-respondeu-chat-demonstracao"],
      "participou-reuniao": ["agendou-reuniao", "nao-entrou-na-reuniao", "nao-respondeu-chat-demonstracao"],
      "negociacoes-iniciadas": ["nao-respondeu-chat-demonstracao"],
      "propostas": ["nao-respondeu-chat-demonstracao"],
      "testando-pre-analise": ["nao-respondeu-chat-demonstracao"],
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("pipedrive_deal_id", dealId)
      .maybeSingle();

    if (error || !lead) {
      console.error(`[pipedrive-webhook] Lead not found for deal ${dealId}:`, error);
      return new Response(JSON.stringify({ ok: false, error: "Lead not found", dealId }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[pipedrive-webhook] Found lead: ${lead.nome} (${lead.whatsapp}), cached_sub_id: ${lead.manychat_subscriber_id}`);

    // Update etapa_pipedrive and status_reuniao in database
    const STAGE_STATUS_MAP: Record<string, string> = {
      "agendou-reuniao": "reuniao_agendada",
      "nao-entrou-na-reuniao": "nao_entrou",
      "participou-reuniao": "participou",
      "negociacoes-iniciadas": "negociacoes_iniciadas",
      "propostas": "propostas",
      "testando-pre-analise": "testando_pre_analise",
    };
    const dbUpdate: Record<string, string> = { etapa_pipedrive: stageName };
    const statusReuniao = STAGE_STATUS_MAP[tagName];
    if (statusReuniao) {
      dbUpdate.status_reuniao = statusReuniao;
    }
    const { error: updateError } = await supabase
      .from("leads")
      .update(dbUpdate)
      .eq("pipedrive_deal_id", dealId);
    if (updateError) {
      console.error(`[pipedrive-webhook] Error updating lead:`, updateError);
    } else {
      console.log(`[pipedrive-webhook] etapa_pipedrive set to "${stageName}" for deal ${dealId}`);
    }

    // Find subscriber using improved logic with DB cache + retry
    const result = await findSubscriber(lead, manychatToken, supabase);
    if (!result) {
      return new Response(JSON.stringify({ ok: false, error: "Subscriber not found in ManyChat", whatsapp: lead.whatsapp }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { subscriberId, freshLead } = result;

    // Remove conflicting tags
    const tagsToRemove = CONFLICTING_TAGS[tagName] || [];
    for (const conflictTag of tagsToRemove) {
      const conflictTagId = await getTagId(conflictTag, manychatToken);
      if (conflictTagId) {
        const removeResult = await mcPost("subscriber/removeTag", {
          subscriber_id: subscriberId,
          tag_id: conflictTagId,
        }, manychatToken);
        console.log(`[pipedrive-webhook] Removed tag "${conflictTag}":`, JSON.stringify(removeResult));
      }
    }

    // Apply new tag
    const tagId = await getTagId(tagName, manychatToken);
    if (!tagId) {
      return new Response(JSON.stringify({ ok: false, error: `Tag '${tagName}' not found in ManyChat` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tagResult = await mcPost("subscriber/addTag", {
      subscriber_id: subscriberId,
      tag_id: tagId,
    }, manychatToken);
    console.log(`[pipedrive-webhook] Tag "${tagName}" applied:`, JSON.stringify(tagResult));

    // Sync all custom fields using freshLead (has latest data_reuniao, horario_reuniao, etc.)
    await setAllCustomFields(subscriberId, freshLead, manychatToken);

    return new Response(JSON.stringify({
      ok: true,
      dealId,
      stageName,
      tagName,
      subscriberId,
      tagsRemoved: tagsToRemove,
      tagged: tagResult?.status === "success",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[pipedrive-webhook] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
