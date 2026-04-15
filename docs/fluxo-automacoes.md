# Fluxo Completo: Form → Automações

> Mapeamento exaustivo do que acontece quando um usuário preenche um formulário neste projeto — desde o submit até Pipedrive, ManyChat, emails, webhooks externos e integrações.
>
> Última atualização: 2026-04-14

---

## 📍 Existem 2 entradas de form

| Entrada | Arquivo | Rota |
|---|---|---|
| **A) Landing Pages** (Advocacia, Clínicas, Consultoria, Contador, Agência, Engenharia, Imobiliária, Ecommerce, Educação, Franquias, LandingPage) | `src/pages/Advocacia.tsx` (idêntico às outras) | `/advocacia`, `/clinicas`, etc. |
| **B) Chat AI** (progressivo, com Olivia IA) | `src/pages/Chat2.tsx` | `/chat2-ab` |

---

## 🅰️ ENTRADA A — Landing Page (ex: Advocacia)

### 1️⃣ No submit do form (client-side)

```
├─ valida email
├─ parseia UTMs da URL (utm_*, gclid, fbclid, ttclid, etc.)
├─ busca lead existente por email OR whatsapp
├─ Supabase: INSERT/UPDATE tabela "leads" (status: "parcial")
├─ GTM: pushFormSubmitSuccess() → dispara form_submit_success
├─ navega pra /chat
└─ em paralelo, dispara 2 edge functions:
```

### 2️⃣ Edge Functions acionadas

**🔹 `sync-lead-crm`** (fire-and-forget)
- POST → `https://cvanwvoddchatcdstwry.supabase.co/functions/v1/crm-webform-submit`
- Form ID: `b84131b3-feff-4766-bff6-7d8c6d3dd2c8`
- Dados: nome, email, telefone, empresa

**🔹 `create-pipedrive-lead` (action: "create")** — a principal
1. Cria **Organization** no Pipedrive (`empresa` ou "Não informado")
2. Cria **Person** (nome, email, phone) + custom fields `Cargo` + `Ramo de Atividade`
3. Encontra/cria pipeline "Orbit", pega primeira stage
4. Cria **Deal** com título `"{nome} - {empresa} | Orbit"`, popula custom fields UTM (Source, Medium, Campaign, GCLID, FBCLID, Landing Page, Origin Page)
5. Adiciona **Note** com emoji: `📋 Lead parcial capturado | 👤 Nome | 📱 WhatsApp | 📧 E-mail | 🏢 Empresa | 💼 Segmento | 🎯 Cargo`
6. Adiciona **Label de nicho** (cor azul): `ADVOCACIA`, `AGÊNCIA`, `CONTABILIDADE`, `CLÍNICAS`, `IMOBILIÁRIA`, `ENGENHARIA`, `FRANQUIAS`, `E-COMMERCE` ou `EDUCAÇÃO`
7. Atualiza lead no Supabase com `pipedrive_person_id`, `pipedrive_org_id`, `pipedrive_deal_id`
8. Chama `tag-manychat` → tag **`nao-respondeu-chat-demonstracao`** (se lead ainda não está "completo")

**🔹 `create-pipedrive-lead` (action: "add_label")** — logo depois
- Adiciona label **`CHAT1`** (azul) no deal

### 3️⃣ Dentro de `tag-manychat`
- Busca/cria Subscriber no ManyChat (WhatsApp como chave)
- Sincroniza custom fields: Empresa, Segmento, Cargo, Faturamento, UTMs, etc.
- Aplica tag `nao-respondeu-chat-demonstracao`
- Remove tags conflitantes (agendou-reuniao, participou-reuniao, etc.)

---

## 🅱️ ENTRADA B — Chat2 (Olivia IA)

Fluxo **progressivo**: Olivia conversa e coleta dados aos poucos.

### 1️⃣ Quando completa nome+whatsapp+email (form inline)

```
├─ pushFormSubmitSuccess() → GTM
├─ Supabase: INSERT/UPDATE leads (status: "parcial")
└─ dispara 3 edge functions em paralelo:
```

