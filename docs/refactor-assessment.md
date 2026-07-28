# Refactor Assessment — Corretor Pro

**Data:** 2026-07-28  
**Repositório:** `alexfscorretor-del/corretorcomprador`  
**Stack observada:** Next.js 16.2.6 · React 19 · TypeScript · Tailwind 4 · Supabase JS/SSR

---

## 1. Visão geral do estado atual

MVP funcional de gestão imobiliária multi-corretor (tenancy por `user_id`):

| Área | Estado |
|------|--------|
| Auth | Login/registro/recuperação/redefinição no client (`app/login`, `app/redefinir-senha`) via `supabase.auth` + RPC `is_broker_invited` / `consume_broker_invite` |
| Dashboard | `app/dashboard` — lista/stats de clientes do usuário |
| Clientes | CRUD + arquivamento em `app/clientes` e detalhe monólito `app/clientes/[id]` (~1271 linhas) |
| Imóveis | CRUD aninhado ao cliente; upload de fotos base64 → Storage |
| Perfil | Upsert em `brokers` |
| Admin | Página client + API `app/api/admin/invites` com `supabaseAdmin` |
| Catálogo/PDF | `lib/catalog.ts` gera HTML/print; compatibilidade em `lib/compatibility.ts` |
| Testes | Ausentes |
| Validação | Apenas checks manuais (`nome`/`telefone` obrigatórios) + máscaras locais |
| Docs raiz | README default create-next-app; vários `.md`/`.txt` soltos de contexto |

**Estrutura principal**

```
app/           # rotas App Router (quase todas 'use client')
components/    # UI (ClientForm 547L, PropertyForm 365L, cards, sidebar)
lib/           # supabase, admin, upload, catalog, compatibility
app/lib/       # DUPLICATA parcial (catalog/compatibility/supabase desatualizados)
hooks/ + app/hooks/  # useLocalStorage duplicado
types/         # Client, Property, Broker, TriState, BusinessStatus
supabase/migrations/  # clients, properties, fotos, bucket (incompleto vs schema real)
supabase/snippets/    # brokers, invites, RLS parcial
```

Não há `middleware.ts`, `server/`, `schemas/`, `services/`, `repositories/`, nem pasta `docs/` (antes desta fase).

---

## 2. Principais problemas técnicos

1. **Documentação insuficiente** — README genérico; contexto espalhado em arquivos de sessão na raiz.
2. **Componentes/páginas monolíticos** — `ClientForm`, `PropertyForm`, `app/clientes/[id]/page.tsx` misturam UI, máscaras, mapeamento DB e persistência.
3. **Acoplamento forte ao Supabase no client** — `createClient` browser em quase todas as páginas; queries e auth espalhadas.
4. **Arquitetura pouco modular** — sem camadas de schema/service/repository; mappers `DbClientRow` copiados 3+ vezes.
5. **Segurança**
   - `SUPABASE_SERVICE_ROLE_KEY` em `lib/supabase-admin.ts` sem `server-only` / barreira de bundle.
   - Envs com non-null assertion (`!`) sem validação na boot.
   - Auth/guard só no client (`AuthGuard` existe mas **não** é usado no `layout`; cada página recheca).
   - Admin email hardcoded em client e API.
   - Upload sem limite de tamanho/MIME; bucket code `property-photos` vs migration `property-images`.
   - Storage policies de migration permissivas (INSERT autenticado sem path ownership claro).
6. **Validação frágil** — sem Zod/schema; CPF/email/ranges não validados de forma estruturada.
7. **Sem testes** e script `test` ausente no `package.json`.
8. **Sem padronização** de erros/logs/envs; `alert()` e `console.error` ad hoc.
9. **Duplicação** `lib/` vs `app/lib/`, `hooks/` vs `app/hooks/`.
10. **Schema no repo incompleto** — código usa `user_id`, `archived`, `status_negocio`, `brokers`, `broker_invites`; migrations versionadas não cobrem tudo (parte só em snippets).

---

## 3. Funcionalidades a preservar

- Login / registro com convite / recuperação de senha / redefinição
- Redirect inicial `/` → dashboard ou login
- Dashboard com estatísticas
- Cadastro, edição, exclusão e listagem de clientes (filtros/busca)
- Arquivamento / desarquivamento de clientes e área `/arquivados`
- Detalhe do cliente com imóveis, ordenação, compatibilidade
- Cadastro/edição/exclusão de imóveis + favorito/rating
- Upload e exclusão de fotos de imóvel
- Geração de catálogo / PDF
- Perfil do corretor (`brokers`)
- Área admin de convites (`broker_invites`) via API
- Sidebar e navegação existente

---

## 4. Riscos

| Risco | Severidade |
|-------|------------|
| Service role importável acidentalmente no client | Alta |
| RLS/policies reais só no projeto Supabase remoto (repo incompleto) | Alta |
| Mismatch de nome de bucket Storage | Média–Alta |
| Auth só client → flicker e bypass por ausência de middleware | Média |
| Upload irrestrito (custo/abuso) | Média |
| Refatoração de monólitos pode regredir fluxos de save/upload | Média |
| `strict: false` no TS esconde erros de tipo | Baixa–Média |
| Credenciais/env não versionadas — build local sem `.env` falha | Esperado |

---

## 5. Plano resumido das fases seguintes

| Fase | Entrega |
|------|---------|
| 1 | README + `docs/architecture|database|development.md`; higiene da raiz |
| 2 | `lib/env.ts`, `lib/errors.ts`, `lib/logger.ts`; admin server-only; erros claros |
| 3 | `schemas/`, `services/`, `repositories/`, `server/`, formatters/parsers; mappers únicos |
| 4 | Zod nos fluxos cliente/imóvel/auth/upload; submit validado |
| 5 | Quebrar `ClientForm` e `PropertyForm` em seções |
| 6 | Middleware + helpers server-side para sessão/admin |
| 7 | Restrições MIME/tamanho/path no upload; documentar policies |
| 8 | Vitest + testes de parsers/máscaras/schemas |
| 9 | Limpeza de duplicatas; `docs/refactor-final-report.md` |

---

## 6. Observações de baseline (evidência)

- `package.json`: scripts só `dev/build/start/lint`; deps sem zod/vitest/server-only.
- Maior arquivo app: `app/clientes/[id]/page.tsx` (1271 linhas).
- `supabase-admin` referenciado apenas em `app/api/admin/invites/route.ts` (bom isolamento de uso atual).
- `AuthGuard` / `StorageInitializer` presentes mas sem uso amplo no layout.
- Duplicatas confirmadas por `diff`: `lib/catalog.ts` ≠ `app/lib/catalog.ts`, etc.
