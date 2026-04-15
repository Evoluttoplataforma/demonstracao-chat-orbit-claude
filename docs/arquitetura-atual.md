# Arquitetura Atual — demochat.orbitgestao.com.br

> Documento vivo. Descreve como o fork está configurado hoje, o que é compartilhado com o Lovable, e como reverter decisões tomadas.
>
> Última atualização: 2026-04-15

---

## 🗺️ Visão geral em 1 diagrama

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│   SITE DO LOVABLE           │      │   SEU FORK (este repo)       │
│   demontracao.orbitgestao…  │      │   demochat.orbitgestao…      │
│                             │      │                              │
│   Frontend React + Vite     │      │   Frontend React + Vite      │
│   Hospedado no Lovable      │      │   Hospedado no Cloudflare    │
└─────────────┬───────────────┘      └──────────────┬───────────────┘
              │                                     │
              │   ambos apontam pro mesmo Supabase │
              │                                     │
              └──────────┬──────────────────────────┘
                         ▼
         ┌────────────────────────────────────────┐
         │   SUPABASE (gerenciado pelo Lovable)   │
         │   projeto: nmeuxanxjnhpdcfkdrdc        │
         │                                        │
         │   ├── Postgres (tabela leads, etc.)    │
         │   ├── 34 Edge Functions                │
         │   │    (create-pipedrive-lead,         │
         │   │     tag-manychat, send-calendar-   │
         │   │     invite, etc.)                  │
         │   └── Secrets                          │
         │        (PIPEDRIVE_API_TOKEN,           │
         │         MANYCHAT_API_TOKEN, etc.)      │
         └──────────────────┬─────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌────────┐         ┌──────────┐         ┌────────┐
   │Pipedrive│         │ ManyChat │         │ Resend │
   │  (CRM)  │         │(WhatsApp)│         │(Emails)│
   └────────┘         └──────────┘         └────────┘