**🔹 `sync-lead-make`**
- POST sempre → `https://plataforma-email.vercel.app/api/leads-lovable/ingest` (header `x-api-key`)
- POST extra → `https://hook.us1.make.com/mo56te9czy4s7h10gumjbmke05dqohn5` (**só se tiver `fbclid`**)

**🔹 `sync-lead-crm`** — mesmo do LP

**🔹 `notify-new-lead`** — envia email (via Resend) pra `roberta.soares@evolutto.com` com todos os dados

### 2️⃣ Quando qualificação completa (segmento + cargo + faturamento + funcionários + prioridade)

**🔹 `create-pipedrive-lead` (action: "create")** — igual ao LP, mas:
- Label: **`CHAT2`** (azul) em vez de CHAT1
- Se for consultor/agência → label `CANAL ORBIT`; senão `ORBIT B2B`

### 3️⃣ Lógica de desqualificação (só Chat2)
Se `faturamento ≤ 30k` (consultor) OU `faturamento ≤ 100k + funcionarios 1-5` (B2B):
- Label **`DESQUALIFICADO ORBIT`** (vermelho)
- `assign-pipedrive-owner` com `flow: "gabriel_direto"` → atribui Gabriel Carvente direto
- **Não** entra na roleta

---

## 📅 APÓS O FORM — Ambos fluxos convergem

### 🗓️ Usuário escolhe data/hora no calendário

```
1. add_label "EM GRUPO" (azul) no deal
2. create-pipedrive-lead (action: "update"):
   ├─ atualiza custom fields: faturamento, funcionários, prioridade, data_reunião
   ├─ move deal pra stage "Reunião Agendada"
   └─ cria Activity "Reunião Online" no Pipedrive (type: call, due_date, due_time)
3. trigger-n8n-call → POST https://webhook.rodriguinhodomarketing.com.br/webhook/salva-supabase
   (payload: nome, telefone +55, call_datetime ISO, deal_id)
4. sync-lead-make → reenvia pro Plataforma (+ Make se fbclid)
5. send-calendar-invite:
   ├─ monta ICS (iCalendar) com alarmes -30min e -10min
   ├─ gera HTML bonito com logo Orbit + link Google Meet
   ├─ envia via Resend (from: demonstracao@orbitgestao.com.br)
   └─ loga em email_logs (tipo: "convite_agendamento")
6. tag-manychat: tag "agendou-reuniao" + sync custom fields (data, hora, link)
7. assign-pipedrive-owner (flow: "sala"):
   └─ round-robin: Gisele Rocha → Pedro Maia → Thayane Duarte
```

### 👤 Usuário clica "Falar com executivo"

```
1. update leads: deseja_contato_vendedor = true
2. add_label "DIRETO EXECUTIVO" (verde)
3. assign-pipedrive-owner (flow: "vendedor") → round-robin
4. matchExecutive() mapeia nome do owner → Gabriel/Gisele/Pedro/Thayane + WhatsApp
5. tag-manychat: tag "deseja-contato-vendedor"
6. sync-lead-make
7. mostra tela com botão WhatsApp do executivo
```

---

## 🏷️ Todas as Labels do Pipedrive

| Label | Cor | Quando |
|---|---|---|
| Nicho (ADVOCACIA, CLÍNICAS, etc.) | azul | LP form submit |
| `CANAL ORBIT` | default | Chat2 — consultor |
| `ORBIT B2B` | default | Chat2 — empresa tradicional |
| `CHAT1` | azul | LP form submit |
| `CHAT2` | azul | Chat2 qualificação completa |
| `EM GRUPO` | azul | Escolheu horário |
| `DIRETO EXECUTIVO` | verde | Clicou falar com exec |
| `DESQUALIFICADO ORBIT` | vermelho | Desqualificação no Chat2 |

## 🏷️ Todas as Tags do ManyChat

