import type { ProductPrice } from '@/types'

export const MAX_PRICE_HISTORY = 500

export function genId(): string {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function now(): string {
  return new Date().toISOString()
}

export function upsertProductPrice(
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
