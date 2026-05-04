# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A frontend-only shopping list / purchase manager app. Single-user, no authentication, no backend. All data persists in localStorage via Zustand.

See `prompt.md` for the full feature spec (in Portuguese).

## Stack

| Layer               | Choice                                           |
| ------------------- | ------------------------------------------------ |
| Framework           | Next.js 16 (App Router)                          |
| Styling             | Tailwind CSS v4 with CSS custom properties       |
| State / Persistence | Zustand v5 + `persist` middleware → localStorage |
| Theme               | next-themes (dark mode)                          |

## Development Commands

```bash
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npm run lint:fix      # ESLint + auto-fix
npm run format        # Prettier write
npm run format:check  # Prettier check (CI)
```

## Architecture

```
src/
  app/
    dashboard/        # All pages — all Client Components
      page.tsx        # Home: summary stats + recent active lists
      listas/         # Lists page + [id] detail page
      estatisticas/   # Statistics page
      historico/      # Purchase history page
      categorias/     # Categories management
      configuracoes/  # Backup/restore (export/import JSON)
  components/
    ui/               # Primitive components (button, card, dialog, etc.)
      currency-input.tsx   # Masked R$ input — value/onChange in cents (integer)
      confirm-dialog.tsx   # Reusable AlertDialog wrapper (replaces window.confirm)
      dropdown-menu.tsx    # DropdownMenu wrapper (@radix-ui/react-dropdown-menu)
      toaster.tsx          # Renders active toasts (mounted in dashboard/layout.tsx)
    sidebar.tsx       # Navigation sidebar with mobile hamburger
    theme-toggle.tsx  # Dark/light mode toggle
  store/
    use-app-store.ts  # Zustand store — lists, items, categories, history
  lib/
    utils.ts          # cn(), formatCurrency(), parseCurrencyToCents()
    categories.ts     # DEFAULT_CATEGORIES (stable string IDs)
    units.ts          # Unit type, UNITS list, normalizeUnit(), unitAbbr()
  hooks/
    use-mounted.ts    # Returns true only after client mount
    use-toast.ts      # Zustand mini-store; call toast(msg, variant) from anywhere
  types/
    index.ts          # Shared TypeScript types
```

## Key Patterns

### All pages are Client Components

Every page under `dashboard/` is `"use client"`. Pages read directly from `useAppStore` — no Server Components, no API calls.

### SSR hydration guard

All pages call `useMounted()` and return `null` before mount. This prevents localStorage data from flashing on the server render. Never render store data without checking `mounted` first.

### Zustand store (`use-app-store.ts`)

Single store with `persist` middleware writing to localStorage key `"listafacil-storage"`. SSR-safe: storage returns no-ops when `typeof window === "undefined"`.

State: `lists`, `items`, `categories`, `history`, `stores`, `priceHistory`, `productPrices`
Actions: `addList`, `updateList`, `deleteList`, `completeList`, `duplicateList`, `addItem`, `updateItem`, `deleteItem`, `reorderItems`, `addCategory`, `deleteCategory`, `addStore`, `deleteStore`, `updateProductPrice`, `importData`

- `completeList(id)` builds a `PurchaseHistory` snapshot from current items and marks the list as completed.
- `duplicateList(id)` copies the list and all its items (with `isPurchased: false`), returns the new list ID.
- `deleteCategory(id)` also clears `categoryId` on all items that referenced the deleted category.
- `deleteStore(id)` also clears `storeId` on all items that referenced the deleted store and removes its entries from `productPrices`.
- `reorderItems(listId, orderedIds)` updates the `order` field of all items in the list according to the new ID array.
- `updateProductPrice(productKey, storeId, price)` does a global price update in `productPrices` without mutating items directly.
- `importData(data)` replaces the entire store state (used by the backup restore flow).
- `addItem` auto-assigns `order = max(existing orders) + 1` so new items always land at the bottom in manual sort. Returns `false` if an item with the exact same name already exists in the list. It also upserts the price into `productPrices`.
- `updateItem` returns `false` if the new name duplicates an existing item. It automatically syncs the product name in `priceHistory` and `productPrices` for global name corrections, and upserts the new price.

### Money

All prices stored as **integers (cents)** in the store. Use `formatCurrency(cents)` to display. Store actions accept reais (floats) and multiply by 100 internally.

### Unit field

Item units use the typed `Unit = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'CX' | 'PCT'` enum from `lib/units.ts`. Display via `unitAbbr()`. Legacy free-text values are normalized on-the-fly with `normalizeUnit()` — no store migration needed.

