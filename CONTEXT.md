# Contexto do Projeto — ListaFácil

## O que é

Aplicativo web de gerenciamento de listas de compras. Single-user, sem autenticação, sem backend. Todos os dados ficam no localStorage do navegador via Zustand.

**Funcionalidades implementadas:**

- CRUD de listas de compras com orçamento
- CRUD de itens por lista (nome, quantidade, unidade, preço estimado, preço real, categoria, prioridade, notas)
- Edição de itens via dialog com todos os campos (incluindo preço real e notas)
- Marcar itens como comprados
- Filtro por categoria, status (comprado/pendente) e busca por nome
- Ordenação por prioridade, nome ou categoria
- Controle de orçamento com barra colorida (verde/laranja/vermelho) e mensagem de status
- Concluir lista → salva snapshot no histórico
- Histórico de compras com comparação estimado vs real
- Estatísticas: gastos por categoria, gráfico mensal, itens mais comprados, sugestões inteligentes
- 12 categorias padrão baseadas em seções de supermercado + categorias personalizadas
- Dark mode (next-themes)
- Layout responsivo com sidebar (mobile: hamburger menu)
- Botões de ação sempre visíveis no mobile, hover no desktop

---

## Stack

| Camada                | Tecnologia                                       | Versão |
| --------------------- | ------------------------------------------------ | ------ |
| Framework             | Next.js (App Router)                             | 16.x   |
| Linguagem             | TypeScript                                       | 5.x    |
| Estilização           | Tailwind CSS                                     | v4     |
| Estado / Persistência | Zustand + `persist` middleware                   | v5     |
| UI primitivos         | Radix UI (direto, sem shadcn CLI)                | —      |
| Ícones                | lucide-react                                     | —      |
| Tema                  | next-themes                                      | —      |
| Utilitários CSS       | clsx + tailwind-merge + class-variance-authority | —      |

**Sem:** banco de dados, API routes, autenticação, Docker, variáveis de ambiente.

---

## Estrutura de arquivos

```
shopping-list/
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout: ThemeProvider
    │   ├── page.tsx                # Redireciona para /dashboard
    │   ├── globals.css             # Variáveis CSS de tema (light/dark) + Tailwind
    │   └── dashboard/
    │       ├── layout.tsx          # Layout com <Sidebar>
    │       ├── page.tsx            # Home: cards de resumo + listas recentes
    │       ├── listas/
    │       │   ├── page.tsx        # Wrapper → <ListsClient>
    │       │   ├── lists-client.tsx
    │       │   └── [id]/
    │       │       ├── page.tsx    # Wrapper → <ListDetailClient listId={id}>
    │       │       └── list-detail-client.tsx
    │       ├── estatisticas/
    │       │   └── page.tsx
    │       ├── historico/
    │       │   └── page.tsx
    │       └── categorias/
    │           ├── page.tsx        # Wrapper → <CategoriesClient>
    │           └── categories-client.tsx
    ├── components/
    │   ├── sidebar.tsx             # Navegação lateral (mobile-friendly)
    │   ├── theme-toggle.tsx        # Botão light/dark
    │   └── ui/                     # Primitivos de UI (construídos manualmente sobre Radix)
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── checkbox.tsx
    │       ├── currency-input.tsx      # Input com máscara R$ — value/onChange em centavos
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── progress.tsx
    │       ├── select.tsx
    │       ├── tabs.tsx
    │       └── toast.tsx
    ├── store/
    │   └── use-app-store.ts        # Zustand store com persist → localStorage
    ├── hooks/
    │   └── use-mounted.ts          # Retorna true só após mount no client
    ├── types/
    │   └── index.ts                # Tipos compartilhados: List, Item, Category, PurchaseHistory
    └── lib/
        ├── utils.ts                # cn(), formatCurrency(), parseCurrencyToCents()
        ├── units.ts                # Unit, UNITS, normalizeUnit(), unitAbbr()
        └── categories.ts           # DEFAULT_CATEGORIES (IDs estáveis)
```

---

## Store Zustand (`use-app-store.ts`)

Chave localStorage: `"listafacil-storage"` · Versão atual: `1`

**Estado:**

```ts
lists: List[]
items: Item[]
categories: Category[]
history: PurchaseHistory[]
```

**Actions:**

| Action                                     | Descrição                                                   |
| ------------------------------------------ | ----------------------------------------------------------- |
| `addList({ name, description?, budget? })` | Cria lista, retorna `id`                                    |
| `updateList(id, data)`                     | Atualiza campos parciais de uma lista                       |
| `deleteList(id)`                           | Remove lista + itens associados + histórico                 |
| `completeList(id)`                         | Cria `PurchaseHistory` snapshot e marca `isCompleted: true` |
| `addItem({ listId, name, ... })`           | Adiciona item à lista                                       |
| `updateItem(id, data)`                     | Atualiza item (inclui `isPurchased`, `actualPrice`)         |
| `deleteItem(id)`                           | Remove item                                                 |
| `addCategory({ name, icon?, color? })`     | Cria categoria personalizada                                |
| `deleteCategory(id)`                       | Remove categoria personalizada (padrões são protegidas)     |

