# CONTEXTO_PROJETO.md - Documentação Técnica

**Projeto:** Corretor Pro  
**Versão:** 0.1.0  
**Stack:** Next.js 16.2.6 + React + TypeScript + Tailwind CSS  
**Última Atualização:** 10/05/2026

---

## 📋 Sumário Executivo

Aplicação de gestão de imóveis e clientes para corretores. Sistema de compatibilidade entre preferências de clientes e propriedades, com geração de catálogos e PDFs.

---

## 🏗️ Arquitetura e Estrutura de Diretórios

```
corretor-pro/
├── app/                          # Next.js App Router
│   ├── admin/page.tsx           # Página de administração
│   ├── arquivados/page.tsx      # Clientes arquivados
│   ├── clientes/                # Gestão de clientes
│   │   ├── page.tsx             # Lista de clientes
│   │   └── [id]/page.tsx        # Detalhe do cliente
│   ├── hooks/                   # Hooks reutilizáveis
│   │   └── useLocalStorage.ts   # Persistência local
│   ├── lib/                     # Utilitários
│   │   ├── catalog.ts           # Geração de catálogos
│   │   └── compatibility.ts     # Cálculo de compatibilidade
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Home
│   └── types/                   # Definições de tipos
│       └── index.ts             # Todas as interfaces
├── components/                   # Componentes React reutilizáveis
│   ├── ClientCard.tsx           # Card de cliente
│   ├── ClientForm.tsx           # Formulário de cliente
│   ├── ConfirmModal.tsx         # Modal de confirmação
│   ├── PropertyCard.tsx         # Card de propriedade
│   ├── PropertyForm.tsx         # Formulário de propriedade
│   └── Sidebar.tsx              # Sidebar de navegação
├── public/                       # Assets estáticos
└── package.json                 # Dependências
```

---

## 📦 Tipos e Interfaces

### 1. **Type: BusinessStatus**
```typescript
type BusinessStatus = 'fechou' | 'nao_fechou' | 'em_andamento';
```
Status de negociação com cliente.
- `'fechou'` - Negócio fechado com sucesso
- `'nao_fechou'` - Cliente não comprou
- `'em_andamento'` - Negociação em curso

---

### 2. **Type: TriState**
```typescript
type TriState = 'sim' | 'nao' | 'indiferente';
```
Tipo para preferências com 3 estados. Usado em:
- Prédio novo
- Reformado
- Aceita financiamento
- Mobiliado
- Varanda
- Área de lazer
- Aceita pet

---

### 3. **Interface: Property**

Representa um imóvel no sistema.

```typescript
interface Property {
  // Identificação
  id: string;                    // UUID ou timestamp string
  clientId: string;              // FK para Client
  createdAt: string;             // ISO date string

  // Informações básicas
  titulo: string;                // Ex: "Apto 3Q Setor Bueno"
  tipoImovel: string;            // Ex: "Apartamento", "Casa", "Cobertura"
  preco: number;                 // Valor em reais (sem formatação)
  bairro: string;                // Ex: "Setor Bueno"
  descricao?: string;            // Descrição detalhada

  // Características físicas
  tamanho?: number;              // Em m²
  quartos?: number;              // Quantidade
  suites?: number;               // Quantidade
  banheiros?: number;            // Quantidade
  vagas?: number;                // Quantidade de garagens
  andar?: number | null;         // Número do andar
  
  // Tipos de vaga
  tipoVaga?: string;             // Ex: "coberta", "descoberta"
  tipoVagaCobertura?: 'coberta' | 'descoberta' | '';
  tipoVagaModelo?: 'individual' | 'gaveta' | '';

  // Amenidades
  condominio?: number | null;    // Valor mensal em reais
  predioNovo?: 'sim' | 'nao' | '';
  reformado?: 'sim' | 'nao' | '';
  aceitaFinanciamento?: 'sim' | 'nao' | '';
  mobiliado?: boolean;
  varanda?: boolean;
  areaLazer?: boolean;
  aceitaPet?: boolean;

  // Mídia e referências
  link?: string;                 // URL do anúncio original
  fotos?: string[];              // URLs ou base64 de imagens
  
  // Estado
  rating?: number;               // 0-100 (compatibilidade)
  favorito?: boolean;
  status?: 'disponivel' | 'vendido' | 'alugado';
  observacoes?: string;
}
```

