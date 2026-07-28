# Arquitetura — Corretor Pro

## Visão da arquitetura atual (pós-refatoração)

Aplicação **Next.js App Router** com UI majoritariamente client-side e backend BaaS **Supabase** (Auth, Postgres, Storage).

```
Browser (React client)
  ├── components/forms/*     UI de formulários por seção
  ├── components/*           cards, sidebar, modais
  ├── services/*             orquestração (auth, clients, properties, upload)
  ├── repositories/*         acesso Supabase (anon + sessão do usuário)
  ├── schemas/*              Zod (entrada)
  └── lib/*                  formatters, parsers, errors, logger, env (public)

Edge / Node (server-only)
  ├── middleware.ts          sessão + proteção de rotas
  ├── server/*               clients Supabase server, auth helpers
  ├── lib/supabase-admin.ts  service role (API admin)
  └── app/api/**             route handlers privilegiados
```

## Decisões adotadas na refatoração

1. **Não trocar a stack** — Next + React + TS + Supabase + Tailwind.
2. **Preservar fluxos** — CRUD, upload, catálogo, admin por convite.
3. **Camadas mínimas** — `schemas` → `services` → `repositories` → Supabase.
4. **Service role isolado** — `server-only` + uso restrito a route handlers.
5. **Validação Zod** nos submits críticos (cliente, imóvel, auth, upload meta).
6. **Middleware** para checagem de sessão em rotas privadas (reduz flicker e dependência só do client).
7. **Upload com limites** MIME/tamanho no client antes do Storage; policies de bucket documentadas (dependem do projeto Supabase).

## Separação client / server

| Código | Onde roda | Exemplos |
|--------|-----------|----------|
| UI + formulários | Browser | `components/`, páginas `app/**/page.tsx` |
| Repositórios com anon key + JWT do user | Browser (sessão) | `repositories/*` via `lib/supabase.ts` |
| Validação de env pública | Browser/Server | `NEXT_PUBLIC_*` em `lib/env.ts` |
| Service role / admin | Server only | `lib/supabase-admin.ts`, `app/api/admin/*` |
| Sessão cookie SSR | Middleware / Server | `server/supabase/*`, `middleware.ts` |

## Camadas

- **`schemas/`** — contratos de entrada (Zod).
- **`validators/`** — helpers reutilizáveis (CPF, ranges) usados pelos schemas.
- **`repositories/`** — CRUD e queries; sem UI.
- **`services/`** — orquestra validação + repositório + upload.
- **`server/`** — utilitários estritamente server-side.
- **`lib/formatters.ts` / `lib/parsers.ts`** — máscaras e parse de moeda/telefone/CPF.

## Fluxo de autenticação

1. Registro: client chama RPC `is_broker_invited` → `signUp` → `consume_broker_invite`.
2. Login: `signInWithPassword` → redirect `/dashboard`.
3. Middleware valida cookie/sessão em rotas privadas; redireciona para `/login` se ausente.
4. Páginas ainda podem reforçar `getUser()` para dados do usuário.
5. Admin: e-mail allowlist + Bearer token validado na API com `supabaseAdmin.auth.getUser`.

## Fluxo de upload

1. `PropertyForm` processa arquivo (canvas, JPEG).
2. Validação de tipo/tamanho (`schemas/upload.ts` + `services/uploadService`).
3. `uploadPhotos` envia ao bucket `property-photos` sob `property-photos/{propertyId}/`.
4. URLs públicas gravadas em `properties.fotos` (jsonb).

## Limites conhecidos

- Policies RLS completas e triggers de `brokers` vivem no projeto Supabase; o repo tem migrations parciais + snippets.
- Nome histórico `property-images` na migration vs `property-photos` no código — código é a fonte operacional.
- Catálogo/PDF ainda é gerado no browser (HTML print).
- Operações de CRUD de cliente/imóvel permanecem no client com JWT do usuário (RLS deve garantir tenancy); endurecimento total server-action fica no backlog se RLS for insuficiente.
