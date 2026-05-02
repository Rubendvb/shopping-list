import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import type { List, Item, Category, PurchaseHistory, Priority, Unit } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function genId(): string {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

function now(): string {
  return new Date().toISOString()
}

// ─── state & actions types ───────────────────────────────────────────────────

interface AppState {
  lists: List[]
  items: Item[]
  categories: Category[]
  history: PurchaseHistory[]
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
  priority?: Priority
  notes?: string
}

interface AppActions {
  // Lists
  addList: (data: AddListInput) => string
  updateList: (
    id: string,
    data: Partial<Pick<List, 'name' | 'description' | 'budget' | 'isCompleted'>>
  ) => void
  deleteList: (id: string) => void
  completeList: (id: string) => void

  // Items
  addItem: (data: AddItemInput) => void
  updateItem: (id: string, data: Partial<Omit<Item, 'id' | 'listId' | 'createdAt'>>) => void
  deleteItem: (id: string) => void

  // Categories
  addCategory: (data: { name: string; icon?: string; color?: string }) => void
  deleteCategory: (id: string) => void
}

// ─── store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      lists: [],
      items: [],
      categories: DEFAULT_CATEGORIES,
      history: [],

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

      completeList: (id) => {
        const { lists, items, categories } = get()
        const list = lists.find((l) => l.id === id)
        if (!list) return

        const listItems = items.filter((i) => i.listId === id)
        const totalEstimated = listItems.reduce(
          (s, i) => s + (i.estimatedPrice ?? 0) * i.quantity,
          0
        )
        const totalActual = listItems
          .filter((i) => i.isPurchased)
          .reduce((s, i) => s + (i.actualPrice ?? i.estimatedPrice ?? 0) * i.quantity, 0)

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
        priority = 'MEDIUM',
        notes,
      }) => {
        const t = now()
        const item: Item = {
          id: genId(),
          listId,
          name,
          quantity,
          unit,
          estimatedPrice:
            estimatedPrice !== undefined ? Math.round(estimatedPrice * 100) : undefined,
          categoryId,
          priority,
          isPurchased: false,
          notes,
          createdAt: t,
          updatedAt: t,
        }
        set((s) => ({ items: [...s.items, item] }))
      },

      updateItem: (id, data) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id !== id
              ? i
              : {
                  ...i,
                  ...data,
                  estimatedPrice:
                    data.estimatedPrice !== undefined
                      ? data.estimatedPrice === null
                        ? undefined
                        : Math.round((data.estimatedPrice as number) * 100)
                      : i.estimatedPrice,
                  actualPrice:
                    data.actualPrice !== undefined
                      ? data.actualPrice === null
                        ? undefined
                        : Math.round((data.actualPrice as number) * 100)
                      : i.actualPrice,
                  updatedAt: now(),
                }
          ),
        }))
      },

      deleteItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
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
        }))
      },
    }),
    {
      name: 'listafacil-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return localStorage
      }),
    }
  )
)