**Required Fields:** `id`, `clientId`, `titulo`, `tipoImovel`, `preco`, `bairro`, `createdAt`

---

### 4. **Interface: Client**

Representa um cliente no sistema.

```typescript
interface Client {
  // Identificação
  id: string;                         // UUID ou timestamp string
  createdAt: string;                  // ISO date string
  archived: boolean;                  // Soft delete

  // Dados pessoais
  nome: string;                       // Obrigatório
  telefone: string;                   // Obrigatório
  email: string;                      // Email
  cpf: string;                        // CPF do cliente
  aniversario?: string;               // YYYY-MM-DD
  sexo?: string;                      // "Masculino" | "Feminino"
  estadoCivil?: string;               // "Casado(a)", "Solteiro(a)", etc
  temFilhos?: boolean;
  quantFilhos?: number;
  prazo?: string;                     // YYYY-MM-DD (quando encontrar imóvel)

  // Preferências de imóvel - Tipo
  tipoImovel?: string | string[];     // Union: pode ser string ou array
  
  // Preferências de imóvel - Preço
  precoMin?: number;                  // Mínimo em reais
  precoMax?: number;                  // Máximo em reais
  orcamentoMin?: number;              // Orçamento mínimo
  orcamentoMax?: number;              // Orçamento máximo

  // Preferências de imóvel - Localização
  cidadeDesejada?: string;
  bairro?: string;
  bairrosSecundarios?: string;
  bairrosDesejados?: string[];

  // Preferências de imóvel - Características
  tamanho?: number;                   // Ideal em m²
  quartosMin?: number;
  suitesMin?: number;
  banheirosMin?: number;
  vagasMin?: number;
  tipoVaga?: string;                  // Preferência de vaga
  condominioMax?: number;             // Máximo de condomínio
  prefAndar?: boolean;
  andarApartir?: number | null;       // A partir de qual andar

  // Preferências de imóvel - Amenidades (TriState)
  novo?: TriState;                    // Prédio novo
  reformado?: TriState;               // Reformado
  aceitaFinanciamento?: TriState;     // Aceita financiamento
  mobiliado?: TriState;               // Mobiliado
  varanda?: TriState;                 // Varanda/sacada
  areaLazer?: TriState;               // Área de lazer
  aceitaPet?: TriState;               // Aceita pet

  // Relações
  properties?: Property[];            // Imóveis associados

  // Estado
  statusNegocio: BusinessStatus;      // Obrigatório
  observacoes?: string;               // Notas livres do corretor
}
```

**Required Fields:** `id`, `nome`, `telefone`, `email`, `cpf`, `statusNegocio`, `archived`, `createdAt`

---

### 5. **Interface: Broker**

Representa um corretor/agente.

```typescript
interface Broker {
  // Identificação
  id: string;                 // UUID ou timestamp string
  
  // Dados profissionais
  nome: string;               // Obrigatório
  telefone: string;           // Obrigatório
  email?: string;
  empresa?: string;
  creci?: string;             // CRECI (registro profissional)
  ativo?: boolean;
}
```

**Required Fields:** `id`, `nome`, `telefone`

---

## 🔧 Tipos de Dados por Campo

### IDs e Timestamps
- **Padrão:** `String(Date.now())` = timestamp numérico como string
- **Formato:** "1715000000000" (milliseconds desde epoch)
- **Tipo TypeScript:** `string`
- ⚠️ **NUNCA** use `number` para IDs

### Valores Monetários
- **Padrão:** Sem formatação, apenas número puro
- **Tipo:** `number`
- **Exemplo:** `150000` (não "150.000,00")
- **Formatação:** Usar `.toLocaleString('pt-BR', { minimumFractionDigits: 2 })` em UI

