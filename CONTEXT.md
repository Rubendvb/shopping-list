# Contexto do Projeto — ListaFácil

## O que é

Aplicativo web de gerenciamento de listas de compras. Single-user, sem autenticação, sem backend. Todos os dados ficam no localStorage do navegador via Zustand.

**Funcionalidades implementadas:**

- CRUD de listas de compras com orçamento
- CRUD de itens por lista (nome, quantidade, unidade, preço estimado, preço real, categoria, prioridade, notas)
- Marcar itens como comprados
- Filtro por categoria, status (comprado/pendente) e busca por nome
- Ordenação por prioridade, nome ou categoria
- Controle de orçamento com alerta visual quando ultrapassa
- Concluir lista → salva snapshot no histórico
- Histórico de compras com comparação estimado vs real
- Estatísticas: gastos por categoria, gráfico mensal, itens mais comprados, sugestões inteligentes
- Categorias padrão + categorias personalizadas
- Dark mode (next-themes)
- Layout responsivo com sidebar (mobile: hamburger menu)

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
        ├── utils.ts                # cn(), formatCurrency()
        └── categories.ts           # DEFAULT_CATEGORIES (IDs estáveis)
```

---

## Store Zustand (`use-app-store.ts`)

Chave localStorage: `"listafacil-storage"`

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
  unit?: string
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

---

## Decisões de design notáveis

- **Frontend-only:** sem backend elimina necessidade de PostgreSQL, Docker, variáveis de ambiente e setup local complexo.
- **Zustand persist:** serialização/desserialização automática via `createJSONStorage(() => localStorage)`.
- **IDs estáveis em categorias padrão:** `cat-mercado`, `cat-padaria`, etc. evitam duplicação ao reinicializar o store.
- **PurchaseHistory como snapshot imutável:** ao concluir lista, `itemsSummary` preserva nome, preços e categoria de cada item — dados ficam acessíveis mesmo se a lista for deletada depois.
- **Sem autenticação:** app single-user, dados locais por definição.
