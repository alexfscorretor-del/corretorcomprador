# Relatório Técnico: Erros de Modificação de Código

**Data:** 10/05/2026  
**Projeto:** corretor-pro (Next.js 16.2.6 + TypeScript)  
**Status Final:** ✅ Build compilada com sucesso

---

## Resumo de Erros Identificados e Corrigidos

A IA realizou modificações que introduziram **5 erros de tipo (Type Errors)** durante a compilação TypeScript. Abaixo estão os erros, suas causas raízes e as correções aplicadas.

---

## Erros e Soluções

### 1. **Type Mismatch em Comparação de ID (Route Param)**

**Arquivo:** `app/clientes/[id]/page.tsx:91`  
**Erro Original:**
```typescript
const client = clients.find(c => c.id === Number(id));
```

**Problema:** 
- `c.id` é do tipo `string` (conforme definido em `types/index.ts`)
- `Number(id)` retorna `number`
- Comparação entre `string` e `number` sempre falsa → **incompatibilidade de tipo**

**Correção Aplicada:**
```typescript
const client = clients.find(c => c.id === id);
```

**Lição:** Route parameters do Next.js.js retornam `string`. Nunca converta para `Number` se o tipo definido for `string`. Mantenha coerência com a definição de tipo na interface.

---

### 2. **Type Mismatch em Union Type Não Tratado**

**Arquivo:** `app/clientes/[id]/page.tsx:135`  
**Erro Original:**
```typescript
const infoItems: [string, string | number][] = [
  ...
  ['Tipo de Imóvel', client.tipoImovel || '-'],
  ...
];
```

**Problema:**
- `client.tipoImovel` é definido como `string | string[]` em `Client`
- Array `infoItems` espera `string | number`
- Tipo `string[]` não é compatível com `string | number` → **type overlap failure**

**Correção Aplicada:**
```typescript
['Tipo de Imóvel', Array.isArray(client.tipoImovel) ? client.tipoImovel.join(', ') : (client.tipoImovel || '-')],
```

**Lição:** Sempre verifique e normalize tipos union. Se um campo pode ser `string | string[]`, trate ambos os casos antes de usar em contexto tipado diferente. Use `Array.isArray()` para discriminação de tipo.

---

### 3. **Property Não Encontrada em Tipo**

**Arquivo:** `app/clientes/[id]/page.tsx:188`  
**Erro Original:**
```typescript
{client.obs && (
  <div>...</div>
)}
```

**Problema:**
- O tipo `Client` define a propriedade como `observacoes: string | undefined`
- Código tentava acessar `obs` que não existe
- **Property access on non-existent member**

**Correção Aplicada:**
```typescript
{client.observacoes && (
  <div>...</div>
)}
```

**Lição:** Após alterações em definições de tipo (refatoração de nomes de propriedades), sempre busque referências antigas em TODO o codebase. Use "Find and Replace" em toda a workspace, não apenas em um arquivo.

---

### 4. **Tipo Genérico Sem Especificação + Missing Required Property**

**Arquivo:** `app/clientes/[id]/page.tsx:86`  
**Erro Original:**
```typescript
const [broker] = useLocalStorage('broker', { nome: 'Corretor', telefone: '' });
```

**Problema:**
- `useLocalStorage` não tinha tipagem: `useLocalStorage<T>` não especificado
- Objeto padrão não continha `id: string` obrigatório em `Broker`
- Função `generateClientCatalog()` espera tipo `Broker` com `id`
- **Missing required property error**

**Correção Aplicada:**
```typescript
const [broker] = useLocalStorage<Broker>('broker', { id: '', nome: 'Corretor', telefone: '' });
// + Adicionado Broker na importação
import { Client, Property, Broker } from '@/types';
```

**Lição:** 
- Sempre especifique tipos genéricos explicitamente: `useLocalStorage<TipoEsperado>(...)`
- Nunca forneça valores padrão parciais. Inclua todos os campos obrigatórios
- Importe e use tipos do `@/types` quando trabalhar com hooks/funções tipadas

---

### 5. **Type Mismatch em Constructor + Missing Required Fields**

**Arquivo:** `components/PropertyForm.tsx:92-99`  
**Erro Original:**
```typescript
const prop: Property = {
  id: initial?.id || Date.now(),  // ❌ number | undefined
  titulo: titulo || 'Imóvel sem título',
  tipoImovel, bairro, link, descricao,
  preco: parseMoeda(precoStr),
  // ❌ Faltam clientId e createdAt obrigatórios
  ...
};
```

**Problemas:**
1. `Date.now()` retorna `number`, mas `Property.id` é `string` → **type mismatch**
2. Campos obrigatórios `clientId: string` e `createdAt: string` não fornecidos → **missing required property**
3. Props `predioNovo`, `reformado`, `aceitaFinanciamento` com tipo genérico `string` em vez de literal union → **literal type assignment error**

**Correção Aplicada:**
```typescript
const prop: Property = {
  id: initial?.id || String(Date.now()),           // ✅ String
  clientId,                                         // ✅ Required field
  titulo: titulo || 'Imóvel sem título',
  tipoImovel, bairro, link, descricao,
  preco: parseMoeda(precoStr),
  createdAt: initial?.createdAt || String(Date.now()), // ✅ Required field
  tamanho: parseFloat(tamanho) || 0,
  // ...
  predioNovo: predioNovo as Property['predioNovo'],     // ✅ Cast to literal
  reformado: reformado as Property['reformado'],         // ✅ Cast to literal
  aceitaFinanciamento: aceitaFinanciamento as Property['aceitaFinanciamento'],
  mobiliado, varanda, areaLazer, aceitaPet,
  fotos, rating: initial?.rating || 0, favorito: initial?.favorito || false,
};
```

