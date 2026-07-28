# Banco de dados — Corretor Pro

Fonte: migrations em `supabase/migrations/`, snippets em `supabase/snippets/`, e uso real no código TypeScript.

> **Atenção:** o schema de produção no Supabase pode estar **à frente** das migrations versionadas. O código é a melhor evidência dos campos efetivamente usados.

## Entidades principais

### `clients`
Preferências e dados do comprador, tenancy por `user_id`.

| Campo (DB) | Uso no app |
|------------|------------|
| `id` uuid | PK |
| `user_id` uuid | dono (corretor) |
| `created_at` | auditoria |
| `nome`, `telefone`, `email`, `cpf` | pessoais |
| `aniversario`, `sexo`, `estado_civil`, `tem_filhos`, `quant_filhos`, `prazo` | pessoais estendidos |
| `tipo_imovel`, `preco_min`, `preco_max`, `bairro`, `bairros_secundarios` | preferências |
| `tamanho`, `quartos_min`, `suites_min`, `banheiros_min`, `vagas_min`, `tipo_vaga` | características |
| `pref_andar`, `andar_apartir`, `condominio_max` | preferências |
| `novo`, `reformado`, `mobiliado`, `varanda`, `area_lazer`, `aceita_pet`, `aceita_financiamento` | TriState text |
| `observacoes`, `status_negocio`, `archived` | estado |

### `properties`
Imóveis ligados a um cliente.

| Campo (DB) | Uso no app |
|------------|------------|
| `id`, `client_id`, `user_id`, `created_at` | identidade / tenancy |
| `titulo`, `endereco`, `preco`, `area`, `bairro`, `descricao` | básicos |
| `quartos`, `suites`, `banheiros`, `vagas`, `andar` | físicos |
| `tipo_imovel`, `tipo_vaga_cobertura`, `tipo_vaga_modelo` | classificação |
| `condominio`, `predio_novo`, `reformado`, `mobiliado`, `varanda`, `area_lazer`, `aceita_pet`, `aceita_financiamento` | amenidades |
| `favorito`, `avaliacao`, `fotos` (jsonb), `archived` | estado / mídia |

### `brokers`
Perfil do corretor (`user_id` único ↔ `auth.users`).

Campos usados: `nome`, `nome_exibicao`, `telefone`, `email`, `empresa`, `creci`, `plano`, `ativo`.

### `broker_invites`
Allowlist de registro. Acesso direto bloqueado por RLS; mutação admin via **service role** na API; checagem pública via RPC `is_broker_invited` / `consume_broker_invite`.

## Relações

```
auth.users 1──1 brokers (user_id)
auth.users 1──* clients (user_id)
clients 1──* properties (client_id)
auth.users 1──* properties (user_id)
broker_invites.email ── registro permitido
```

## Tenancy, ownership e permissões

- **Modelo:** cada corretor só enxerga linhas com `user_id = auth.uid()`.
- **App:** todas as queries client filtram `.eq('user_id', user.id)` além do filtro por id.
- **RLS:** migrations base só fazem `enable row level security` em `clients`/`properties` **sem** policies versionadas completas no repo. Snippet 568 documenta policies de `brokers` e bloqueio de `broker_invites`.
- **Admin:** e-mail fixo validado na API; usa service role para CRUD de convites.

## Storage

- Bucket operacional no código: **`property-photos`** (público para leitura via URL).
- Migration legada cria `property-images` — alinhar no painel Supabase se ainda divergir.
- Path: `property-photos/{propertyId}/{propertyId}-{index}-{ts}.jpg`.

## Riscos se schema/policies estiverem incompletos

1. Tabelas sem policy → acesso negado ou (pior) aberto demais.
2. Falta de `user_id` NOT NULL / default → vazamento cruzado se app errar filtro.
3. Storage INSERT autenticado sem amarrar pasta ao `auth.uid()` → abuso de quota.
4. RPCs e triggers de criação de `brokers` só existem no remoto.
5. Campos usados no TS e ausentes no DB → erro em runtime no insert/update.

**Pré-condição operacional:** revisar no dashboard Supabase se RLS de `clients`, `properties`, `brokers`, `broker_invites` e policies do bucket batem com o tenancy acima.
