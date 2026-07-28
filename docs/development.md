# Desenvolvimento — Corretor Pro

## Setup

```bash
cp .env.example .env.local   # preencher valores
npm install
npm run dev                  # http://localhost:3000
npm run lint
npm test
npm run build
```

## Convenções de código

- TypeScript; preferir tipos de `@/types` para domínio.
- Path alias `@/*` → raiz do projeto.
- pt-BR na UI; identificadores de código em inglês ou domínio já existente (`precoMin`, etc.) — **não renomear domínio** só por estética.
- Não usar non-null assertion em `process.env`; usar `@/lib/env`.
- Não importar `@/lib/supabase-admin` ou `@/server/*` em componentes client.

## Componentes

- Presentational + handlers finos.
- Formulários grandes: seções em `components/forms/{client,property}/`.
- Estado de formulário local; submit chama `onSave` já validado (Zod no container do form).
- Estilo: Tailwind utility; inputs escuros (`bg-white/10`, bordas `white/10`).

## Server actions / route handlers

- Route handlers em `app/api/**` para privilégio elevado (admin).
- Validar Bearer/`getUser` no server antes de mutar.
- Preferir `createClient` server (`@/server/supabase/*`) quando precisar de cookies SSR.
- Middleware: apenas gate de sessão + redirect; autorização fina (admin email) na rota/API.

## Validação

- **Zod** em `schemas/`.
- Helpers em `validators/` (CPF, etc.).
- Mensagens em pt-BR legíveis.
- UI mascara; schema valida de verdade antes de persistir.
- Services chamam `schema.parse` / `safeParse` e mapeiam erros via `@/lib/errors`.

## Erros

- `AppError` com `code`, `message`, `status?`.
- Fluxos sensíveis: não engolir erro; logar com `@/lib/logger` e rethrow/exibir mensagem útil.
- Evitar `alert` novos em services; páginas podem adaptar `message` para UI existente.

## Testes

- Runner: **Vitest**.
- Foco: `lib/parsers`, `lib/formatters`, schemas Zod, ranges.
- Arquivos: `**/*.{test,spec}.ts`.
- Não mockar o mundo inteiro; testar pure functions e schemas.

## Camadas — onde colocar o quê

| Preciso… | Coloco em |
|----------|-----------|
| Máscara/parse | `lib/formatters.ts` / `lib/parsers.ts` |
| Schema de input | `schemas/` |
| Query Supabase | `repositories/` |
| Validar + orquestrar | `services/` |
| Segredo / service role | `server/` ou `lib/supabase-admin.ts` |
| UI | `components/` |

## Git / higiene

- Não commitar `.env*`.
- Docs de produto/técnicas em `/docs`.
- Evitar duplicar módulos em `app/lib` — usar `@/lib`.
