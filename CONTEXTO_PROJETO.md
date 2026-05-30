# Contexto do Projeto — Plataforma SaaS para Corretor de Imóveis

Sistema web multi-tenant para corretores de imóveis. Cada corretor gerencia seus próprios clientes, perfis de busca e imóveis encontrados. A plataforma gera automaticamente páginas e PDFs personalizados para cada cliente.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14+ com App Router (React Server Components) |
| Linguagem | TypeScript em todo o projeto |
| Backend/BaaS | Supabase (Auth + PostgreSQL + Storage) |
| Hospedagem | Vercel com deploy automático via Git |
| Estilização | Tailwind CSS |
| Ícones | Lucide React |
| Fontes | Inter + Cormorant Garamond (Google Fonts) |

---

## Decisões Arquiteturais

- **Multi-tenant por `user_id`:** Todas as tabelas (`clients`, `properties`, `brokers`) possuem coluna `user_id` (UUID, FK para `auth.users.id`). Cada corretor acessa apenas seus próprios dados.
- **Tabela `brokers`:** Armazena o perfil profissional do corretor. Upsert via `onConflict: 'user_id'` — um registro por conta Auth.
- **Tabela `clients`:** Armazena o perfil completo de busca do comprador (orçamento, bairros, tipo de imóvel, diferenciais etc.). Cada cliente pertence a um corretor via `user_id`.
- **Tabela `properties`:** Imóveis encontrados pelo corretor para um cliente específico. Vinculada ao cliente via `client_id` e ao corretor via `user_id`.
- **Bucket de fotos:** `property-photos` no Supabase Storage. Upload centralizado em `lib/uploadPhotos.ts`.
- **Remoção de colunas duplicadas:** Colunas `userid` e `nomeexibicao` foram removidas da tabela `brokers` por causarem ambiguidade no PostgREST. Colunas corretas: `user_id` e `nome_exibicao`.

---

## Estrutura de Arquivos Relevantes

```
app/
  clientes/
    page.tsx               — Lista de clientes do corretor
    [id]/
      page.tsx             — Detalhe do cliente + lista de imóveis encontrados
  perfil/
    page.tsx               — Perfil do corretor (upsert em `brokers`)
components/
  Sidebar.tsx              — Navegação lateral
  PropertyCard.tsx         — Card de imóvel com modal de detalhe e zoom de foto
  PropertyForm.tsx         — Formulário de cadastro/edição de imóvel
  ClientForm.tsx           — Formulário de cadastro/edição de cliente
  ConfirmModal.tsx         — Modal de confirmação genérico
lib/
  supabase.ts              — Cliente Supabase (singleton)
  uploadPhotos.ts          — Upload e deleção de fotos no Storage
  compatibility.ts         — Algoritmo de % de compatibilidade cliente × imóvel
  catalog.ts               — Geração da página HTML pública para o cliente
types/
  index.ts                 — Tipos TypeScript: Client, Property, Broker
```

---

## Funcionalidades Implementadas

### Gestão de Clientes
- Cadastro e edição de perfil completo do comprador (dados pessoais + critérios de busca detalhados)
- Arquivamento de clientes (e seus imóveis) com aviso de que as fotos serão apagadas
- Desarquivamento de clientes
- Status do negócio: `em_andamento`, `fechou`, `nao_fechou`

### Gestão de Imóveis por Cliente
- Cadastro e edição de imóveis (título, tipo, bairro, preço, área, quartos, suítes, banheiros, vagas, condomínio, andar, diferenciais, fotos, link do anúncio, descrição)
- Upload de múltiplas fotos para o bucket `property-photos`
- Deleção de fotos antigas ao editar ou excluir imóvel
- Avaliação por estrelas (1–5) sincronizada com o banco
- Ordenação dos imóveis por: Compatibilidade, Estrelas, Preço (asc/desc), Mais recentes

### Algoritmo de Compatibilidade (`lib/compatibility.ts`)
- Calcula % de compatibilidade entre o perfil de busca do cliente e cada imóvel encontrado
- Usado para ordenação padrão e exibido em todos os cards

### Geração de Conteúdo
- **Página do cliente (`lib/catalog.ts`):** Gera uma página HTML completa e autônoma (Blob URL), com hero, grid de cards, modais de detalhe por imóvel, sistema de avaliação por estrelas persistido em `localStorage`, e rodapé com dados do corretor. Abre em nova aba.
- **PDF individual por imóvel (`app/clientes/[id]/page.tsx → gerarPDF()`):** Gera um HTML para impressão com dados do imóvel, especificações técnicas, fotos em grid, % de compatibilidade e assinatura do corretor. Abre nova aba e dispara `window.print()`.

### PropertyCard
- Card clicável que abre modal interno de detalhe
- Modal com: foto principal, especificações em grid, avaliação por estrelas, galeria de miniaturas clicáveis com zoom (lightbox), link do anúncio, botão de edição
- Lightbox de foto em `z-index: 200` com fechamento por clique fora

---

## Estado Atual do Projeto

