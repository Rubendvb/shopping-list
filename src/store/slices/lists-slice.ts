import type { StateCreator } from 'zustand'
import type { List, PurchaseHistory } from '@/types'
import { genId, now } from '../helpers'
import { calcEstimated, calcActual } from '@/lib/utils'
import type { AppStore } from '../store-types'

interface AddListInput {
  name: string
  description?: string
  /** reais — stored as cents */
  budget?: number
}

export interface ListsSlice {
  lists: List[]
  history: PurchaseHistory[]
  addList: (data: AddListInput) => string
  updateList: (
    id: string,
    data: Partial<Pick<List, 'name' | 'description' | 'isCompleted'>> & { budget?: number | null }
  ) => void
  deleteList: (id: string) => void
  completeList: (id: string) => void
  duplicateList: (id: string) => string
}

export const createListsSlice: StateCreator<AppStore, [], [], ListsSlice> = (set, get) => ({
  lists: [],
  history: [],

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
    const newItems = items
      .filter((i) => i.listId === id)
      .map((item) => ({
        ...item,
        id: genId(),
        listId: newListId,
        isPurchased: false,
        actualPrice: undefined as number | undefined,
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
})
