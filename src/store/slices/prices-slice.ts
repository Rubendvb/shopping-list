import type { StateCreator } from 'zustand'
import type { ProductPrice, PriceRecord } from '@/types'
import { genId, now, MAX_PRICE_HISTORY } from '../helpers'
import type { AppStore } from '../store-types'

export interface PricesSlice {
  productPrices: ProductPrice[]
  priceHistory: PriceRecord[]
  /** Returns the cheapest ProductPrice entry for a given normalized product key, or null */
  getProductBestPrice: (productKey: string) => ProductPrice | null
  /**
   * Updates an existing (productKey × storeId) entry in the global price table.
   * No-op if the entry doesn't exist yet.
   */
  updateProductPrice: (productKey: string, storeId: string, priceCents: number) => void
  /** Inserts a new (productKey × storeId) entry. Returns false if the pair already exists. */
  addProductPrice: (productName: string, storeId: string, priceCents: number) => boolean
  /** Removes a (productKey × storeId) entry from the global price table. */
  removeProductPrice: (productKey: string, storeId: string) => void
}

export const createPricesSlice: StateCreator<AppStore, [], [], PricesSlice> = (set, get) => ({
  productPrices: [],
  priceHistory: [],

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

  addProductPrice: (productName, storeId, priceCents) => {
    const key = productName.toLowerCase().trim()
    const exists = get().productPrices.some(
      (p) => p.productKey === key && p.storeId === storeId
    )
    if (exists) return false
    const t = now()
    const record: PriceRecord = {
      id: genId(),
      productName,
      productKey: key,
      storeId,
      price: priceCents,
      recordedAt: t,
    }
    set((s) => ({
      productPrices: [
        ...s.productPrices,
        { productKey: key, productName, storeId, price: priceCents, updatedAt: t },
      ],
      priceHistory: [record, ...s.priceHistory].slice(0, MAX_PRICE_HISTORY),
    }))
    return true
  },

  removeProductPrice: (productKey, storeId) => {
    const key = productKey.toLowerCase().trim()
    set((s) => ({
      productPrices: s.productPrices.filter(
        (p) => !(p.productKey === key && p.storeId === storeId)
      ),
    }))
  },
})
