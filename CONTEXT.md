# Contexto do Projeto — ListaFácil

## O que é

Aplicativo web de gerenciamento de listas de compras. Single-user, sem autenticação, sem backend. Todos os dados ficam no localStorage do navegador via Zustand.

**Funcionalidades implementadas:**

- CRUD de listas de compras com orçamento
- CRUD de itens por lista (nome, quantidade, unidade, preço estimado, preço real, categoria, prioridade, notas)
- Edição de itens via dialog com todos os campos (incluindo preço real e notas)
- Marcar itens como comprados
- Filtro por categoria, status (comprado/pendente) e busca por nome
- Ordenação por prioridade, nome, categoria ou **manual (drag & drop)**
- Controle de orçamento com barra colorida (verde/laranja/vermelho) e mensagem de status
- Concluir lista → salva snapshot no histórico (com validação para listas sem itens comprados)
- Histórico de compras com cards expansíveis e detalhamento completo
- Estatísticas: gastos por categoria, gráfico mensal, itens mais comprados, sugestões inteligentes com ação de adicionar
- 12 categorias padrão baseadas em seções de supermercado + categorias personalizadas
- Dark mode (next-themes)
- Layout responsivo com sidebar (mobile: hamburger menu)
- Badge de contagem de listas ativas na sidebar
- Modo de compras (exibe apenas checkbox + nome, oculta formulários e filtros)
- Duplicar lista (cópia com itens, `isPurchased: false`)
- Templates de lista pré-configurados (Mercado, Churrasco, Faxina, Festa)
- Compartilhar lista como texto (Web Share API + fallback clipboard)
- Exportar/importar dados como JSON (backup)
- PWA: app instalável (`manifest.webmanifest`, ícones, `apple-touch-icon`)
- Filtro de período nas estatísticas (último mês, 3 meses, 6 meses, ano, tudo)

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
| Drag & Drop           | @dnd-kit/core + @dnd-kit/sortable                | —      |
| Utilitários CSS       | clsx + tailwind-merge + class-variance-authority | —      |

**Sem:** banco de dados, API routes, autenticação, Docker, variáveis de ambiente.

---

## Estrutura de arquivos

```
shopping-list/
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout: ThemeProvider + metadata PWA
    │   ├── icon.tsx                # Favicon 32×32 via ImageResponse
    │   ├── manifest.ts             # PWA manifest (MetadataRoute.Manifest)
    │   ├── page.tsx                # Redireciona para /dashboard
    │   ├── globals.css             # Variáveis CSS de tema (light/dark) + Tailwind
    │   └── dashboard/
    │       ├── layout.tsx          # Layout com <Sidebar> + <Toaster>
    │       ├── page.tsx            # Home: cards de resumo + listas recentes
    │       ├── listas/
    │       │   ├── page.tsx        # Wrapper → <ListsClient>
    │       │   ├── lists-client.tsx        # CRUD de listas + templates
    │       │   └── [id]/
    │       │       ├── page.tsx    # Wrapper → <ListDetailClient listId={id}>
    │       │       └── list-detail-client.tsx  # Detalhe da lista, itens, drag & drop
    │       ├── estatisticas/
    │       │   └── page.tsx        # Estatísticas com filtro de período
    │       ├── historico/
    │       │   └── page.tsx        # Histórico com cards expansíveis
    │       ├── categorias/
    │       │   ├── page.tsx        # Wrapper → <CategoriesClient>
    │       │   └── categories-client.tsx
    │       └── configuracoes/
    │           └── page.tsx        # Exportar/importar JSON
    ├── components/
    │   ├── sidebar.tsx             # Navegação lateral (mobile-friendly) + badge de contagem
    │   ├── theme-toggle.tsx        # Botão light/dark
    │   └── ui/                     # Primitivos de UI (construídos manualmente sobre Radix)
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── checkbox.tsx
    │       ├── confirm-dialog.tsx      # AlertDialog reutilizável (substitui window.confirm)
    │       ├── currency-input.tsx      # Input com máscara R$ — value/onChange em centavos
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx       # DropdownMenu (@radix-ui/react-dropdown-menu)
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── progress.tsx
    │       ├── select.tsx
    │       ├── tabs.tsx
    │       ├── toast.tsx
    │       └── toaster.tsx             # Renderiza toasts ativos (montado em dashboard/layout.tsx)
    ├── store/
    │   └── use-app-store.ts        # Zustand store com persist → localStorage
    ├── hooks/
    │   ├── use-mounted.ts          # Retorna true só após mount no client
    │   └── use-toast.ts            # Mini-store de toasts; chamar toast(msg, variant) de qualquer lugar
    ├── types/
    │   └── index.ts                # Tipos compartilhados: List, Item, Category, PurchaseHistory
    └── lib/
        ├── utils.ts                # cn(), formatCurrency(), parseCurrencyToCents()
        ├── units.ts                # Unit, UNITS, normalizeUnit(), unitAbbr()
        ├── categories.ts           # DEFAULT_CATEGORIES (IDs estáveis)
        └── templates.ts            # TEMPLATES: listas pré-configuradas com itens
```

---

## Store Zustand (`use-app-store.ts`)

Chave localStorage: `"listafacil-storage"` · Versão atual: `2`

**Estado:**

