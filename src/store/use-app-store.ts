import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { DEFAULT_STORES } from '@/lib/stores'
import { calcEstimated, calcActual } from '@/lib/utils'
import type { List, Item, Category, Store, PriceRecord, ProductPrice, PurchaseHistory, Priority, Unit } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function genId(): string {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

function now(): string {
  return new Date().toISOString()
}

function upsertProductPrice(
  current: ProductPrice[],
  productName: string,
  storeId: string,
  price: number,
  t: string
): ProductPrice[] {
  const productKey = productName.toLowerCase().trim()
  const idx = current.findIndex((p) => p.productKey === productKey && p.storeId === storeId)
  const entry: ProductPrice = { productKey, productName, storeId, price, updatedAt: t }
  if (idx === -1) return [...current, entry]
  const next = [...current]
  next[idx] = entry
  return next
}

// ─── state & actions types ───────────────────────────────────────────────────

interface AppState {
  lists: List[]
  items: Item[]
  categories: Category[]
  history: PurchaseHistory[]
  stores: Store[]
  priceHistory: PriceRecord[]
  /** Current price per (productKey × storeId) — upserted on every add/update */
  productPrices: ProductPrice[]
}

interface AddListInput {
  name: string
  description?: string
  /** reais — stored as cents */
  budget?: number
}

interface AddItemInput {
  listId: string
  name: string
  quantity?: number
  unit?: Unit
  /** reais — stored as cents */
  estimatedPrice?: number
  categoryId?: string
  storeId?: string
  priority?: Priority
  notes?: string
}

interface AppActions {
  // Lists
  addList: (data: AddListInput) => string
  updateList: (
    id: string,
    data: Partial<Pick<List, 'name' | 'description' | 'isCompleted'>> & { budget?: number | null }
  ) => void
  deleteList: (id: string) => void
  completeList: (id: string) => void
  duplicateList: (id: string) => string

  // Items — return false when a duplicate name+store exists in the same list
  addItem: (data: AddItemInput) => boolean
  updateItem: (id: string, data: Partial<Omit<Item, 'id' | 'listId' | 'createdAt'>>) => boolean
  deleteItem: (id: string) => void

  // Price comparator
  /** Returns the cheapest ProductPrice entry for a given normalized product key, or null. */
  getProductBestPrice: (productKey: string) => ProductPrice | null
  /**
   * Updates the price of an existing (productKey × storeId) entry in the global price table.
   * Does NOT mutate any item. Propagates to all list comparisons via Zustand reactivity.
   * No-op if the entry doesn't exist yet.
   */
  updateProductPrice: (productKey: string, storeId: string, priceCents: number) => void

  // Categories
  addCategory: (data: { name: string; icon?: string; color?: string }) => void
  deleteCategory: (id: string) => void

  // Stores
  addStore: (data: { name: string; icon?: string; color?: string }) => void
  deleteStore: (id: string) => void

  // Items order
  reorderItems: (listId: string, orderedIds: string[]) => void

  // Data management
  importData: (data: {
    lists: List[]
    items: Item[]
    categories: Category[]
    history: PurchaseHistory[]
    stores?: Store[]
    priceHistory?: PriceRecord[]
    productPrices?: ProductPrice[]
  }) => void
}

// ─── store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      lists: [],
      items: [],
      categories: DEFAULT_CATEGORIES,
      history: [],
      stores: DEFAULT_STORES,
      priceHistory: [],
      productPrices: [],

      // ── Lists ────────────────────────────────────────────────────────────

      addList: ({ name, description, budget }) => {
        const id = genId()
        const t = now()
        const list: List = {
          id,
          name,
          description,
          budget: budget !== undefined ? Math.round(budget * 100) : undefined,
          isCompleted: false,
          createdAt: t,
          updatedAt: t,
        }
        set((s) => ({ lists: [list, ...s.lists] }))
        return id
      },

      updateList: (id, data) => {
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id !== id
              ? l
              : {
                  ...l,
                  ...data,
                  budget:
                    data.budget !== undefined
                      ? data.budget === null
                        ? undefined
                        : Math.round((data.budget as number) * 100)
                      : l.budget,
                  updatedAt: now(),
                }
          ),
        }))
      },

      deleteList: (id) => {
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
          items: s.items.filter((i) => i.listId !== id),
          history: s.history.filter((h) => h.listId !== id),
        }))
      },

      duplicateList: (id) => {
        const { lists, items } = get()
        const source = lists.find((l) => l.id === id)
        if (!source) return id

        const newListId = genId()
        const t = now()
        const newList: List = {
          ...source,
          id: newListId,
          name: `${source.name} (cópia)`,
          isCompleted: false,
          createdAt: t,
          updatedAt: t,
        }
        const newItems: Item[] = items
          .filter((i) => i.listId === id)
          .map((item) => ({
            ...item,
            id: genId(),
            listId: newListId,
            isPurchased: false,
            actualPrice: undefined,
            createdAt: t,
            updatedAt: t,
          }))

        set((s) => ({
          lists: [newList, ...s.lists],
          items: [...s.items, ...newItems],
        }))
        return newListId
      },

      completeList: (id) => {
        const { lists, items, categories } = get()
        const list = lists.find((l) => l.id === id)
        if (!list) return

        const listItems = items.filter((i) => i.listId === id)
        const totalEstimated = calcEstimated(listItems)
        const totalActual = calcActual(listItems)

        const entry: PurchaseHistory = {
          id: genId(),
          listId: id,
          listName: list.name,
          totalEstimated: Math.round(totalEstimated),
          totalActual: Math.round(totalActual),
          itemCount: listItems.length,
          itemsSummary: listItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            estimatedPrice: i.estimatedPrice,
            actualPrice: i.actualPrice,
            isPurchased: i.isPurchased,
            category: categories.find((c) => c.id === i.categoryId)?.name,
            storeId: i.storeId,
          })),
          completedAt: now(),
        }

        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === id ? { ...l, isCompleted: true, updatedAt: now() } : l
          ),
          history: [entry, ...s.history],
        }))
      },

      // ── Items ────────────────────────────────────────────────────────────

      addItem: ({
        listId,
        name,
        quantity = 1,
        unit,
        estimatedPrice,
        categoryId,
        storeId,
        priority = 'MEDIUM',
        notes,
      }) => {
        const nameKey = name.toLowerCase().trim()
        const isDuplicate = get().items.some(
          (i) => i.listId === listId && i.name.toLowerCase().trim() === nameKey
        )
        if (isDuplicate) return false

        const existing = get().items.filter((i) => i.listId === listId)
        const maxOrder = existing.reduce((m, i) => Math.max(m, i.order ?? -1), -1)
        const t = now()
        const priceCents = estimatedPrice !== undefined ? Math.round(estimatedPrice * 100) : undefined

        const item: Item = {
          id: genId(),
          listId,
          name,
          quantity,
          unit,
          estimatedPrice: priceCents,
          categoryId,
          storeId,
          priority,
          isPurchased: false,
          order: maxOrder + 1,
          notes,
          createdAt: t,
          updatedAt: t,
        }

        const priceRecord: PriceRecord | null =
          storeId && priceCents !== undefined
            ? {
                id: genId(),
                productName: name,
                productKey: name.toLowerCase().trim(),
                storeId,
                price: priceCents,
                recordedAt: t,
              }
            : null

        set((s) => ({
          items: [...s.items, item],
          priceHistory: priceRecord ? [priceRecord, ...s.priceHistory] : s.priceHistory,
          productPrices:
            storeId && priceCents !== undefined
              ? upsertProductPrice(s.productPrices, name, storeId, priceCents, t)
              : s.productPrices,
        }))
        return true
      },

      updateItem: (id, data) => {
        const current = get().items.find((i) => i.id === id)
        if (!current) return false

        const newEstimatedPrice =
          data.estimatedPrice !== undefined
            ? data.estimatedPrice === null
              ? undefined
              : Math.round((data.estimatedPrice as number) * 100)
            : current.estimatedPrice

        const newActualPrice =
          data.actualPrice !== undefined
            ? data.actualPrice === null
              ? undefined
              : Math.round((data.actualPrice as number) * 100)
            : current.actualPrice

        const newStoreId = 'storeId' in data ? data.storeId : current.storeId
        const newName = data.name !== undefined ? data.name.trim() : current.name

        const oldProductKey = current.name.toLowerCase().trim()
        const newProductKey = newName.toLowerCase().trim()
        const nameChanged = oldProductKey !== newProductKey

        // Block duplicate: same name in the same list (excluding self)
        if (data.name !== undefined) {
          const isDuplicate = get().items.some(
            (i) =>
              i.id !== id &&
              i.listId === current.listId &&
              i.name.toLowerCase().trim() === newProductKey
          )
          if (isDuplicate) return false
        }

        const shouldRecord =
          newStoreId != null &&
          newEstimatedPrice !== undefined &&
          (data.estimatedPrice !== undefined || 'storeId' in data)

        const priceRecord: PriceRecord | null = shouldRecord
          ? {
              id: genId(),
              productName: newName,
              productKey: newProductKey,
              storeId: newStoreId!,
              price: newEstimatedPrice!,
              recordedAt: now(),
            }
          : null

        const updateTs = now()
        set((s) => {
          // When name is corrected, rename all matching history records atomically
          let newPriceHistory = nameChanged
            ? s.priceHistory.map((r) =>
                r.productKey === oldProductKey
                  ? { ...r, productName: newName, productKey: newProductKey }
                  : r
              )
            : s.priceHistory

          if (priceRecord) newPriceHistory = [priceRecord, ...newPriceHistory]

          // Sync productPrices: rename on key change, then upsert current price
          let newProductPrices = nameChanged
            ? s.productPrices.map((p) =>
                p.productKey === oldProductKey
                  ? { ...p, productName: newName, productKey: newProductKey }
                  : p
              )
            : s.productPrices

          if (shouldRecord) {
            newProductPrices = upsertProductPrice(
              newProductPrices,
              newName,
              newStoreId!,
              newEstimatedPrice!,
              updateTs
            )
          }

          return {
            items: s.items.map((i) =>
              i.id !== id
                ? i
                : {
                    ...i,
                    ...data,
                    estimatedPrice: newEstimatedPrice,
                    actualPrice: newActualPrice,
                    updatedAt: updateTs,
                  }
            ),
            priceHistory: newPriceHistory,
            productPrices: newProductPrices,
          }
        })
        return true
      },

      deleteItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
      },

      reorderItems: (listId, orderedIds) => {
        set((s) => ({
          items: s.items.map((item) => {
            if (item.listId !== listId) return item
            const idx = orderedIds.indexOf(item.id)
            return idx !== -1 ? { ...item, order: idx, updatedAt: now() } : item
          }),
        }))
      },

      // ── Categories ───────────────────────────────────────────────────────

      addCategory: ({ name, icon = '📦', color = '#94a3b8' }) => {
        set((s) => ({
          categories: [...s.categories, { id: genId(), name, icon, color, isDefault: false }],
        }))
      },

      deleteCategory: (id) => {
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id || c.isDefault),
          items: s.items.map((i) =>
            i.categoryId === id ? { ...i, categoryId: undefined } : i
          ),
        }))
      },

      // ── Stores ───────────────────────────────────────────────────────────

      addStore: ({ name, icon = '🏪', color = '#6366f1' }) => {
        set((s) => ({
          stores: [...s.stores, { id: genId(), name, icon, color, isDefault: false }],
        }))
      },

      deleteStore: (id) => {
        set((s) => ({
          stores: s.stores.filter((st) => st.id !== id || st.isDefault),
          items: s.items.map((i) => (i.storeId === id ? { ...i, storeId: undefined } : i)),
          productPrices: s.productPrices.filter((p) => p.storeId !== id),
        }))
      },

      getProductBestPrice: (productKey) => {
        const key = productKey.toLowerCase().trim()
        const matches = get().productPrices.filter((p) => p.productKey === key)
        if (matches.length === 0) return null
        return matches.reduce((best, p) => (p.price < best.price ? p : best))
      },

      updateProductPrice: (productKey, storeId, priceCents) => {
        const key = productKey.toLowerCase().trim()
        const t = now()
        set((s) => {
          const idx = s.productPrices.findIndex(
            (p) => p.productKey === key && p.storeId === storeId
          )
          if (idx === -1) return s
          const next = [...s.productPrices]
          next[idx] = { ...next[idx], price: priceCents, updatedAt: t }
          return { productPrices: next }
        })
      },

      importData: ({ lists, items, categories, history, stores, priceHistory, productPrices }) => {
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
        const state = persisted as AppState & AppActions
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
          // Insert any default stores added after v3
          if (!state.stores) state.stores = DEFAULT_STORES
          else {
            const existingIds = new Set((state.stores as Store[]).map((s) => s.id))
            DEFAULT_STORES.forEach((ds) => {
              if (!existingIds.has(ds.id)) state.stores.push(ds)
            })
          }
        }
        if (fromVersion < 5) {
          // Backfill productPrices from priceHistory: latest price per (productKey, storeId)
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
        return localStorage
      }),
    }
  )
)
