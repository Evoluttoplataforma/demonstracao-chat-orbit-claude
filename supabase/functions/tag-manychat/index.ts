import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadFields {
  nome?: string;
  sobrenome?: string;
  email?: string;
  empresa?: string;
  oque_faz?: string;
  cargo?: string;
  faturamento?: string;
  funcionarios?: string;
  prioridade?: string;
  data_reuniao?: string;
  horario_reuniao?: string;
  software_gestao?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status_reuniao?: string;
  link_reuniao?: string;
}

interface TagRequest {
  action: "tag" | "batch-tag-existing" | "list-tags" | "sync-from-pipedrive";
  whatsapp?: string;
  tag_name?: string;
  lead_data?: LeadFields;
  offset?: number;
  limit?: number;
}

const MANYCHAT_API = "https://api.manychat.com/fb";

// email, nome, sobrenome are SYSTEM fields → synced via updateSubscriber, NOT here
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
  status_reuniao: "Status Reuniao",
  link_reuniao: "link_reuniao",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Build ISO 8601 datetime string from date (DD/MM/YYYY) and time (HH:mm).
 * Returns e.g. "2026-03-10T09:00:00-03:00"
 */
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

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) {
    digits = "55" + digits;
  }
  return digits;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function saveSubscriberId(whatsapp: string, subscriberId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("leads")
    .update({ manychat_subscriber_id: subscriberId })
    .eq("whatsapp", whatsapp);
  if (error) {
    console.warn("[ManyChat] Failed to save subscriber_id to DB:", error);
  } else {
    console.log(`[ManyChat] Saved subscriber_id ${subscriberId} for ${whatsapp}`);
  }
}

