# Corretor Pro

SaaS para corretores de imóveis: gestão de **clientes compradores**, **imóveis** vinculados, **compatibilidade** preferência×oferta, **catálogo/PDF**, **upload de fotos** e **administração de convites** de corretores.

## Stack

- **Next.js** 16 (App Router) + **React** 19 + **TypeScript**
- **Tailwind CSS** 4
- **Supabase** (Auth, Postgres, Storage)
- **Zod** (validação)
- **Vitest** (testes unitários)

## Funcionalidades principais

- Autenticação (login, registro por convite, recuperação e redefinição de senha)
- Dashboard com estatísticas
- CRUD de clientes + arquivamento
- CRUD de imóveis por cliente (favorito, avaliação, ordenação)
- Score de compatibilidade cliente × imóvel
- Geração de catálogo HTML/PDF no browser
- Perfil do corretor
- Admin de allowlist (`broker_invites`)

## Estrutura do projeto

```
app/                 # rotas (App Router)
components/          # UI (forms seccionados em components/forms/)
schemas/             # Zod
validators/          # helpers de validação
services/            # orquestração
repositories/        # acesso a dados Supabase
server/              # código server-only (SSR auth)
lib/                 # supabase client, env, errors, logger, parsers, formatters
types/               # tipos de domínio
supabase/            # migrations e snippets SQL
docs/                # documentação técnica
```

## Setup local

### Pré-requisitos

- Node.js 20+
- Projeto Supabase com schema/auth/storage configurados (ver `docs/database.md`)

### Variáveis de ambiente

Copie `.env.example` para `.env.local`:

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Chave anon (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Service role — nunca expor ao browser |
| `ADMIN_EMAIL` | server | E-mail do admin de convites (default documentado no código se omitido) |

### Comandos

```bash
npm install
npm run dev      # desenvolvimento — http://localhost:3000
npm run lint     # ESLint
npm test         # Vitest
npm run build    # build de produção
npm start        # serve o build
```

## Segurança (resumo)

- `SUPABASE_SERVICE_ROLE_KEY` só em código server-only (`lib/supabase-admin.ts` + API admin).
- Envs validadas em `lib/env.ts` (falha explícita se faltar crítica no server).
- Middleware protege rotas privadas por sessão.
- Upload com restrição de MIME/tamanho no app; **policies RLS/Storage no Supabase são obrigatórias** e não são totalmente garantidas só pelo repo.
- Registro de corretor depende de convite (`is_broker_invited`).

Detalhes: `docs/architecture.md`, `docs/database.md`.

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [docs/architecture.md](./docs/architecture.md) | Arquitetura, auth, upload, camadas |
| [docs/database.md](./docs/database.md) | Entidades, tenancy, riscos de schema |
| [docs/development.md](./docs/development.md) | Convenções de código e testes |
| [docs/refactor-assessment.md](./docs/refactor-assessment.md) | Baseline da refatoração |
| [docs/refactor-final-report.md](./docs/refactor-final-report.md) | Relatório final por fase |

## Roadmap técnico (resumido)

- Completar migrations RLS versionadas no repo
- Alinhar bucket Storage e policies por `user_id`
- Migrar mutações críticas para Server Actions quando RLS exigir defense-in-depth
- Ampliar cobertura de testes de repositórios (com mocks)

## Licença

Privado — uso interno do projeto.