**Lição:**
- `Date.now()` sempre retorna `number`. Use `String(Date.now())` quando precisar de `string`
- Nunca omita campos obrigatórios. Verifique a interface completa antes de instanciar
- Para union literal types (`'sim' | 'nao' | ''`), use `as Type['property']` casting quando o estado for tipado genericamente

---

### 6. **Type de Propriedade Alterado Incorretamente**

**Arquivo:** `components/PropertyForm.tsx` (Props interface)  
**Erro Original:**
```typescript
interface Props {
  clientId: number;  // ❌ Deveria ser string
  ...
}
```

**Problema:**
- `Client.id` é `string`
- Ao passar `clientId={client.id}`, há mismatch
- **Argument type mismatch**

**Correção Aplicada:**
```typescript
interface Props {
  clientId: string;  // ✅ Correto
  ...
}
```

**Lição:** IDs de entidades devem ser consistentemente tipados como `string` em toda a aplicação (UUID, timestamp strings, etc). Nunca mude de `string` para `number` ou vice-versa sem atualizar TODOS os pontos de uso.

---

## Padrões de Erro: O Que NÃO Fazer

### ❌ Anti-Padrão #1: Type Narrowing Inadequado
```typescript
// ❌ ERRADO
const value = someProperty; // pode ser string | string[] | undefined
const result = `${value}`; // compilará, mas pode gerar bugs

// ✅ CORRETO
const result = Array.isArray(value) 
  ? value.join(', ') 
  : (value || 'fallback');
```

### ❌ Anti-Padrão #2: Mudança de Tipo Sem Propagação
```typescript
// ❌ ERRADO
// types/index.ts: mudei obs -> observacoes
// Mas esqueço de atualizar em:
// - app/clientes/page.tsx ❌
// - app/clientes/[id]/page.tsx ❌
// - components/ClientForm.tsx ❌

// ✅ CORRETO
// Após refatoração de nome:
// 1. Use "Find All References" (Ctrl+Shift+H)
// 2. Replace em TODOS os arquivos
// 3. Rode `npm run build` antes de commitar
```

### ❌ Anti-Padrão #3: Constructor Incompleto
```typescript
// ❌ ERRADO
const user: User = {
  name: 'João',
  // Esqueci email obrigatório
};

// ✅ CORRETO
const user: User = {
  id: String(Date.now()),
  name: 'João',
  email: 'joao@example.com',
  createdAt: new Date().toISOString(),
  // ... todos os required fields
};
```

### ❌ Anti-Padrão #4: Conversão de Tipo Inconsistente
```typescript
// ❌ ERRADO
const id1 = Date.now();        // number
const id2 = String(Date.now()); // string
// Depois tenta comparar id1 === id2 → sempre false

// ✅ CORRETO
const id = String(Date.now()); // sempre string
// Use em todo lugar como string
```

### ❌ Anti-Padrão #5: Generic Sem Type Parameter
```typescript
// ❌ ERRADO
const [state] = useLocalStorage('key', defaultValue);
// TypeScript infere como unknown ou any

// ✅ CORRETO
const [state] = useLocalStorage<MyType>('key', defaultValue);
// TypeScript garante MyType inferido corretamente
```

---

## Checklist para Modificações de Código

Antes de fazer qualquer alteração em tipos, interfaces ou estruturas de dados:

- [ ] **Rodar `npm run build` ANTES da mudança** para ter baseline
- [ ] **Verificar a interface/tipo completo** (todos os required fields)
- [ ] **Usar "Find All References"** quando renomear propriedades
- [ ] **Validar coerência de tipos**: se `id: string`, use `string` em TODOS os lugares
- [ ] **Testar type narrowing**: se `tipo: string | string[]`, sempre verificar com `Array.isArray()`
- [ ] **Incluir todos os required fields** em construtores de tipo
- [ ] **Usar `String(Date.now())` não `Date.now()`** quando o campo espera `string`
- [ ] **Especificar type parameters explicitamente**: `useLocalStorage<Tipo>(...)`
- [ ] **Rodar `npm run build` APÓS a mudança** para validação final
- [ ] **Não confiar em inferência de tipo** para literais e unions (`'sim' | 'nao'`)

---

## Resumo de Correções

| Arquivo | Linha | Erro | Solução |
|---------|-------|------|---------|
| `app/clientes/[id]/page.tsx` | 91 | `Number(id)` vs `string` | Remover `Number()` |
| `app/clientes/[id]/page.tsx` | 135 | `string \| string[]` em campo tipado | `Array.isArray()` narrowing |
| `app/clientes/[id]/page.tsx` | 188 | `obs` vs `observacoes` | Renomear propriedade |
| `app/clientes/[id]/page.tsx` | 86 | Missing `Broker` type e `id` | Adicionar type parameter e field |
| `components/PropertyForm.tsx` | 92 | `Date.now()` retorna number | `String(Date.now())` |
| `components/PropertyForm.tsx` | 92-99 | Missing `clientId` e `createdAt` | Adicionar campos obrigatórios |
| `components/PropertyForm.tsx` | 106 | String literal union casting | `as Property['field']` |
| `components/PropertyForm.tsx` | 7 | `clientId: number` vs `string` | Mudar para `string` |

---

## Build Status Final

✅ **Compilação:** Sucesso  
✅ **TypeScript Check:** Sucesso  
✅ **Routes Geradas:** 6 (static + dynamic)  
✅ **Sem Warnings:** Sim  

**Tempo de Build:** 3.3-3.8s (normal)

