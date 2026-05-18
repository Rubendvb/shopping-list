import type { StateCreator } from 'zustand'
import type { Item, PriceRecord, Priority, Unit } from '@/types'
import { genId, now, upsertProductPrice, MAX_PRICE_HISTORY } from '../helpers'
import type { AppStore } from '../store-types'

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

export interface ItemsSlice {
  items: Item[]
  /** Returns false when a duplicate name already exists in the same list */
  addItem: (data: AddItemInput) => boolean
  /** Returns false when the new name duplicates an existing item in the list */
  updateItem: (id: string, data: Partial<Omit<Item, 'id' | 'listId' | 'createdAt'>>) => boolean
  deleteItem: (id: string) => void
  reorderItems: (listId: string, orderedIds: string[]) => void
}

export const createItemsSlice: StateCreator<AppStore, [], [], ItemsSlice> = (set, get) => ({
  items: [],

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
      priceHistory: priceRecord
        ? [priceRecord, ...s.priceHistory].slice(0, MAX_PRICE_HISTORY)
        : s.priceHistory,
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
      let newPriceHistory = nameChanged
        ? s.priceHistory.map((r) =>
            r.productKey === oldProductKey
              ? { ...r, productName: newName, productKey: newProductKey }
              : r
          )
        : s.priceHistory

      if (priceRecord) newPriceHistory = [priceRecord, ...newPriceHistory].slice(0, MAX_PRICE_HISTORY)

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
})