### Datas
- **Padrão:** ISO 8601 string ou "YYYY-MM-DD"
- **Tipo:** `string`
- **Exemplo:** "2026-05-10" ou "2026-05-10T12:00:00Z"

### Valores Booleanos vs TriState
- **Boolean:** `mobiliado`, `varanda`, `areaLazer`, `aceitaPet` em Property (não tem "indiferente")
- **TriState:** `novo`, `reformado`, `aceitaFinanciamento` em Client (pode ser "indiferente")

### Arrays vs Single
- **`tipoImovel` em Client:** `string | string[]` (pode ter múltiplos tipos)
- **`tipoImovel` em Property:** `string` (um único tipo)

---

## 📊 Fluxos de Dados Principais

### 1. Gestão de Cliente
```
ClientForm (criar/editar)
  ↓
saveClient() em app/clientes/page.tsx
  ↓
useLocalStorage('clients') atualiza
  ↓
Client[] persistido em localStorage
```

### 2. Gestão de Propriedade
```
PropertyForm (criar/editar)
  ↓
saveProperty() em app/clientes/[id]/page.tsx
  ↓
updateClient() atualiza client.properties[]
  ↓
Client com properties[] atualizado
```

### 3. Cálculo de Compatibilidade
```
calculateCompatibility(client: Client, property: Property)
  ↓
Verifica múltiplos critérios
  ↓
Retorna número 0-100 (percentage)
  ↓
Exibido no PropertyCard
```

### 4. Geração de Catálogo
```
generateClientCatalog(client: Client, broker: Broker)
  ↓
Gera HTML com todas as propriedades
  ↓
Abre em nova aba para impressão
```

---

## 🎯 LocalStorage Schema

```typescript
// Chave: 'clients'
// Tipo: Client[]
[
  {
    id: "1715000000000",
    nome: "João Silva",
    telefone: "(62) 99999-0000",
    email: "joao@example.com",
    cpf: "123.456.789-00",
    properties: [
      {
        id: "1715000001000",
        clientId: "1715000000000",
        titulo: "Apto 3Q Setor Bueno",
        tipoImovel: "Apartamento",
        preco: 350000,
        bairro: "Setor Bueno",
        createdAt: "1715000001000",
        // ... mais campos
      }
    ],
    statusNegocio: "em_andamento",
    archived: false,
    createdAt: "1715000000000"
  }
]

// Chave: 'broker'
// Tipo: Broker
{
  id: "1715000002000",
  nome: "Maria Corretor",
  telefone: "(62) 98888-0000",
  email: "maria@broker.com",
  empresa: "Imóveis Brasil",
  creci: "123456/GO"
}
```

---

## 🔐 Validações Obrigatórias

### Client
- ✅ `nome` não pode estar vazio
- ✅ `telefone` não pode estar vazio
- ✅ `cpf` deve existir (mesmo que vazio em criação)
- ✅ `statusNegocio` é obrigatório (default: "em_andamento")

### Property
- ✅ `clientId` deve corresponder a um Client existente
- ✅ `titulo` não pode estar vazio
- ✅ `preco` deve ser número válido
- ✅ `bairro` não pode estar vazio
- ✅ `tipoImovel` deve estar preenchido

### Broker
- ✅ `id`, `nome`, `telefone` são obrigatórios
- ✅ Usado em `generateClientCatalog()`

---

## ⚠️ Regras de Type Safety

### 1. IDs Sempre String
```typescript
// ❌ NUNCA
const id: number = Date.now();

// ✅ SEMPRE
const id: string = String(Date.now());
```

### 2. Campos Obrigatórios em Constructor
```typescript
// ❌ NUNCA (compilará com erro)
const client: Client = {
  nome: "João",
  // Faltam: id, email, cpf, statusNegocio, archived, createdAt
};

// ✅ SEMPRE
const client: Client = {
  id: String(Date.now()),
  nome: "João",
  email: "joao@example.com",
  cpf: "123.456.789-00",
  statusNegocio: "em_andamento",
  archived: false,
  createdAt: String(Date.now()),
};
```