### Currency input

`<CurrencyInput value={cents} onChange={setCents} />` — accepts/emits integers (cents). Store actions take reais (floats), so divide by 100 at the call site: `estimatedPrice: price / 100`.

### Toast notifications

Call `toast(message, variant?)` from `@/hooks/use-toast` anywhere in the component tree. Variants: `'default'` | `'success'` | `'destructive'`. The `Toaster` component is mounted once in `dashboard/layout.tsx` and auto-dismisses after 3 s.

### Confirmation dialogs

Use `<ConfirmDialog>` from `@/components/ui/confirm-dialog` instead of `window.confirm()`. Props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant` (`'default'` | `'destructive'`), `onConfirm`.

### Shopping mode

`list-detail-client.tsx` has a local `shoppingMode` boolean state. When active: budget card, filters, add-item form, and edit/delete buttons are hidden; checkboxes and item names are enlarged for easy one-handed use. Does not touch the store.

### List detail header actions

On **mobile**, secondary actions (Edit list, Duplicate, Share) are collapsed into a `DropdownMenu` (⋯ button) to avoid header overflow. Primary actions (Shopping mode toggle, Complete) remain inline. On **desktop** (`md+`), all buttons are shown inline. Use `<DropdownMenu>` from `@/components/ui/dropdown-menu` for any new overflow menus.

### Share list

`shareList()` in `list-detail-client.tsx` generates a plain-text shopping list (`✓`/`□` per item with quantity, unit and total price). Uses `navigator.share` (Web Share API) when available — shows native share sheet and toasts on success. Falls back to `navigator.clipboard.writeText` with a "copied" toast. Catches `AbortError` silently (user cancelled).

### Manual sort (drag & drop)

`Item` has an `order?: number` field. Select "Manual" in the sort dropdown to enable drag handles (⠿ `GripVertical`). Uses `@dnd-kit/core` + `@dnd-kit/sortable`. `PointerSensor` has `activationConstraint: { distance: 8 }` to prevent drag/scroll conflict on mobile. The drag handle uses `touch-none` and a 40×40 px touch target on mobile. On drag end, `reorderItems` is called with the new full order. In manual mode, pending items always sort before purchased items within each group; `order` determines position within each group.

### Responsive action buttons

Item action buttons (edit, delete) use `opacity-100 md:opacity-0 md:group-hover:opacity-100` so they are always visible on mobile and appear on hover on desktop. Touch targets on mobile use `h-10 w-10` (40 px). Always include `aria-label` on icon-only buttons.

### Category IDs

`DEFAULT_CATEGORIES` uses stable string IDs so they don't regenerate across store initializations. Current default categories (ordered as they appear in dropdowns):

`cat-hortifruti` · `cat-acougue` · `cat-padaria` · `cat-frios` · `cat-mercado` (Mercearia) · `cat-congelados` · `cat-bebidas` · `cat-limpeza` · `cat-higiene` · `cat-utilidades` · `cat-eletronicos` · `cat-outros`

Note: `cat-mercado` ID is kept for backward compatibility — it was renamed from "Mercado" to "Mercearia" in v1.

### Price Comparator & Stores

The app includes a globally decoupled price comparator that tracks item prices across different stores.
- Store state: `stores` contains default and custom stores. `productPrices` tracks `{ productKey, productName, storeId, price, updatedAt }`. `priceHistory` serves as a historical log.
- Duplicate validation: `addItem` / `updateItem` strictly prevent adding items with the exact same name in a single list.
- Price badges: In `list-detail-client.tsx`, items display badges: green for "Best price", outline for "Tie", and amber ("↓ Loja · -R$ X,XX") showing where to save and how much.
- Suggestions: When adding an item, a `<SuggestionHint>` appears with the minimum and average prices (if different), allowing 1-click apply of store and price.
- Ties handling: If multiple stores share the lowest price, the badge will list all of them joined by comma.

### Store versioning and migration

The store uses `version: 5` in the persist config. The `migrate` function runs automatically on version mismatch:
- v0 → v1: renames "Mercado" → "Mercearia", inserts `cat-congelados` and `cat-utilidades`.
- v1 → v2: assigns sequential `order` values to items that lack the field.
- v2 → v3: initializes `stores` with default stores and creates an empty array for `priceHistory`.
- v3 → v4: inserts any new default stores that might be missing in the existing state.
- v4 → v5: initializes an empty `productPrices` array for the global comparator.

When adding future breaking changes, bump the version and extend `migrate` with a `fromVersion < N` block.
