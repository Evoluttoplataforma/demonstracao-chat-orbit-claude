# .claude/

Configuração de projeto para o [Claude Code](https://docs.claude.com/en/docs/claude-code).

## Arquivos

- **`settings.json`** — permissions e configs compartilhadas com o time (versionado no git).
- **`settings.local.json`** — overrides pessoais (NÃO versionado; criado automaticamente pelo Claude Code).

## Onde colocar o quê

| Quero... | Arquivo |
|---|---|
| Instruções, convenções, contexto de negócio | `../CLAUDE.md` (raiz do projeto) |
| Permissões de comandos (allow/deny) | `.claude/settings.json` |
| Hooks, env vars, ajustes pessoais | `.claude/settings.local.json` (gitignore) |
| Skills/agents custom do projeto | `.claude/skills/` ou `.claude/agents/` |

Ver docs: https://docs.claude.com/en/docs/claude-code/settings