### 3. Type Narrowing para Union
```typescript
// ❌ NUNCA
const tipo = client.tipoImovel; // string | string[] | undefined
console.log(tipo.toUpperCase()); // Erro em runtime se for array

// ✅ SEMPRE
const tipo = Array.isArray(client.tipoImovel)
  ? client.tipoImovel.join(', ')
  : (client.tipoImovel || '');
```

### 4. Generic Types Explícitos
```typescript
// ❌ NUNCA
const [clients] = useLocalStorage('clients', []);

// ✅ SEMPRE
const [clients] = useLocalStorage<Client[]>('clients', []);
```

### 5. Literals com Casting
```typescript
// ❌ NUNCA
const status: BusinessStatus = userInput; // string

// ✅ SEMPRE
const status: BusinessStatus = userInput as BusinessStatus;
// Ou validar primeiro
if (['fechou', 'nao_fechou', 'em_andamento'].includes(userInput)) {
  const status: BusinessStatus = userInput as BusinessStatus;
}
```

---

## 🚀 Componentes Principais

### ClientForm
- **Props:** `initial?: Partial<Client>`, `onSave`, `onCancel`
- **Estado:** 20+ campos de formulário
- **Behavior:** Cria ou edita cliente

### PropertyForm
- **Props:** `clientId: string`, `initial?: Property`, `onSave`, `onCancel`
- **Estado:** 25+ campos de formulário
- **Features:** Upload de fotos, extração automática de dados

### PropertyCard
- **Props:** `property: Property`, handlers (onEdit, onDelete, onToggleFav, onRating)
- **Display:** Informações da propriedade + compatibilidade
- **Interativo:** Botões de ação

### Sidebar
- **Routes:** Home, Clientes, Arquivados, Admin
- **Style:** Fixed 64px no desktop, colapsável mobile

---

## 📝 Convenções de Código

### Naming
- **Variáveis de estado:** camelCase: `setClients`, `setModal`
- **Interfaces:** PascalCase: `Client`, `Property`, `Broker`
- **Types:** camelCase: `BusinessStatus`, `TriState`
- **Funções:** camelCase: `calculateCompatibility`, `generateClientCatalog`
- **Classes Tailwind:** Sem modificação, conforme Next.js

### Type Annotations
- **Sempre** anotar retorno de função: `function foo(): string`
- **Sempre** anotar parâmetros: `function foo(param: string)`
- **Usar** `Partial<T>` para formas parciais
- **Usar** `?:` para campos opcionais em interfaces

### Imports
```typescript
// ✅ SEMPRE de @/types
import { Client, Property, Broker } from '@/types';

// ✅ SEMPRE especificar generic types
import { useLocalStorage } from '@/hooks/useLocalStorage';
const [data] = useLocalStorage<Client[]>('key', []);
```

---

## 🔄 Ciclo de Vida

### Criação de Cliente
1. Usuário clica "Novo Cliente"
2. `ClientForm` abre com `emptyClient` default
3. Usuário preenche campos
4. `handleSubmit` gera `id: String(Date.now())` e `createdAt`
5. `saveClient()` atualiza `clients[]` em localStorage
6. Modal fecha, lista atualiza

### Adição de Propriedade
1. Usuário abre detalhe cliente
2. Clica "Adicionar Imóvel"
3. `PropertyForm` abre com `clientId` do cliente
4. Usuário preenche ou "extrai de anúncio"
5. `handleSubmit` cria `Property` com `clientId` e timestamps
6. `saveProperty()` adiciona ao `client.properties[]`
7. Modal fecha, lista de imóveis atualiza

### Cálculo e Exibição de Compatibilidade
1. Imóvel adicionado ao cliente
2. `PropertyCard` renderiza
3. Calcula `calculateCompatibility(client, property)` → 0-100
4. Exibe como "XXX% Compatibilidade"
5. Atualiza em tempo real em seleção

---

## 📦 Dependências Críticas

