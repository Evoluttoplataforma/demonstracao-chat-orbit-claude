# CLAUDE.md

Contexto pra Claude Code (ou qualquer agente de IA) operar neste projeto com menos perguntas e menos risco de quebrar coisas.

---

## O que é este projeto

Frontend React/Vite do funil de captação de leads da **Orbit Gestão**. Quando um usuário preenche o form, o backend (Supabase + Edge Functions) dispara uma cadeia longa de automações em Pipedrive, ManyChat, Resend (emails), N8N e Make.

**Este repositório é só o frontend.** Toda a lógica de negócio real (criar deal, aplicar tag, mandar email, mover stage) roda em Edge Functions Deno deployadas no Supabase — não redeployam daqui.

---

## Stack e comandos essenciais

- **Build:** `npm run build` → gera `dist/`
- **Dev:** `npm run dev` → porta 8080 (ou 8081 se 8080 ocupado)
- **Testes:** `npm test`
- **Lint:** `npm run lint`
- **Type-check:** `npx tsc --noEmit`

Stack: Vite 5, React 18, TypeScript 5, Tailwind 3, shadcn/ui, React Router 6, Supabase JS, Vitest.

---

## Antes de mexer no funil, leia isto

📖 **[docs/fluxo-automacoes.md](./docs/fluxo-automacoes.md)** — mapa exaustivo do que acontece em cada etapa. Leads, labels, tags, emails, webhooks. Não tente entender o fluxo só lendo código — use o mapa.

---

## Convenções do projeto

### Páginas de vertical (Advocacia, Clínicas, Consultoria, etc.)
São clones quase idênticos entre si. Se corrigir um bug em uma, **replique nas 10+ irmãs** (`Advocacia.tsx`, `Clinicas.tsx`, `Consultoria.tsx`, `Contador.tsx`, `Agencia.tsx`, `Engenharia.tsx`, `Imobiliaria.tsx`, `Ecommerce.tsx`, `Educacao.tsx`, `Franquias.tsx`, `LandingPage.tsx`). Refatoração pra componente parametrizado é dívida técnica conhecida — não é prioridade.

### GTM / dataLayer
- `src/lib/dataLayer.ts` centraliza tudo. Evento padrão: `form_submit_success`
- **Dispara 1x por sessão** (dedup via sessionStorage `apex_form_submit_fired`)
- **Dispara pra qualquer tráfego** (paid/organic/direct). GTM roteia pra Google Ads, Meta, LinkedIn, etc.
- Click IDs (`fbclid`, `gclid`, `ttclid`, cookie `_fbc`, etc.) são capturados no boot em `main.tsx` e persistidos em sessionStorage

### Lead dedup
Client-side busca antes de inserir: `.or('email.eq.X,whatsapp.ilike.%Y%')`. Mesmo email OU mesmo telefone → UPDATE. ⚠️ Mas no **Pipedrive**, mesmo email cria **deal novo** (a Person é a mesma). Não é bug, é comportamento atual — tem nota em `docs/fluxo-automacoes.md`.

### Supabase
- Projeto: `nmeuxanxjnhpdcfkdrdc` (cloud gerenciado pelo time do Lovable)
- Só existem chaves `anon/publishable` no `.env` — seguras pro frontend (RLS protege o banco)
- **Service role key nunca vai pro repo** — fica como secret das Edge Functions
- Types de DB estão em `src/integrations/supabase/types.ts` (gerados automaticamente)

### Edge Functions (`supabase/functions/`)
São código **deployado na nuvem do Supabase**. Editar aqui **não** faz redeploy automático — é só referência. Pra fazer deploy real, teria que ter acesso ao CLI do Supabase do projeto, o que não temos.

Quando pedirem pra "corrigir uma automação", lembre: o código está aqui, mas a versão rodando é a deployada lá. Mudanças locais não afetam leads de produção.

### Secrets expected pelas Edge Functions
- `PIPEDRIVE_API_TOKEN`
- `MANYCHAT_API_TOKEN` + `MANYCHAT_API_TOKEN_2`
- `RESEND_API_KEY`
- `LOVABLE_API_KEY` (IA)
- `ELEVENLABS_API_KEY` (TTS)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injetado pelo Supabase)

Se qualquer uma faltar, a function retorna early — lead vai pro Supabase mas não propaga pras integrações.

---

## Áreas sensíveis

- ❌ **Não commitar `.env`** — usa `.env.example` como template
- ❌ **Não mexer em `supabase/migrations/`** sem coordenar — o banco é compartilhado com o site do Lovable em produção
- ❌ **Não deletar tags/labels** do código sem verificar os webhooks reversos (`manychat-webhook`, `pipedrive-webhook`) que dependem dos nomes exatos
- ⚠️ **Formulários são críticos**: testar manualmente no `npm run dev` com email `seu+teste@dominio.com` antes de considerar feito. Tipos passarem e build passar **não garante** que a automação fim-a-fim funciona

---

## Deploy

Cloudflare Pages. Build: `npm run build`. Output: `dist`. SPA fallback já configurado em `public/_redirects`. Env vars (Production + Preview):

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
NODE_VERSION=20
```

Novos domínios precisam ser adicionados em **Supabase → Authentication → URL Configuration → Redirect URLs**, senão login falha.

---

## Issues conhecidos e contexto histórico

- **~60 `any` explícitos** restantes em edge functions e páginas de vertical (lint aponta). Não são bugs, só type safety. Corrigir em batch quando dedicar tempo.
- **17 vulnerabilidades `npm audit`** (3 low, 6 moderate, 8 high) — maioria em deps transitivas do shadcn/radix. Rodar `npm audit fix` pode quebrar — testar antes.
- **Páginas de vertical** (Advocacia, Clínicas, etc.) — replicação manual. Refatorar é trabalhoso mas vale.