| Tag | Quando |
|---|---|
| `nao-respondeu-chat-demonstracao` | Lead criou mas não completou |
| `agendou-reuniao` | Escolheu horário |
| `deseja-contato-vendedor` | Clicou falar com exec |
| `participou-reuniao` | Compareceu (manual/webhook) |
| `nao-entrou-na-reuniao` | No-show |
| `confirmou-participacao` | Confirmou via link |
| `negociacoes-iniciadas`, `propostas`, `testando-pre-analise` | Estágios comerciais (webhook Pipedrive) |

---

## 🔌 Todos os serviços externos

| Serviço | URL / Endpoint | Autenticação |
|---|---|---|
| **Pipedrive** | `api.pipedrive.com/v1` e `/api/v2` | `PIPEDRIVE_API_TOKEN` (secret) |
| **ManyChat** | `api.manychat.com/fb` | `MANYCHAT_API_TOKEN` + `MANYCHAT_API_TOKEN_2` |
| **Resend** (emails) | `api.resend.com/emails` | `RESEND_API_KEY` |
| **Lovable AI** (Olivia) | API do Lovable | `LOVABLE_API_KEY` |
| **ElevenLabs** (TTS) | voice API | `ELEVENLABS_API_KEY` |
| **N8N** (confirmação ligação) | `webhook.rodriguinhodomarketing.com.br/webhook/salva-supabase` | URL apenas |
| **Make.com** | `hook.us1.make.com/mo56te9czy4s7h10gumjbmke05dqohn5` | URL apenas |
| **Plataforma** | `plataforma-email.vercel.app/api/leads-lovable/ingest` | header `x-api-key` hardcoded |
| **CRM externo** | `cvanwvoddchatcdstwry.supabase.co/functions/v1/crm-webform-submit` | form_id hardcoded |

---

## 🗄️ Tabelas Supabase relevantes

### `leads`
Colunas principais: `id`, `nome`, `sobrenome`, `whatsapp`, `email`, `empresa`, `cargo`, `oque_faz`, `status` (parcial/completo), `copy_variant`, `origin_page`, `landing_page`, `pipedrive_person_id`, `pipedrive_org_id`, `pipedrive_deal_id`, `manychat_subscriber_id`, `faturamento`, `funcionarios`, `prioridade`, `data_reuniao`, `horario_reuniao`, `link_reuniao`, `software_gestao`, `status_reuniao`, `confirmou_participacao`, `deseja_contato_vendedor`, `validacao_confirmada`, UTMs (`utm_source`, `utm_medium`, ..., `gclid`, `fbclid`, etc.), `created_at`, `updated_at`.

### `email_logs`
`id`, `email_type` (`convite_agendamento`, `lembrete_reuniao`, `ligacao_confirmacao`), `recipient_email`, `recipient_name`, `resend_id`, `success`, `error_message`, `created_at`.

### `roleta_counter`
`id`=1, `current_index` (0–2) — controla round-robin entre Gisele/Pedro/Thayane.

### `app_settings`
Toggles globais (ex: `ab_testing_enabled`).

---

## 🔁 Ciclo de status do lead

```
(novo)
  ↓ INSERT com status = "parcial"
parcial
  ↓ calendário ou exec → UPDATE
completo
  ↓ webhooks Pipedrive atualizam
[participou-reuniao / nao-entrou / etc.]
```

---

## 📊 Tabela-resumo: Triggers → Automações