```json
{
  "next": "16.2.6",
  "react": "19.0.0-rc-66855b96-20250101",
  "typescript": "5.7.3",
  "tailwindcss": "3.4.0",
  "lucide-react": "latest",
  "uuid": "latest"
}
```

---

## ✅ Checklist para Implementações

Antes de fazer qualquer modificação:

- [ ] Verificar tipos em `types/index.ts`
- [ ] Confirmar campos obrigatórios vs opcionais
- [ ] Se manipular ID: usar `String(Date.now())`
- [ ] Se usar union type: fazer type narrowing
- [ ] Se usar generic: especificar `<TipoExplicito>`
- [ ] Rodar `npm run build` antes de commitar
- [ ] Validar `npx tsc --noEmit` passa sem erros

---

## 🐛 Erros Comuns (e como evitar)

| Erro | Causa | Solução |
|------|-------|---------|
| Type mismatch string/number | Converter ID com `Number()` | Use `String(Date.now())` |
| Missing required property | Constructor incompleto | Incluir todos os `required` fields |
| Type union narrowing error | Acessar `string \| string[]` sem check | Usar `Array.isArray()` |
| Generic type inference erro | `useLocalStorage('key', [])` sem tipo | Especificar `<Client[]>` |
| Property does not exist | Renomear field sem update global | Find All References → Replace All |

---Não adicione anotações de retorno como : JSX.Element em componentes React/Next sem garantir que o namespace JSX esteja disponível no ambiente TypeScript. Em projetos Next.js modernos com React 19, é mais seguro deixar o tipo ser inferido pelo compilador ou usar React.ReactElement com a importação adequada.
Import paths incorretos: A IA usou imports como @/app/types, @/app/hooks/useLocalStorage, @/app/lib/compatibility, @/app/lib/catalog quando deveria usar @/types, @/hooks/useLocalStorage, @/lib/compatibility, @/lib/catalog.

Arquivos de tipos duplicados: A IA criou dois arquivos index.ts - um em types (correto) e outro em /app/types/ (incorreto), causando conflitos de tipos.

Inconsistência na estrutura de tipos: O arquivo /app/types/index.ts tinha uma definição simplificada de Property com campos obrigatórios (endereco, area, tipoGaragemCobertura, tipoGaragemModelo) que não existiam na versão principal em index.ts.

Soluções aplicadas:
Correção de imports: Todos os imports foram ajustados para usar os paths corretos sem app para arquivos na raiz do projeto.

Remoção de arquivos duplicados: O diretório /app/types/ foi removido para evitar conflitos.

Padronização de tipos: O projeto agora usa apenas a definição completa de tipos em index.ts.

Lição aprendida:
Sempre verifique a estrutura de diretórios do projeto antes de criar imports
Evite criar arquivos duplicados em locais incorretos
Mantenha consistência na definição de tipos em todo o projeto
Execute builds frequentes para detectar erros de tipos precocemente
**Documento atualizado:** 10/05/2026 às 14:30  
**Responsável:** GitHub Copilot  
**Próxima revisão:** Após grandes mudanças de schema


---

## ✅ Funcionalidades Implementadas em 10/05/2026

### PropertyCard.tsx
- Card agora abre modal de detalhes completos ao clicar
- Estrelas funcionando no card e dentro do modal

### app/clientes/[id]/page.tsx
- Botão "Gerar PDF" funcionando por imóvel (função gerarPDF corrigida)
- useEffect sincroniza estrelas do cliente com a página do corretor via localStorage
- Estrutura de pastas corrigida: app/clientes/page.tsx (lista) e app/clientes/[id]/page.tsx (detalhe)

### app/clientes/page.tsx
- Criada do zero como lista de clientes com busca
- onView navega corretamente para /clientes/[id]

### lib/catalog.ts
- Estrelas persistem no localStorage da página do cliente (chave: ratings_[clientId])
- Botão PDF funcional dentro da página gerada para o cliente

### Regra de imports confirmada
- @/types (NÃO @/app/types)
- @/hooks/useLocalStorage (NÃO @/app/hooks/...)
- @/lib/compatibility e @/lib/catalog (NÃO @/app/lib/...)
