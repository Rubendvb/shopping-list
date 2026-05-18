import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { DEFAULT_STORES } from '@/lib/stores'
import { toast } from '@/hooks/use-toast'
import { createListsSlice } from './slices/lists-slice'
import { createItemsSlice } from './slices/items-slice'
import { createPricesSlice } from './slices/prices-slice'
import { createCategoriesSlice } from './slices/categories-slice'
import { createStoresSlice } from './slices/stores-slice'
import type { AppStore, ImportDataInput } from './store-types'
import type { Store, ProductPrice, PriceRecord, Item, Category, List, PurchaseHistory } from '@/types'

// ─── migration state shape (partial — only data fields) ─────────────────────

interface PersistedState {
  lists: List[]
  items: Item[]
  categories: Category[]
  history: PurchaseHistory[]
  stores: Store[]
  priceHistory: PriceRecord[]
  productPrices: ProductPrice[]
}

// ─── store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createListsSlice(...a),
      ...createItemsSlice(...a),
      ...createPricesSlice(...a),
      ...createCategoriesSlice(...a),
      ...createStoresSlice(...a),

      importData: ({ lists, items, categories, history, stores, priceHistory, productPrices }: ImportDataInput) => {
        const [set] = a
        set({
          lists,
          items,
          categories,
          history,
          stores: stores ?? DEFAULT_STORES,
          priceHistory: priceHistory ?? [],
          productPrices: productPrices ?? [],
        })
      },
    }),
    {
      name: 'listafacil-storage',
      version: 5,
      migrate: (persisted, fromVersion) => {
        const state = persisted as PersistedState
        if (fromVersion < 1) {
          state.categories = state.categories.map((c) =>
            c.id === 'cat-mercado' ? { ...c, name: 'Mercearia', icon: '🥫' } : c
          )
          const existingIds = new Set(state.categories.map((c) => c.id))
          DEFAULT_CATEGORIES.forEach((dc) => {
            if (!existingIds.has(dc.id)) state.categories.push(dc)
          })
        }
        if (fromVersion < 2) {
          const counters: Record<string, number> = {}
          state.items = state.items.map((item) => {
            if (item.order !== undefined) return item
            counters[item.listId] = counters[item.listId] ?? 0
            const order = counters[item.listId]++
            return { ...item, order }
          })
        }
        if (fromVersion < 3) {
          if (!state.stores || state.stores.length === 0) {
            state.stores = DEFAULT_STORES
          } else {
            const existingIds = new Set((state.stores as Store[]).map((s) => s.id))
            DEFAULT_STORES.forEach((ds) => {
              if (!existingIds.has(ds.id)) state.stores.push(ds)
            })
          }
          if (!state.priceHistory) state.priceHistory = []
        }
        if (fromVersion < 4) {
          if (!state.stores) state.stores = DEFAULT_STORES
          else {
            const existingIds = new Set((state.stores as Store[]).map((s) => s.id))
            DEFAULT_STORES.forEach((ds) => {
              if (!existingIds.has(ds.id)) state.stores.push(ds)
            })
          }
        }
        if (fromVersion < 5) {
          const byKey = new Map<string, ProductPrice>()
          const sorted = [...(state.priceHistory ?? [])].sort((a, b) =>
            a.recordedAt.localeCompare(b.recordedAt)
          )
          for (const r of sorted) {
            byKey.set(`${r.productKey}::${r.storeId}`, {
              productKey: r.productKey,
              productName: r.productName,
              storeId: r.storeId,
              price: r.price,
              updatedAt: r.recordedAt,
            })
          }
          state.productPrices = [...byKey.values()]
        }
        return state
      },
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return {
          getItem: (key: string) => localStorage.getItem(key),
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value)
            } catch (e) {
              if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                queueMicrotask(() =>
                  toast(
                    'Armazenamento cheio. Exporte um backup e limpe o histórico.',
                    'destructive'
                  )
                )
              }
            }
          },
          removeItem: (key: string) => localStorage.removeItem(key),
        }
      }),
    }
  )
)