### ✅ Funcionando
- Autenticação com Supabase Auth
- Upsert de perfil do corretor em `brokers` com `onConflict: 'user_id'`
- Fluxo de cadastro em 4 passos (wizard)
- Upload de fotos em `lib/uploadPhotos.ts` para bucket `property-photos`
- CRUD completo de clientes e imóveis
- Geração de página pública HTML para o cliente
- Geração de PDF por imóvel individual
- Avaliação por estrelas sincronizada com banco
- Arquivamento e desarquivamento de cliente com deleção de fotos
- Deploy automático na Vercel

### ⚠️ Pendências / Riscos

| Prioridade | Item | Área |
|---|---|---|
| 🔴 ALTA | Verificar e ativar RLS em todas as tabelas | Banco de dados |
| 🔴 ALTA | Configurar políticas de acesso no bucket `property-photos` | Storage |
| 🔴 ALTA | Testar fluxo completo end-to-end em produção | Frontend + Backend |
| 🟡 MÉDIA | Validação de arquivos no upload (tipo MIME + tamanho máx.) | `lib/uploadPhotos.ts` |
| 🟡 MÉDIA | Geração de URLs assinadas para fotos (se bucket privado) | Frontend + Backend |
| 🟡 MÉDIA | Tratamento de erro amigável na UI em todos os passos | Frontend |
| 🟡 MÉDIA | Revisar schema de `properties` e `clients` (constraints, índices) | Banco de dados |
| 🟢 BAIXA | Rodar advisors de performance no Supabase | Banco de dados |
| 🟢 BAIXA | Documentar variáveis de ambiente em `.env.example` | DevOps |

---

## Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Schema Resumido do Banco

### `brokers`
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users.id, UNIQUE |
| nome | text | Nome completo |
| nome_exibicao | text | Nome exibido nos documentos |
| telefone | text | |
| email | text | |
| empresa | text | |
| creci | text | |

### `clients`
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users.id |
| nome | text | |
| telefone | text | |
| email | text | |
| cpf | text | |
| aniversario | date | |
| sexo | text | |
| estado_civil | text | |
| tem_filhos | boolean | |
| quant_filhos | int | |
| prazo | date | |
| tipo_imovel | text | |
| preco_min | numeric | |
| preco_max | numeric | |
| bairro | text | |
| bairros_secundarios | text | |
| tamanho | numeric | m² |
| quartos_min | int | |
| suites_min | int | |
| banheiros_min | int | |
| vagas_min | int | |
| tipo_vaga | text | |
| condominio_max | numeric | |
| pref_andar | boolean | |
| andar_apartir | int | |
| novo | text | indiferente / sim / nao |
| reformado | text | indiferente / sim / nao |
| aceita_financiamento | text | indiferente / sim / nao |
| mobiliado | text | indiferente / sim / nao |
| varanda | text | indiferente / sim / nao |
| area_lazer | text | indiferente / sim / nao |
| aceita_pet | text | indiferente / sim / nao |
| archived | boolean | |
| status_negocio | text | em_andamento / fechou / nao_fechou |
| observacoes | text | |

### `properties`
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users.id |
| client_id | uuid | FK → clients.id |
| titulo | text | |
| endereco | text | Usado como campo "observações" |
| preco | numeric | |
| area | numeric | m² |
| quartos | int | |
| suites | int | |
| banheiros | int | |
| vagas | int | |
| tipo_imovel | text | |
| tipo_vaga_cobertura | text | |
| tipo_vaga_modelo | text | |
| andar | int | |
| condominio | numeric | |
| predio_novo | text | |
| reformado | text | |
| mobiliado | boolean | |
| varanda | boolean | |
| area_lazer | boolean | |
| aceita_pet | boolean | |
| aceita_financiamento | text | |
| bairro | text | |
| descricao | text | |
| favorito | boolean | |
| avaliacao | int | 1–5 |
| fotos | text[] | Array de URLs do Storage |
| archived | boolean | |

---

## Próximos Passos Recomendados

1. **[ALTA] Ativar RLS em `clients`, `properties` e `brokers`**
   - Rodar `get_advisors(security)` no Supabase para identificar tabelas expostas
   - Criar policies: `user_id = auth.uid()`

2. **[ALTA] Configurar bucket `property-photos`**
   - Definir se público ou privado
   - Se privado: implementar `createSignedUrl` para exibição das fotos

3. **[ALTA] Teste end-to-end em produção**
   - Cadastro de corretor → cliente → imóvel com fotos → geração de página → geração de PDF

4. **[MÉDIA] Validação de upload em `lib/uploadPhotos.ts`**
   - Rejeitar arquivos com tipo MIME diferente de `image/*`
   - Limitar tamanho por arquivo (sugestão: 5MB)

5. **[MÉDIA] Melhorar tratamento de erros na UI**
   - Substituir `alert()` por toasts/notificações inline em todos os formulários

6. **[BAIXA] Criar `.env.example`**
   - Documentar todas as variáveis necessárias para novos desenvolvedores

---

*Documento gerado automaticamente com base no código-fonte em 30/05/2026.*