async function getSubscriberIdFromDb(whatsapp: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("leads")
    .select("manychat_subscriber_id")
    .eq("whatsapp", whatsapp)
    .not("manychat_subscriber_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (data?.manychat_subscriber_id) return data.manychat_subscriber_id;
  return null;
}

async function getCustomFieldId(fieldName: string, apiToken: string): Promise<number | null> {
  const data = await mcGet("page/getCustomFields", apiToken);
  if (!data?.data) {
    console.warn("[ManyChat] Failed to fetch custom fields:", JSON.stringify(data).substring(0, 300));
    return null;
  }
  const field = data.data.find((f: { name: string; id: number }) =>
    f.name.toLowerCase() === fieldName.toLowerCase()
  );
  if (field) {
    console.log(`[ManyChat] Custom field "${fieldName}" → field_id=${field.id}`);
  } else {
    console.warn(`[ManyChat] Custom field "${fieldName}" not found. Available: ${data.data.map((f: { name: string }) => f.name).join(", ")}`);
  }
  return field?.id ?? null;
}

/**
 * Sync system fields (first_name, last_name, email, phone) via updateSubscriber
 */
async function syncSystemFields(
  subscriberId: string,
  leadData: LeadFields,
  whatsapp: string,
  apiToken: string
): Promise<void> {
  const payload: Record<string, unknown> = { subscriber_id: subscriberId };
  if (leadData.nome) payload.first_name = leadData.nome;
  if (leadData.sobrenome) payload.last_name = leadData.sobrenome;
  if (leadData.email) {
    payload.email = leadData.email;
    payload.has_opt_in_email = true;
  }
  // NOTE: Do NOT send phone/has_opt_in_sms here — phone was already set during createSubscriber
  // Sending phone requires consent_phrase which causes the entire updateSubscriber to fail

  console.log(`[ManyChat] updateSubscriber for ${subscriberId}:`, JSON.stringify(payload));
  try {
    const res = await mcPost("subscriber/updateSubscriber", payload, apiToken);
    if (res?.status !== "success") {
      console.warn(`[ManyChat] updateSubscriber failed:`, JSON.stringify(res));
    } else {
      console.log(`[ManyChat] System fields synced for ${subscriberId}`);
    }
  } catch (err) {
    console.warn(`[ManyChat] Error in updateSubscriber:`, err);
  }
  await sleep(250);
}

async function setAllCustomFields(
  subscriberId: string,
  leadData: LeadFields,
  apiToken: string,
  whatsapp?: string
): Promise<void> {
  // 1. Sync system fields first (nome, sobrenome, email, phone)
  if (whatsapp) {
    await syncSystemFields(subscriberId, leadData, whatsapp, apiToken);
  }

  // 2. Fetch all custom field IDs once (cache for this call)
  const allFieldsData = await mcGet("page/getCustomFields", apiToken);
  const fieldIdCache: Record<string, number> = {};
  if (allFieldsData?.data) {
    for (const f of allFieldsData.data) {
      fieldIdCache[f.name.toLowerCase()] = f.id;
    }
    console.log(`[ManyChat] Loaded ${Object.keys(fieldIdCache).length} custom field IDs`);
  } else {
    console.error("[ManyChat] Failed to load custom fields, cannot set values");
    return;
  }

  // 3. Set custom fields using field_id (NOT field_name) for WhatsApp compatibility
  console.log("[ManyChat] Setting fields for subscriber:", subscriberId, "keys:", Object.keys(leadData).join(", "));
  for (const [ourKey, fieldName] of Object.entries(CUSTOM_FIELD_MAP)) {
    const value = leadData[ourKey as keyof LeadFields];
    if (!value) {
      console.log(`[ManyChat] Skipping field ${ourKey} (${fieldName}): no value`);
      continue;
    }

    const fieldId = fieldIdCache[fieldName.toLowerCase()];
    if (!fieldId) {
      console.warn(`[ManyChat] Field "${fieldName}" not found in custom fields, skipping`);
      continue;
    }

    console.log(`[ManyChat] Setting field ${fieldName} (id=${fieldId}) = ${value}`);
    try {
      const res = await mcPost("subscriber/setCustomField", {
        subscriber_id: subscriberId,
        field_id: fieldId,
        field_value: String(value),
      }, apiToken);
      console.log(`[ManyChat] setCustomField ${fieldName} result:`, JSON.stringify(res));
    } catch (err) {
      console.warn(`[ManyChat] Error setting ${fieldName}:`, err);
    }
    await sleep(250);
  }

  // Set combined datetime field for ManyChat triggers
  if (leadData.data_reuniao && leadData.horario_reuniao) {
    const isoDatetime = buildIsoDatetime(leadData.data_reuniao, leadData.horario_reuniao);
    if (isoDatetime) {
      const dtFieldId = fieldIdCache["horário da reunião datetime"];
      if (dtFieldId) {
        console.log(`[ManyChat] Setting Horário da Reunião Datetime (id=${dtFieldId}) = ${isoDatetime}`);
        try {
          const res = await mcPost("subscriber/setCustomField", {
            subscriber_id: subscriberId,
            field_id: dtFieldId,
            field_value: isoDatetime,
          }, apiToken);
          console.log(`[ManyChat] setCustomField Datetime result:`, JSON.stringify(res));
        } catch (err) {
          console.warn(`[ManyChat] Error setting Horário da Reunião Datetime:`, err);
        }
      } else {
        console.warn(`[ManyChat] Field "Horário da Reunião Datetime" not found. Available: ${Object.keys(fieldIdCache).join(", ")}`);
      }
    }
  }

  console.log("[ManyChat] All fields set for subscriber:", subscriberId);
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
  try { return JSON.parse(text); } catch { console.warn("[ManyChat] Non-JSON response:", text.substring(0, 200)); return { status: "error", message: "Non-JSON response" }; }
}

async function mcGet(endpoint: string, apiToken: string) {
  const res = await fetch(`${MANYCHAT_API}/${endpoint}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { console.warn("[ManyChat] Non-JSON response:", text.substring(0, 200)); return { status: "error", message: "Non-JSON response" }; }
}

async function getTagId(tagName: string, apiToken: string): Promise<number | null> {
  const data = await mcGet("page/getTags", apiToken);
  if (!data?.data) {
    console.error("[ManyChat] Failed to fetch tags:", JSON.stringify(data));
    return null;
  }
  console.log("[ManyChat] Available tags:", data.data.map((t: { name: string }) => t.name).join(", "));
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const tag = data.data.find(
    (t: { name: string; id: number }) => normalize(t.name) === normalize(tagName)
  );
  if (!tag) {
    console.error(`[ManyChat] Tag "${tagName}" not found in available tags.`);
    return null;
  }
  return tag.id;
}

function extractSubscriberId(data: Record<string, unknown>): string | null {
  if (!data?.data) return null;
  const d = data.data as Record<string, unknown>;
  if (Array.isArray(d) && d.length > 0) return String((d[0] as Record<string, unknown>).id);
  if (d.id) return String(d.id);
  return null;
}

/**
 * Find or create subscriber. When isPrimary=true, saves subscriber_id to DB and uses DB cache.
 * For secondary tokens, skip DB operations since each ManyChat account has different IDs.
 */
async function findOrCreateSubscriber(
  phone: string,
  leadData: LeadFields | undefined,
  apiToken: string,
  isPrimary = true
): Promise<string | null> {
  const normalizedPhone = normalizePhone(phone);
  const email = leadData?.email;
  const label = isPrimary ? "[ManyChat]" : "[ManyChat-2]";

  // Step 0: Check DB cache (only for primary token)
  if (isPrimary) {
    const cachedId = await getSubscriberIdFromDb(phone);
    if (cachedId) {
      console.log(`${label} Step 0: Found cached subscriber_id in DB: ${cachedId} for ${phone}`);
      return cachedId;
    }
  }

  // Step 1: Try findBySystemField
  // For secondary (WhatsApp-only) accounts, search by phone instead of email
  if (!isPrimary) {
    // Try phone system field first (with + prefix)
    const phoneWithPlus = "+" + normalizedPhone;
    console.log(`${label} Step 1: findBySystemField phone=${phoneWithPlus}`);
    const phoneData = await mcGet(
      `subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(phoneWithPlus)}`,
      apiToken
    );
    console.log(`${label} Step 1 result:`, JSON.stringify(phoneData).substring(0, 300));
    const subId = extractSubscriberId(phoneData);
    if (subId) {
      console.log(`${label} Found by phone: ${phoneWithPlus} → ${subId}`);
      return subId;
    }
    // Also try email system field
    if (email) {
      console.log(`${label} Step 1b: findBySystemField email=${email}`);
      const emailData = await mcGet(
        `subscriber/findBySystemField?field_name=email&field_value=${encodeURIComponent(email)}`,
        apiToken
      );
      console.log(`${label} Step 1b result:`, JSON.stringify(emailData).substring(0, 300));
      const emailSubId = extractSubscriberId(emailData);
      if (emailSubId) {
        console.log(`${label} Found by email: ${email} → ${emailSubId}`);
        return emailSubId;
      }
    }
  } else if (email) {
    console.log(`${label} Step 1: findBySystemField email=${email}`);
    const emailData = await mcGet(
      `subscriber/findBySystemField?field_name=email&field_value=${encodeURIComponent(email)}`,
      apiToken
    );
    console.log(`${label} Step 1 result:`, JSON.stringify(emailData).substring(0, 300));
    const subId = extractSubscriberId(emailData);
    if (subId) {
      console.log(`${label} Found by email: ${email} → ${subId}`);
      if (isPrimary) await saveSubscriberId(phone, subId);
      return subId;
    }
  }

  // Step 2: Try findByCustomField with dynamic field_id for Email
  if (email) {
    console.log(`${label} Step 2: findByCustomField Email=${email} (with field_id)`);
    const emailFieldId = await getCustomFieldId("Email", apiToken);
    if (emailFieldId) {
      const customEmailData = await mcGet(
        `subscriber/findByCustomField?field_id=${emailFieldId}&field_value=${encodeURIComponent(email)}`,
        apiToken
      );
      console.log(`${label} Step 2 result:`, JSON.stringify(customEmailData).substring(0, 300));
      const customSub = extractSubscriberId(customEmailData);
      if (customSub) {
        console.log(`${label} Found by custom Email field: ${email} → ${customSub}`);
        if (isPrimary) await saveSubscriberId(phone, customSub);
        return customSub;
      }
    }
  }

  // Step 3: Try to create subscriber via whatsapp_phone
  console.log(`${label} Step 3: createSubscriber for ${normalizedPhone}`);
  const createPayload: Record<string, unknown> = {
    whatsapp_phone: normalizedPhone,
    consent_phrase: "Lead from Orbit website",
    has_opt_in_email: false,
    has_opt_in_sms: false,
  };
  if (leadData?.nome) createPayload.first_name = leadData.nome;
  if (leadData?.sobrenome) createPayload.last_name = leadData.sobrenome;

  const createData = await mcPost("subscriber/createSubscriber", createPayload, apiToken);
  console.log(`${label} Step 3 result:`, JSON.stringify(createData).substring(0, 400));

  if (createData?.data?.id) {
    const subId = String(createData.data.id);
    console.log(`${label} Created new subscriber: ${subId}`);
    if (isPrimary) await saveSubscriberId(phone, subId);
    return subId;
  }

  // Step 3b: If wa_id permission denied, try creating via email (for secondary accounts)
  const createErrStr = JSON.stringify(createData);
  if (createErrStr.includes("Permission denied to import wa_id") && email) {
    console.log(`${label} Step 3b: wa_id denied, trying createSubscriber via email=${email}`);
    const emailCreatePayload: Record<string, unknown> = {
      email: email,
      has_opt_in_email: true,
      has_opt_in_sms: false,
      consent_phrase: "Lead from Orbit website",
    };
    if (leadData?.nome) emailCreatePayload.first_name = leadData.nome;
    if (leadData?.sobrenome) emailCreatePayload.last_name = leadData.sobrenome;

    const emailCreateData = await mcPost("subscriber/createSubscriber", emailCreatePayload, apiToken);
    console.log(`${label} Step 3b result:`, JSON.stringify(emailCreateData).substring(0, 400));

    if (emailCreateData?.data?.id) {
      const subId = String(emailCreateData.data.id);
      console.log(`${label} Created subscriber via email: ${subId}`);
      // Set phone as custom field since we couldn't use whatsapp_phone
      const phoneFieldId = await getCustomFieldId("Phone", apiToken);
      if (phoneFieldId) {
        await mcPost("subscriber/setCustomField", {
          subscriber_id: subId,
          field_id: phoneFieldId,
          field_value: normalizedPhone,
        }, apiToken);
        console.log(`${label} Set phone custom field for ${subId}`);
      }
      return subId;
    }

    // If email creation also says "already exists", fall through to Step 4
    const emailErrStr = JSON.stringify(emailCreateData);
    console.log(`${label} Step 3b: email creation also failed:`, emailErrStr.substring(0, 300));
  }

  // Step 4: "already exists" — extract wa_id, try findByCustomField with other fields
  const errStr = JSON.stringify(createData);
  const waIdMatch = errStr.match(/already exists: (\d+)/);
  if (waIdMatch) {
    const waId = waIdMatch[1];
    console.log(`${label} Step 4: "already exists" with wa_id=${waId}`);

    // 4a: Try findByCustomField with Empresa
    if (email) {
      const empresaFieldId = await getCustomFieldId("Empresa", apiToken);
      if (empresaFieldId && leadData?.empresa) {
        console.log(`${label} Step 4a: findByCustomField Empresa=${leadData.empresa}`);
        const empresaData = await mcGet(
          `subscriber/findByCustomField?field_id=${empresaFieldId}&field_value=${encodeURIComponent(leadData.empresa)}`,
          apiToken
        );
        console.log(`${label} Step 4a result:`, JSON.stringify(empresaData).substring(0, 300));
        const empSub = extractSubscriberId(empresaData);
        if (empSub) {
          console.log(`${label} Found by Empresa: ${leadData.empresa} → ${empSub}`);
          if (isPrimary) await saveSubscriberId(phone, empSub);
          return empSub;
        }
      }
    }

    // 4b: Try findBySystemField phone with the wa_id
    if (waId !== normalizedPhone) {
      console.log(`${label} Step 4b: findBySystemField phone=+${waId}`);
      const waPhoneData = await mcGet(
        `subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent("+" + waId)}`,
        apiToken
      );
      console.log(`${label} Step 4b result:`, JSON.stringify(waPhoneData).substring(0, 300));
      const waPhoneSub = extractSubscriberId(waPhoneData);
      if (waPhoneSub) {
        console.log(`${label} Found via wa_id phone lookup: ${waPhoneSub}`);
        if (isPrimary) await saveSubscriberId(phone, waPhoneSub);
        return waPhoneSub;
      }
    }

    // 4c: For secondary accounts, try getInfo with the wa_id directly
    if (!isPrimary) {
      console.log(`${label} Step 4c: trying subscriber/getInfo with id=${waId}`);
      const infoData = await mcPost("subscriber/getInfo", { subscriber_id: waId }, apiToken);
      if (infoData?.data?.id) {
        const subId = String(infoData.data.id);
        console.log(`${label} Found via getInfo: ${subId}`);
        return subId;
      }
    }
  }

  console.error(`${label} FAILED: Could not find/create subscriber:`, phone, email);
  return null;
}

async function applyTag(subscriberId: string, tagId: number, apiToken: string): Promise<boolean> {
  const data = await mcPost("subscriber/addTag", {
    subscriber_id: subscriberId,
    tag_id: tagId,
  }, apiToken);
  console.log("[ManyChat] addTag:", JSON.stringify(data));
  return data?.status === "success";
}

function buildLeadData(lead: Record<string, unknown>): LeadFields {
  return {
    nome: lead.nome as string,
    sobrenome: lead.sobrenome as string,
    email: lead.email as string,
    empresa: lead.empresa as string,
    oque_faz: lead.oque_faz as string,
    cargo: lead.cargo as string,
    faturamento: lead.faturamento as string,
    funcionarios: lead.funcionarios as string,
    prioridade: lead.prioridade as string,
    data_reuniao: lead.data_reuniao as string,
    horario_reuniao: lead.horario_reuniao as string,
    software_gestao: lead.software_gestao as string,
    utm_source: lead.utm_source as string,
    utm_medium: lead.utm_medium as string,
    utm_campaign: lead.utm_campaign as string,
    status_reuniao: lead.status_reuniao as string,
  };
}

// ==========================================
// DUAL-TOKEN: Run action for a single token
// ==========================================

async function runTagAction(
  body: TagRequest,
  apiToken: string,
  isPrimary: boolean
): Promise<{ success: boolean; subscriber_id?: string; tags_removed?: string[] }> {
  const label = isPrimary ? "[MC1]" : "[MC2]";

  if (!body.whatsapp || !body.tag_name) {
    return { success: false };
  }

  const tagId = await getTagId(body.tag_name, apiToken);
  if (!tagId) return { success: false };

  const subscriberId = await findOrCreateSubscriber(body.whatsapp, body.lead_data, apiToken, isPrimary);
  if (!subscriberId) return { success: false };

  const CONFLICTING_TAGS: Record<string, string[]> = {
    "agendou-reuniao": ["nao-respondeu-chat-demonstracao", "nao-entrou-na-reuniao", "recusou-participacao"],
    "nao-entrou-na-reuniao": ["agendou-reuniao", "participou-reuniao", "nao-respondeu-chat-demonstracao"],
    "participou-reuniao": ["agendou-reuniao", "nao-entrou-na-reuniao", "nao-respondeu-chat-demonstracao"],
    "negociacoes-iniciadas": ["nao-respondeu-chat-demonstracao"],
    "propostas": ["nao-respondeu-chat-demonstracao"],
    "testando-pre-analise": ["nao-respondeu-chat-demonstracao"],
    "confirmou-participacao": ["nao-respondeu-chat-demonstracao"],
  };
  const tagsToRemove = CONFLICTING_TAGS[body.tag_name] || [];
  for (const conflictTag of tagsToRemove) {
    const conflictTagId = await getTagId(conflictTag, apiToken);
    if (conflictTagId) {
      const removeResult = await mcPost("subscriber/removeTag", {
        subscriber_id: subscriberId,
        tag_id: conflictTagId,
      }, apiToken);
      console.log(`${label} Removed conflicting tag "${conflictTag}":`, JSON.stringify(removeResult));
    }
  }

  if (body.lead_data) {
    await setAllCustomFields(subscriberId, body.lead_data, apiToken, body.whatsapp);
  }
  const success = await applyTag(subscriberId, tagId, apiToken);
  console.log(`${label} Tag "${body.tag_name}" applied: ${success}`);

  return { success, subscriber_id: subscriberId, tags_removed: tagsToRemove };
}

async function runBatchTagExisting(
  body: TagRequest,
  apiToken: string,
  isPrimary: boolean
): Promise<{ tagged: number; failed: number; errors: string[]; batch_size: number; offset: number; next_offset: number }> {
  const label = isPrimary ? "[MC1-Batch]" : "[MC2-Batch]";
  const supabase = getSupabase();
  const batchLimit = body.limit || 20;
  const batchOffset = body.offset || 0;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .range(batchOffset, batchOffset + batchLimit - 1);

  if (error) {
    return { tagged: 0, failed: 0, errors: [String(error)], batch_size: 0, offset: batchOffset, next_offset: batchOffset };
  }

  const tagNames = [
    "agendou-reuniao",
    "nao-respondeu-chat-demonstracao",
    "confirmou-participacao",
    "nao-entrou-na-reuniao",
    "participou-reuniao",
  ];
  const tagIds: Record<string, number | null> = {};
  for (const name of tagNames) {
    tagIds[name] = await getTagId(name, apiToken);
    console.log(`${label} Tag "${name}" → ID: ${tagIds[name]}`);
  }

  let tagged = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of leads || []) {
    console.log(`${label} ${lead.nome} | ${lead.whatsapp} | ${lead.email} | status=${lead.status}`);

    const leadData = buildLeadData(lead);
    const subscriberId = await findOrCreateSubscriber(lead.whatsapp, leadData, apiToken, isPrimary);
    if (!subscriberId) {
      failed++;
      errors.push(`Not found: ${lead.whatsapp} / ${lead.email}`);
      await sleep(300);
      continue;
    }

    const tagsToApply: string[] = [];
    if (lead.status === "completo") {
      tagsToApply.push("agendou-reuniao");
    } else {
      tagsToApply.push("nao-respondeu-chat-demonstracao");
    }
    if (lead.confirmou_participacao) {
      tagsToApply.push("confirmou-participacao");
    }
    if (lead.status_reuniao === "nao_entrou") {
      tagsToApply.push("nao-entrou-na-reuniao");
    }
    if (lead.status_reuniao === "participou") {
      tagsToApply.push("participou-reuniao");
    }

    await setAllCustomFields(subscriberId, leadData, apiToken, lead.whatsapp);

    let allSuccess = true;
    for (const tagName of tagsToApply) {
      const tid = tagIds[tagName];
      if (!tid) continue;
      const ok = await applyTag(subscriberId, tid, apiToken);
      if (!ok) {
        allSuccess = false;
        errors.push(`Tag "${tagName}" failed: ${lead.whatsapp}`);
      }
    }

    if (allSuccess) tagged++; else failed++;
    await sleep(300);
  }

  return {
    tagged,
    failed,
    errors: errors.slice(0, 20),
    batch_size: leads?.length || 0,
    offset: batchOffset,
    next_offset: batchOffset + (leads?.length || 0),
  };
}

async function runSyncFromPipedrive(
  body: TagRequest,
  apiToken: string,
  isPrimary: boolean
): Promise<{ synced: number; failed: number; errors: string[]; results: { nome: string; stage: string; tag: string }[]; batch_size: number; offset: number; next_offset: number }> {
  const label = isPrimary ? "[MC1-Sync]" : "[MC2-Sync]";
  const pipedriveToken = Deno.env.get("PIPEDRIVE_API_TOKEN");
  if (!pipedriveToken) {
    return { synced: 0, failed: 0, errors: ["PIPEDRIVE_API_TOKEN not configured"], results: [], batch_size: 0, offset: 0, next_offset: 0 };
  }

  const supabase = getSupabase();
  const batchLimit = body.limit || 20;
  const batchOffset = body.offset || 0;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .not("pipedrive_deal_id", "is", null)
    .order("created_at", { ascending: false })
    .range(batchOffset, batchOffset + batchLimit - 1);

  if (error) {
    return { synced: 0, failed: 0, errors: [String(error)], results: [], batch_size: 0, offset: batchOffset, next_offset: batchOffset };
  }

  const STAGE_TAG_MAP: Record<string, string> = {
    "reuniao agendada": "agendou-reuniao",
    "nao entrou na reuniao": "nao-entrou-na-reuniao",
    "participou reuniao grupo": "participou-reuniao",
    "negociacoes iniciadas": "negociacoes-iniciadas",
    "propostas": "propostas",
    "testando pre analise": "testando-pre-analise",
  };

  const normalizeStage = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const stageCache: Record<number, string | null> = {};
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];
  const results: { nome: string; stage: string; tag: string }[] = [];

  for (const lead of leads || []) {
    try {
      const dealId = lead.pipedrive_deal_id;
      console.log(`${label} Processing ${lead.nome} | deal=${dealId}`);

      const dealRes = await fetch(
        `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${pipedriveToken}`
      );
      const dealData = await dealRes.json();
      const stageId = dealData?.data?.stage_id;

      if (!stageId) {
        failed++;
        errors.push(`No stage: ${lead.nome} (deal ${dealId})`);
        await sleep(300);
        continue;
      }

      if (!(stageId in stageCache)) {
        const stageRes = await fetch(
          `https://api.pipedrive.com/v1/stages/${stageId}?api_token=${pipedriveToken}`
        );
        const stageData = await stageRes.json();
        stageCache[stageId] = stageData?.data?.name || null;
      }

      const stageName = stageCache[stageId];
      if (!stageName) {
        failed++;
        errors.push(`Stage name not found: ${lead.nome} (stage ${stageId})`);
        await sleep(300);
        continue;
      }

      const normalized = normalizeStage(stageName);
      const tagName = STAGE_TAG_MAP[normalized];

      if (!tagName) {
        console.log(`${label} Stage "${stageName}" not mapped, skipping ${lead.nome}`);
        await sleep(200);
        continue;
      }

      const leadData = buildLeadData(lead);
      const subscriberId = await findOrCreateSubscriber(lead.whatsapp, leadData, apiToken, isPrimary);
      if (!subscriberId) {
        failed++;
        errors.push(`Subscriber not found: ${lead.nome} (${lead.whatsapp})`);
        await sleep(300);
        continue;
      }

      const tagId = await getTagId(tagName, apiToken);
      if (!tagId) {
        failed++;
        errors.push(`Tag "${tagName}" not found in ManyChat`);
        await sleep(300);
        continue;
      }

      const ok = await applyTag(subscriberId, tagId, apiToken);
      await setAllCustomFields(subscriberId, leadData, apiToken, lead.whatsapp);

      if (ok) {
        synced++;
        results.push({ nome: lead.nome, stage: stageName, tag: tagName });
      } else {
        failed++;
        errors.push(`Tag failed: ${lead.nome} → ${tagName}`);
      }

      await sleep(300);
    } catch (err) {
      failed++;
      errors.push(`Error: ${lead.nome} → ${String(err)}`);
    }
  }

  return {
    synced,
    failed,
    errors: errors.slice(0, 20),
    results: results.slice(0, 50),
    batch_size: leads?.length || 0,
    offset: batchOffset,
    next_offset: batchOffset + (leads?.length || 0),
  };
}

