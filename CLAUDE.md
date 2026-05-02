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
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
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
  components/
    ui/               # Primitive components (button, card, dialog, etc.)
    sidebar.tsx       # Navigation sidebar with mobile hamburger
    theme-toggle.tsx  # Dark/light mode toggle
  store/
    use-app-store.ts  # Zustand store — lists, items, categories, history
  lib/
    utils.ts          # cn(), formatCurrency()
    categories.ts     # DEFAULT_CATEGORIES (stable string IDs)
  hooks/
    use-mounted.ts    # Returns true only after client mount
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
Actions: `addList`, `updateList`, `deleteList`, `completeList`, `addItem`, `updateItem`, `deleteItem`, `addCategory`, `deleteCategory`

`completeList(id)` builds a `PurchaseHistory` snapshot from current items and marks the list as completed.

### Money

All prices stored as **integers (cents)** in the store. Use `formatCurrency(cents)` to display. Store actions accept reais (floats) and multiply by 100 internally.

### Category IDs

`DEFAULT_CATEGORIES` uses stable string IDs (`cat-mercado`, `cat-padaria`, etc.) so they don't regenerate across store initializations.