| Trigger | Supabase Write | Pipedrive | ManyChat | Externo |
|---|---|---|---|---|
| **LP Form Submit** | INSERT/UPDATE `leads` | CREATE Person+Org+Deal, label `CHAT1` + label de nicho | tag `nao-respondeu-chat-demonstracao` | `sync-lead-crm` → webform externo |
| **Chat2 Form Submit (nome+email+whatsapp)** | INSERT/UPDATE `leads` | — | — | `sync-lead-make` (Plataforma + Make se fbclid), `notify-new-lead` (Resend) |
| **Chat2 Qualificação Completa** | — | CREATE Person+Org+Deal, label `CHAT2` + `CANAL ORBIT` ou `ORBIT B2B` | tag `nao-respondeu-chat-demonstracao` | — |
| **Desqualificado (Chat2)** | — | label `DESQUALIFICADO ORBIT` (vermelho), atribui Gabriel | — | — |
| **Calendário selecionado** | UPDATE `leads` (data/hora/link) | label `EM GRUPO`, move pra "Reunião Agendada", cria Activity | remove `nao-respondeu`, adiciona `agendou-reuniao`, sincroniza campos | `trigger-n8n-call`, `send-calendar-invite` (Resend + ICS) |
| **Clicou falar com executivo** | UPDATE `leads` (`deseja_contato_vendedor=true`) | label `DIRETO EXECUTIVO` (verde), atribui vendedor | tag `deseja-contato-vendedor` | `sync-lead-make` |

---

## ⚠️ Observações importantes

### Dedupe por email/whatsapp
Tanto as LPs quanto o Chat2 buscam antes de inserir:
```sql
.or(`email.eq.${email},whatsapp.ilike.%${phoneDigits}%`)
.order('created_at', { ascending: false })
.limit(1)
```
Se o mesmo lead preencher em 2 sites diferentes, **atualiza o mesmo deal** no Pipedrive (não duplica).

### GTM dispara 1x por sessão
`pushFormSubmitSuccess` tem guarda em `sessionStorage` (`apex_form_submit_fired`). Se o usuário preencher em LP e depois em Chat2 na mesma sessão, **dispara 1 vez só**.

### Edge Functions toleram secret ausente
Se algum secret (`PIPEDRIVE_API_TOKEN`, `MANYCHAT_API_TOKEN`, etc.) não estiver configurado, a function retorna early com erro no log — o lead **ainda vai pro Supabase**, mas não propaga pras integrações externas.

### Fluxo de webhooks reversos
- **Pipedrive → Supabase** (`pipedrive-webhook`): quando stage muda no Pipedrive, atualiza tags no ManyChat (ex: deal vai pra "Negociação" → tag `negociacoes-iniciadas`)
- **ManyChat → Supabase** (`manychat-webhook`): recebe eventos do bot (confirmação, reagendamento, no-show) e atualiza lead + Pipedrive

---

## 📁 Arquivos-chave

**Frontend:**
- `src/pages/Advocacia.tsx` (e 10 LPs idênticas) — entrada A
- `src/pages/Chat2.tsx` — entrada B
- `src/pages/Chat.tsx` / `Index.tsx` — continuação pós-LP (calendário)
- `src/lib/dataLayer.ts` — GTM / conversão

**Edge Functions (Supabase):**
- `supabase/functions/create-pipedrive-lead/` — orquestrador principal (1500+ linhas)
- `supabase/functions/tag-manychat/` — gerencia subscribers, tags e campos ManyChat
- `supabase/functions/assign-pipedrive-owner/` — round-robin de vendedores
- `supabase/functions/send-calendar-invite/` — email com ICS
- `supabase/functions/trigger-n8n-call/` — webhook confirmação ligação
- `supabase/functions/sync-lead-make/` — Plataforma + Make
- `supabase/functions/sync-lead-crm/` — CRM externo
- `supabase/functions/notify-new-lead/` — email de notificação interna
- `supabase/functions/manychat-webhook/` — recebe eventos do bot
- `supabase/functions/pipedrive-webhook/` — recebe eventos do CRM

---

## ✅ Validando um fork

Quando este código for clonado e apontar pro mesmo Supabase (`nmeuxanxjnhpdcfkdrdc`), ele dispara **exatamente as mesmas automações** — porque as edge functions + secrets + DB estão na nuvem do Supabase. O frontend é só o "gatilho".

Pra testar sem conflitar com produção:
- Use email/telefone novo a cada teste (evita dedupe atualizar deal existente)
- Acompanhe os logs em: **Supabase Dashboard → Edge Functions → (function) → Logs**
- Verifique Pipedrive e ManyChat lado a lado
