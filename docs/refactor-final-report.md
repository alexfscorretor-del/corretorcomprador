# Relatório final da refatoração — Corretor Pro

**Data:** 2026-07-28  
**Escopo:** endurecimento técnico com preservação funcional (plano fases 0–9)

---

## O que foi alterado por fase

### Fase 0 — Levantamento
- Criado `docs/refactor-assessment.md` com baseline real do código.

### Fase 1 — Documentação e higiene
- `README.md` reescrito (produto, setup, envs, scripts, segurança, estrutura).
- `docs/architecture.md`, `docs/database.md`, `docs/development.md`.
- `.env.example` adicionado.
- Materiais soltos da raiz movidos para `docs/archive/`.
- Removidos artefatos não essenciais da raiz (`*.docx`, `.bat` de sessão, duplicatas vazias).

### Fase 2 — Configuração e segurança básica
- `lib/env.ts` — validação explícita de envs (sem `!`).
- `lib/errors.ts`, `lib/logger.ts`.
- `lib/supabase.ts` — client browser lazy + env validada.
- `lib/supabase-admin.ts` — `server-only` + `getSupabaseAdmin()`.
- `server/supabase/*`, `server/auth.ts`.
- API admin usa `getSupabaseAdmin` + `ADMIN_EMAIL` de env + validação Zod no POST.

### Fase 3 — Separação de camadas
- `lib/formatters.ts`, `lib/parsers.ts`, `lib/mappers.ts`.
- `repositories/` (clients, properties, brokers).
- `services/` (client, property) com orquestração.
- Páginas principais passam a usar repositórios/services (clientes, detalhe, arquivados, dashboard).
- Removidos duplicados `app/lib/` e `app/hooks/`.

### Fase 4 — Validação formal
- Zod em `schemas/` (client, property, auth, upload, common).
- `validators/cpf.ts`, `validators/ranges.ts`.
- Submit de `ClientForm` / `PropertyForm` valida via services/schemas.
- Login/registro com `loginSchema` / `registerSchema`.

### Fase 5 — Formulários
- `ClientForm` (~547 → ~177 linhas) compõe seções em `components/forms/client/*`.
- `PropertyForm` (~365 → ~307 linhas) compõe `BasicInfo`, `Features`, `Media`.

### Fase 6 — Auth server-side
- `middleware.ts` com refresh de sessão (`@supabase/ssr`) e redirect de rotas privadas.
- Helpers `requireSessionUser` / `requireAdminUser`.
- Admin API permanece server-only com Bearer + service role.

### Fase 7 — Upload
- MIME/tamanho/path endurecidos em `lib/uploadPhotos.ts`.
- Limites documentados em `docs/storage-upload.md`.
- Validação de file no `PropertyForm` antes do canvas.

### Fase 8 — Testes
- Vitest configurado (`vitest.config.ts`, scripts `test` / `test:watch`).
- 18 testes: formatters/parsers/máscaras, CPF, ranges, schemas cliente/imóvel/login.

### Fase 9 — Limpeza
- Duplicatas removidas; raiz enxuta.
- `tsc --noEmit` exit 0; `npm test` 18/18.

---

## O que foi preservado

- Login, registro por convite, recuperação/redefinição de senha
- Dashboard, listagem/CRUD de clientes, detalhe com imóveis
- Arquivamento / área arquivados
- Upload de fotos, catálogo/PDF, compatibilidade
- Perfil do corretor, admin de convites
- Stack: Next.js + React + TS + Supabase + Tailwind

---

## Riscos restantes

1. **RLS/policies completas** de `clients`/`properties`/Storage não estão todas versionadas no repo — dependem do projeto Supabase remoto.
2. **Mismatch histórico** `property-images` (migration) vs `property-photos` (código).
3. **CRUD ainda no browser** com JWT do usuário — seguro **se** RLS estiver correto; defense-in-depth com Server Actions fica no backlog.
4. **Admin email** ainda tem default hardcoded de fallback (configurável via `ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_EMAIL`).
5. **`app/clientes/[id]/page.tsx`** ainda é grande (UI + PDF inline); lógica de persistência foi extraída, mas a página permanece densa.
6. Sem E2E automatizado contra Supabase real (sem credenciais no ambiente de refatoração).

---

## Bloqueios encontrados

Nenhum bloqueio que tenha impedido a execução do plano no código do repositório.

Observação operacional (não bloqueou o código):

### BLOQUEIO
- **Item:** Validação end-to-end contra projeto Supabase de produção (build/start com envs reais, policies RLS live).  
- **Arquivo(s) afetado(s):** runtime remoto / `.env.local` (não versionado).  
- **Motivo técnico:** credenciais e schema live não estão no repositório.  
- **Impacto no sistema:** não foi possível smoke-testar login/upload reais nesta sessão.  
- **Por que não é seguro improvisar:** inventar keys/policies quebraria ou falsearia segurança.  
- **Pré-condição para resolver:** `.env.local` válido + acesso ao dashboard Supabase.  
- **Solução conservadora adotada temporariamente:** validação estática (`tsc`) + suíte unitária + documentação de pré-condições de DB/Storage.

---

## Itens não executados e motivo

| Item | Motivo |
|------|--------|
| Reescrever monólito PDF/`gerarPDF` da página de detalhe em módulos menores | Fora do critério mínimo (ClientForm/PropertyForm); risco alto de regressão visual de catálogo sem ganho de segurança |
| Migrar 100% do CRUD para Server Actions | Viável, mas exige confiança/paridade total com RLS e sessão cookie; tenancy atual já filtra `user_id` no client + middleware de sessão |
| Versionar todas as policies RLS de produção | Schema live não está completo no repo; documentado em `docs/database.md` |

---

## Backlog técnico recomendado (não implementado)

1. Migrations consolidadas com RLS de `clients`/`properties` por `auth.uid() = user_id`.
2. Storage policies com prefixo por `user_id`.
3. Unificar nome do bucket no painel e nas migrations.
4. Server Actions para create/update de cliente e imóvel.
5. Quebrar `gerarPDF` / catálogo em módulos testáveis.
6. E2E (Playwright) nos fluxos login → cliente → imóvel → upload.
7. Ativar `strict: true` no TypeScript gradualmente.
8. Remover default de e-mail admin do código (somente env).

---

## Verificação executada

```text
npx tsc --noEmit   # EXIT 0
npm test           # 18 passed
```

Funcionalidades dependentes de Supabase remoto **não** foram exercidas sem `.env.local`.