```ts
lists: List[]
items: Item[]
categories: Category[]
history: PurchaseHistory[]
```

**Actions:**

| Action                                        | Descrição                                                         |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `addList({ name, description?, budget? })`    | Cria lista, retorna `id`                                          |
| `updateList(id, data)`                        | Atualiza campos parciais de uma lista                             |
| `deleteList(id)`                              | Remove lista + itens associados + histórico                       |
| `completeList(id)`                            | Cria `PurchaseHistory` snapshot e marca `isCompleted: true`       |
| `duplicateList(id)`                           | Copia lista + itens (`isPurchased: false`), retorna novo `id`     |
| `addItem({ listId, name, ... })`              | Adiciona item; auto-atribui `order = max(existentes) + 1`         |
| `updateItem(id, data)`                        | Atualiza item (inclui `isPurchased`, `actualPrice`)               |
| `deleteItem(id)`                              | Remove item                                                       |
| `reorderItems(listId, orderedIds)`            | Atualiza `order` de todos os itens conforme novo array de IDs     |
| `addCategory({ name, icon?, color? })`        | Cria categoria personalizada                                      |
| `deleteCategory(id)`                          | Remove categoria + limpa `categoryId` nos itens que a referenciavam |
| `importData({ lists, items, categories, history })` | Substitui todo o estado (fluxo de restore)                  |

**Migração:**

- v0 → v1: renomeia "Mercado" → "Mercearia" (mantendo `cat-mercado`), insere `cat-congelados` e `cat-utilidades`
- v1 → v2: atribui `order` sequencial a itens sem o campo (por lista, preservando posição no array)

Para mudanças futuras: incrementar `version` e adicionar bloco `fromVersion < N` em `migrate`.

---

## Tipos principais (`types/index.ts`)

```ts
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface List {
  id: string
  name: string
  description?: string
  budget?: number       // centavos (R$ × 100)
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface Item {
  id: string
  listId: string
  name: string
  quantity: number
  unit?: Unit           // 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'CX' | 'PCT'
  estimatedPrice?: number  // centavos
  actualPrice?: number     // centavos
  categoryId?: string
  priority: Priority
  isPurchased: boolean
  order?: number        // posição na ordenação manual
  notes?: string
  createdAt: string
  updatedAt: string
}

interface PurchaseHistory {
  id: string
  listId: string
  listName: string
  totalEstimated: number  // centavos
  totalActual: number     // centavos
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

Todos os hooks (`useState`, `useMemo`, `useSensors`, etc.) devem ser declarados **antes** de qualquer `return` condicional.

---

## Temas e Estilização

**Tailwind CSS v4** — sem `tailwind.config.js`. Configuração via `@theme inline` em `globals.css`.

Componentes referenciam variáveis CSS diretamente:

```tsx
className = 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]'
```

**Dark mode:** `next-themes` com `attribute="class"`. O `<html>` precisa de `suppressHydrationWarning`.

**Viewport/themeColor:** exportar como `viewport` (não `metadata`) em `layout.tsx`.

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

## Header do detalhe da lista

No **mobile**, ações secundárias (Editar lista, Duplicar, Compartilhar) ficam em `<DropdownMenu>` (botão ⋯) para não estourar o header. Ações primárias (Modo compras, Concluir) permanecem inline. No **desktop** (`md+`), todos os botões ficam inline. Usar `<DropdownMenu>` de `@/components/ui/dropdown-menu` para novos menus overflow.

---

## Toasts

Chamar `toast(message, variant?)` de `@/hooks/use-toast` em qualquer parte da árvore de componentes. Variantes: `'default'` | `'success'` | `'destructive'`. Auto-dismiss em 3 s. `<Toaster>` está montado em `dashboard/layout.tsx`.

---

## Diálogos de confirmação

Usar `<ConfirmDialog>` de `@/components/ui/confirm-dialog` ao invés de `window.confirm()`. Props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `onConfirm`.

---

## Ordenação manual (drag & drop)

`Item.order` é a posição manual dentro de uma lista. Selecionar "Manual" no sort dropdown exibe alças de arrasto (⠿). Usa `@dnd-kit/core` + `@dnd-kit/sortable`. `PointerSensor` com `activationConstraint: { distance: 8 }` evita conflito drag/scroll no mobile. Alça usa `touch-none` e área de toque `h-10 w-10` no mobile. No modo manual: pendentes sempre antes de comprados; `order` determina posição dentro de cada grupo.

---

## Compartilhar lista

`shareList()` em `list-detail-client.tsx` gera texto formatado (`✓`/`□` por item com qtd, unidade e preço total). Usa `navigator.share` (Web Share API) quando disponível — toast de sucesso após share. Fallback: `navigator.clipboard.writeText` com toast "copiado". `AbortError` (cancelamento pelo usuário) é silenciado.

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
- **IDs estáveis em categorias padrão:** evitam duplicação ao reinicializar o store. `cat-mercado` mantém o ID mesmo após ser renomeado para "Mercearia".
- **PurchaseHistory como snapshot imutável:** ao concluir lista, `itemsSummary` preserva nome, preços e categoria de cada item.
- **`order` opcional:** itens antigos sem o campo são tratados como `Infinity` no sort manual e recebem valores sequenciais via migração v2.
- **Sem autenticação:** app single-user, dados locais por definição.