```

**Regra geral:** Frontend é independente. Banco + automações é compartilhado.

---

## 🎯 Decisões tomadas no fork (vs. Lovable)

### 1. ABRouter local (não consulta mais Supabase)

**Onde:** `src/components/ABRouter.tsx`

**Comportamento atual:**
- `demochat.orbitgestao.com.br/` → **sempre LP**
- `demochat.orbitgestao.com.br/?ab=chat2` → força Chat2
- `demochat.orbitgestao.com.br/?ab=lp` → força LP (redundante)
- `demochat.orbitgestao.com.br/chat2-ab` → Chat2 (rota direta, já existia)

**Comportamento antigo (herdado do Lovable):**
- Consultava `app_settings.ab_testing_enabled` no Supabase
- Se flag = true → sorteava 50/50 LP vs Chat2
- Se flag = false → sempre LP
- Travava render durante consulta (~700ms de tela branca em mobile)

**Motivos da mudança:**
1. **Performance:** eliminou ~700ms de tela branca, LCP mobile melhorou ~1.5s
2. **Isolamento:** colega mexendo no painel A/B do Lovable não afeta mais este fork
3. **Controle:** A/B de anúncios pagos agora é controlado pela URL do anúncio, não por flag compartilhada

**Como reverter (voltar a consultar Supabase):**

```bash
# no root do projeto
git log --oneline src/components/ABRouter.tsx
# copia o hash do commit anterior (antes da simplificação)
git checkout <hash> -- src/components/ABRouter.tsx
# commit normal
```

Ou editar `src/components/ABRouter.tsx` manualmente e adicionar o `useEffect` com a query Supabase (versão original está no histórico do git).

---

### 2. Charts chunk (recharts) não é mais pré-carregado

**Onde:** `vite.config.ts` (`modulePreload.resolveDependencies` + remoção de `recharts` do `manualChunks`)

**Comportamento atual:**
- `recharts` é empacotado dentro do chunk `Admin` (lazy-loaded)
- Só baixa quando alguém acessa `/admin`

**Comportamento antigo:**
- `recharts` era um chunk separado (`charts-*.js`, 411KB)
- Era pré-carregado em todas as páginas, mesmo as LPs de tráfego pago
- Adicionava ~1s ao LCP em mobile 4G

**Como reverter:** adicionar de volta `charts: ["recharts"]` em `manualChunks` em `vite.config.ts`.

---

### 3. GTM `form_submit_success` dispara pra qualquer tráfego

**Onde:** `src/lib/dataLayer.ts`

**Comportamento atual:**
- Evento `form_submit_success` dispara em **qualquer** submit de form completo (paid, organic, direct, email, qualquer fonte)
- GTM decide qual tag (Google Ads, Meta, LinkedIn, etc.) executar
- Dedup: fires 1x por sessão (flag `apex_form_submit_fired` em sessionStorage)
- Click IDs capturados (`fbclid`, `gclid`, `ttclid`, `_fbc` cookie, etc.) são persistidos em sessionStorage e incluídos no payload

**Comportamento antigo:**
- Só disparava se URL tivesse `fbclid`, `gclid` ou similares
- Dava ruim em navegação SPA (URL perde query), Safari/iOS (usa cookie `_fbc` em vez de `fbclid`), etc.

**Como reverter:** reverter commits que tocaram `src/lib/dataLayer.ts` (ver `git log src/lib/dataLayer.ts`).

---

## 🔗 O que é compartilhado com o Lovable (⚠️ AFETA OS 2 SITES)

### Banco de dados

| Tabela | O que tem |
|---|---|
| `leads` | Todos os leads dos 2 sites caem aqui. Dedup por email/whatsapp |
| `app_settings` | Flags globais (`ab_testing_enabled` não é mais lida pelo fork — mas ainda é lida pelo Lovable) |
| `roleta_counter` | Round-robin de vendedores (Gisele/Pedro/Thayane). Compartilhado |
| `presentation_slides` | Slides do `/apresentacao`. Compartilhado |
| `email_logs` | Log de emails enviados. Compartilhado |
| `diagnostic_responses` | Respostas do diagnóstico. Compartilhado |

### Edge Functions (34 no total, todas compartilhadas)

As principais:
- `create-pipedrive-lead` — cria Person + Org + Deal no Pipedrive
- `tag-manychat` — aplica tags e campos no ManyChat
- `send-calendar-invite` — envia email com ICS via Resend
- `assign-pipedrive-owner` — round-robin de vendedores
- `trigger-n8n-call` — webhook pra confirmação por ligação
- `sync-lead-make`, `sync-lead-crm` — sync externo
- `chat2-ai`, `chat2-tts` — IA da Olivia
- `manychat-webhook`, `pipedrive-webhook` — eventos reversos

**Se o Lovable alterar qualquer uma dessas, afeta este fork também.**

### Secrets do Supabase

- `PIPEDRIVE_API_TOKEN`
- `MANYCHAT_API_TOKEN` + `MANYCHAT_API_TOKEN_2`
- `RESEND_API_KEY`
- `LOVABLE_API_KEY` (IA)
- `ELEVENLABS_API_KEY` (TTS)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injetado)

**Se algum for rotacionado/removido, as automações param nos 2 sites.**

### Contas finais

| Serviço | Conta |
|---|---|
| Pipedrive | 1 conta única, deals dos 2 sites no mesmo pipeline |
| ManyChat | 1 conta única, subscribers dedupados por WhatsApp |
| Resend | Mesmo domínio remetente |
| GTM | `GTM-W6H3729J` — **mesmo container** nos 2 sites |

---

## 🔒 O que é exclusivo do fork

### Frontend

- Todo o código em `src/`, `public/`, `index.html`, `package.json`
- Deploy no Cloudflare Pages (`demochat.orbitgestao.com.br`)
- Env vars no `.env` apontam pro Supabase compartilhado, mas o código é só seu

### Otimizações de performance

- `vite.config.ts` modificado pra não preloadar chunks do Admin
- `public/_headers` com cache agressivo
- `public/_redirects` pro SPA fallback do Cloudflare
- `package.json` com `overrides` pra resolver conflito `react-day-picker`/`date-fns`

### Tooling

- `.claude/settings.json` — permissions do Claude Code
- `CLAUDE.md` — contexto do projeto
- `docs/` — esta documentação

---

## 🛠️ Como fazer mudanças

### Mudanças só no fork (seguras)

- Alterar copy/layout das páginas
- Adicionar componentes novos
- Otimizar performance
- Criar rotas novas
- Ajustar o ABRouter (este arquivo)
- Ajustar tracking/GTM (só no frontend)

**Fluxo:** edita → `npm run build` → commit → push → Cloudflare redeploya.

### Mudanças que exigem coordenação com o Lovable

- Criar/alterar tabelas no banco
- Criar/alterar Edge Functions
- Rotacionar secrets
- Mudar RLS policies
- Adicionar campos novos na tabela `leads`

**Fluxo:** sempre alinhar antes — uma mudança dessas afeta os 2 sites.

---

## 🚑 Plano B: desacoplamento total

Se um dia precisar isolar **100%** do Lovable (ex: equipe A/B já não compartilha estratégia, ou o Lovable vai ser desligado), o caminho é:

1. **Criar novo projeto Supabase** (pago, ~$25/mês tier Pro)
2. **Copiar schema** do projeto atual via `supabase db dump`
3. **Copiar Edge Functions** (já estão no repo em `supabase/functions/`)
4. **Copiar secrets** (requer acesso ao Pipedrive/ManyChat/Resend pra pegar tokens)
5. **Apontar `.env` do fork pro Supabase novo**
6. **Leads dos 2 sites deixam de misturar** (ponto importante de alinhamento com a equipe comercial)

Esforço estimado: 1 dia de setup + validação.

---

## 📖 Referências

- [docs/fluxo-automacoes.md](./fluxo-automacoes.md) — mapa detalhado de cada automação disparada pelo form
- [CLAUDE.md](../CLAUDE.md) — contexto pro Claude Code
- [README.md](../README.md) — quick start

---

## 📜 Histórico de decisões

| Data | Decisão | Motivo | Reversível? |
|---|---|---|---|
| 2026-04-15 | ABRouter local (ignora flag Supabase) | Performance + isolamento do Lovable | ✅ sim (ver seção 1) |
| 2026-04-15 | Charts chunk lazy dentro do Admin | LP não precisa de recharts (411KB) | ✅ sim (ver seção 2) |
| 2026-04-15 | `form_submit_success` pra qualquer tráfego | Dispara certo em paid + organic, sem regressão | ✅ sim (ver seção 3) |
| 2026-04-15 | Imagens otimizadas (logo, favicon, olivia) | Economia de 315KB por visita | ✅ sim (restaurar do git) |
| 2026-04-15 | `public/_headers` cache agressivo | Revisitas ~instantâneas | ✅ sim (apagar arquivo) |