// ==========================================
// Parallel wrapper for secondary token (MUST be awaited)
// ==========================================
async function runForSecondaryToken(
  action: string,
  body: TagRequest,
  apiToken2: string
): Promise<void> {
  try {
    console.log("[MC2] Starting mirror for action:", action);
    if (action === "tag") {
      await runTagAction(body, apiToken2, false);
    } else if (action === "batch-tag-existing") {
      await runBatchTagExisting(body, apiToken2, false);
    } else if (action === "sync-from-pipedrive") {
      await runSyncFromPipedrive(body, apiToken2, false);
    }
    console.log("[MC2] Mirror completed for action:", action);
  } catch (err) {
    console.error("[MC2] Mirror FAILED for action:", action, err);
  }
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiToken = Deno.env.get("MANYCHAT_API_TOKEN");
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "MANYCHAT_API_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiToken2 = Deno.env.get("MANYCHAT_API_TOKEN_2");
    if (!apiToken2) {
      console.warn("[ManyChat] MANYCHAT_API_TOKEN_2 not configured — skipping secondary account");
    }

    const body: TagRequest = await req.json();

    // ---- ACTION: sync-from-pipedrive ----
    if (body.action === "sync-from-pipedrive") {
      const pipedriveToken = Deno.env.get("PIPEDRIVE_API_TOKEN");
      if (!pipedriveToken) {
        return new Response(JSON.stringify({ error: "PIPEDRIVE_API_TOKEN not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [result] = await Promise.all([
        runSyncFromPipedrive(body, apiToken, true),
        apiToken2 ? runForSecondaryToken("sync-from-pipedrive", body, apiToken2) : Promise.resolve(),
      ]);
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- ACTION: batch-tag-existing ----
    if (body.action === "batch-tag-existing") {
      const [result] = await Promise.all([
        runBatchTagExisting(body, apiToken, true),
        apiToken2 ? runForSecondaryToken("batch-tag-existing", body, apiToken2) : Promise.resolve(),
      ]);
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- ACTION: tag ----
    if (body.action === "tag") {
      if (!body.whatsapp || !body.tag_name) {
        return new Response(JSON.stringify({ error: "whatsapp and tag_name required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [result] = await Promise.all([
        runTagAction(body, apiToken, true),
        apiToken2 ? runForSecondaryToken("tag", body, apiToken2) : Promise.resolve(),
      ]);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- ACTION: list-tags ----
    if (body.action === "list-tags") {
      const data = await mcGet("page/getTags", apiToken);
      return new Response(
        JSON.stringify({ tags: data?.data || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[tag-manychat] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
