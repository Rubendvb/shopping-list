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

State: `lists`, `items`, `categories`, `history`  
Actions: `addList`, `updateList`, `deleteList`, `completeList`, `duplicateList`, `addItem`, `updateItem`, `deleteItem`, `addCategory`, `deleteCategory`, `importData`

- `completeList(id)` builds a `PurchaseHistory` snapshot from current items and marks the list as completed.
- `duplicateList(id)` copies the list and all its items (with `isPurchased: false`), returns the new list ID.
- `deleteCategory(id)` also clears `categoryId` on all items that referenced the deleted category.
- `importData(data)` replaces the entire store state (used by the backup restore flow).

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

### Responsive action buttons

Item action buttons (edit, delete) use `opacity-100 md:opacity-0 md:group-hover:opacity-100` so they are always visible on mobile and appear on hover on desktop. Touch targets on mobile use `h-10 w-10` (40 px). Always include `aria-label` on icon-only buttons.

### Category IDs

`DEFAULT_CATEGORIES` uses stable string IDs so they don't regenerate across store initializations. Current default categories (ordered as they appear in dropdowns):

`cat-hortifruti` · `cat-acougue` · `cat-padaria` · `cat-frios` · `cat-mercado` (Mercearia) · `cat-congelados` · `cat-bebidas` · `cat-limpeza` · `cat-higiene` · `cat-utilidades` · `cat-eletronicos` · `cat-outros`

Note: `cat-mercado` ID is kept for backward compatibility — it was renamed from "Mercado" to "Mercearia" in v1.

### Store versioning and migration

The store uses `version: 1` in the persist config. The `migrate` function runs automatically when localStorage contains data from an older version (v0 → v1: renames "Mercado" → "Mercearia", inserts `cat-congelados` and `cat-utilidades`). When adding future breaking changes to default data, bump the version and extend `migrate`.
