# Orbit — Captura e Qualificação de Leads

Frontend React + Vite que roda o funil de captação, qualificação e agendamento de demonstrações da Orbit Gestão.

Leads preenchidos aqui são persistidos no Supabase e disparam automações em Pipedrive, ManyChat, emails (Resend), N8N e Make.

---

## Stack

- **Vite 5** + **React 18** + **TypeScript 5**
- **shadcn/ui** + **Tailwind CSS 3**
- **Supabase** (Postgres + Edge Functions Deno) — banco e toda automação server-side
- **React Router 6** (SPA)
- **Vitest** + **Testing Library**

---

## Setup local

**Requisitos:** Node 20+, npm.

```bash
npm install
cp .env.example .env   # preencha com as chaves anon do Supabase
npm run dev            # sobe em http://localhost:8080
```

Variáveis necessárias no `.env` — apenas chaves `anon/publishable` (seguras pro frontend; RLS protege o banco). Veja `.env.example`.

Secrets server-side (`PIPEDRIVE_API_TOKEN`, `MANYCHAT_API_TOKEN`, `RESEND_API_KEY`, etc.) ficam no painel do Supabase: **Edge Functions → Manage secrets**. Nunca entram no repositório.

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Dev server com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run build:dev` | Build com sourcemaps pra debug |
| `npm run preview` | Serve o `dist/` local |
| `npm run lint` | ESLint em todo o projeto |
| `npm test` | Vitest (CI) |
| `npm run test:watch` | Vitest em modo watch |

---

## Estrutura

```
├── docs/                       Documentação do projeto
│   └── fluxo-automacoes.md     ⚡ Mapa completo: form → Pipedrive/ManyChat/emails
├── public/                     Assets estáticos + _redirects (SPA fallback)
├── src/
│   ├── assets/                 Imagens e fontes
│   ├── components/
│   │   ├── admin/              Painel de admin (leads, analytics, diagnóstico)
│   │   ├── apresentacao/       Deck de slides de apresentação
│   │   ├── chat/               Chat IA com Olivia + calendário
│   │   ├── salas/              Páginas de salas ao vivo
│   │   └── ui/                 shadcn components (botões, dialogs, etc.)
│   ├── hooks/                  React hooks customizados
│   ├── integrations/supabase/  Client + types gerados
│   ├── lib/                    Utils (dataLayer/GTM, validação, copy variants)
│   ├── pages/                  Landing pages por vertical + painéis
│   └── test/                   Setup do Vitest
└── supabase/
    ├── functions/              34 Edge Functions (Pipedrive, ManyChat, emails, IA)
    └── migrations/             Schema SQL
```

---

## Documentação importante

- **[docs/fluxo-automacoes.md](./docs/fluxo-automacoes.md)** — mapa exaustivo do que acontece quando um lead preenche o form: cada chamada de API, cada tag do ManyChat, cada label do Pipedrive, cada webhook externo. **Leitura obrigatória antes de mexer em qualquer coisa do funil.**
- **[CLAUDE.md](./CLAUDE.md)** — contexto e convenções pro Claude Code (ou qualquer dev) navegar o projeto rápido.

---

## Deploy

### Cloudflare Pages (recomendado)

1. **Build command:** `npm run build`
2. **Output directory:** `dist`
3. **Node version:** `20` (setar `NODE_VERSION=20` nas env vars)
4. **Environment variables** (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
5. **SPA fallback:** já configurado via `public/_redirects` (`/* /index.html 200`).

### Supabase Auth

No Dashboard do Supabase → **Authentication → URL Configuration**, adicione o domínio de deploy em **Redirect URLs**. Senão login em `/admin` e `/vendedor` falha.

---

## Testing / QA

Pra testar sem conflitar com leads reais em produção:

- Use emails com alias (`seu+teste01@domain.com`) — Gmail/Outlook recebem na mesma caixa mas Supabase/Pipedrive/ManyChat tratam como leads distintos
- O campo `landing_page` da tabela `leads` sempre grava a URL completa → dá pra filtrar leads por origem (ex: `WHERE landing_page LIKE '%seu-fork.pages.dev%'`)

---

## Licença

Proprietário — Orbit Gestão.