**Migração:** a função `migrate(persisted, fromVersion)` no persist config é executada automaticamente quando o usuário tem dados de versão anterior. v0 → v1: renomeia "Mercado" → "Mercearia" (mantendo o ID `cat-mercado`) e insere `cat-congelados` / `cat-utilidades`. Para mudanças futuras: incrementar `version` e estender `migrate`.

---

## Tipos principais (`types/index.ts`)

```ts
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface List {
  id: string
  name: string
  description?: string
  budget?: number // centavos (R$ × 100)
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface Item {
  id: string
  listId: string
  name: string
  quantity: number
  unit?: Unit  // 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'CX' | 'PCT'
  estimatedPrice?: number
  actualPrice?: number // centavos
  categoryId?: string
  priority: Priority
  isPurchased: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

interface PurchaseHistory {
  id: string
  listId: string
  listName: string
  totalEstimated: number
  totalActual: number // centavos
  itemCount: number
  itemsSummary: ItemSummary[]
  completedAt: string
}
```

---

## Padrão de componentes

Todas as páginas são Client Components (`"use client"`). Nenhuma busca dados no servidor.

```
dashboard/listas/page.tsx          ← wrapper simples
  └── <ListsClient />              ← "use client", lê do useAppStore
```

Páginas com rota dinâmica (`[id]`) recebem o ID via `useParams()` e passam para o client component.

---

## Guard de hidratação

Todo componente que lê do store usa `useMounted()`:

```ts
const mounted = useMounted()
if (!mounted) return null
```

Isso evita flash de dados do localStorage no render do servidor.

---

## Temas e Estilização

**Tailwind CSS v4** — sem `tailwind.config.js`. Configuração via `@theme inline` em `globals.css`.

Componentes referenciam variáveis CSS diretamente:

```tsx
className = 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]'
```

**Dark mode:** `next-themes` com `attribute="class"`. O `<html>` precisa de `suppressHydrationWarning`.

---

## Regra de dinheiro

Todos os preços são **inteiros em centavos** no store. `R$ 9,99 → 999`.

- Store actions aceitam reais (float) e convertem internamente com `Math.round(value * 100)`
- `formatCurrency(cents)` em `src/lib/utils.ts` formata para exibição
- `<CurrencyInput>` emite centavos; na chamada ao store divida por 100: `estimatedPrice: price / 100`

---

## Unidades de medida

Campo `unit` do item usa o tipo `Unit = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'CX' | 'PCT'` de `lib/units.ts`.

- `normalizeUnit(raw)` — converte valores legados (texto livre) para o código tipado
- `unitAbbr(unit)` — retorna a abreviação de exibição (`'kg'`, `'L'`, etc.)
- Exibição: `normalizeUnit(item.unit) ? unitAbbr(normalizeUnit(item.unit)!) : 'x'`

---

## Botões de ação responsivos

Ícones de editar/excluir em cards de item usam o padrão:

```
opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity
```

Mobile (`< md`): sempre visível, área de toque `h-10 w-10` (40 px).  
Desktop (`≥ md`): aparece no hover, tamanho padrão do ícone.  
Sempre incluir `aria-label` em botões com apenas ícone.

---

## Categorias padrão (`lib/categories.ts`)

12 categorias com IDs estáveis, ordenadas pelo fluxo natural de um supermercado:

| ID | Nome | Ícone |
|---|---|---|
| `cat-hortifruti` | Hortifruti | 🥦 |
| `cat-acougue` | Açougue | 🥩 |
| `cat-padaria` | Padaria | 🍞 |
| `cat-frios` | Frios e Laticínios | 🧀 |
| `cat-mercado` | Mercearia | 🥫 |
| `cat-congelados` | Congelados | 🧊 |
| `cat-bebidas` | Bebidas | 🥤 |
| `cat-limpeza` | Limpeza | 🧹 |
| `cat-higiene` | Higiene Pessoal | 🧴 |
| `cat-utilidades` | Utilidades | 🏠 |
| `cat-eletronicos` | Eletrônicos | 💻 |
| `cat-outros` | Outros | 📦 |

`cat-mercado` mantém o ID original para compatibilidade retroativa (era "Mercado" até v0 do store).

---

## Decisões de design notáveis

- **Frontend-only:** sem backend elimina necessidade de PostgreSQL, Docker, variáveis de ambiente e setup local complexo.
- **Zustand persist:** serialização/desserialização automática via `createJSONStorage(() => localStorage)`.
- **IDs estáveis em categorias padrão:** `cat-hortifruti`, `cat-mercado`, etc. evitam duplicação ao reinicializar o store. `cat-mercado` mantém o ID mesmo após ser renomeado para "Mercearia" — itens antigos não perdem a categoria.
- **PurchaseHistory como snapshot imutável:** ao concluir lista, `itemsSummary` preserva nome, preços e categoria de cada item — dados ficam acessíveis mesmo se a lista for deletada depois.
- **Sem autenticação:** app single-user, dados locais por definição.
