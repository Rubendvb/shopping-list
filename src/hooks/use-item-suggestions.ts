import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { useShallow } from 'zustand/react/shallow'
import { normalizeUnit } from '@/lib/units'
import type { Unit } from '@/lib/units'

export interface ItemSuggestion {
  productKey: string
  displayName: string
  categoryId?: string
  unit?: Unit
  storeId?: string
  /** best known price in cents */
  price?: number
}

export function useItemSuggestions(query: string): ItemSuggestion[] {
  const productPrices = useAppStore(useShallow((s) => s.productPrices))
  const items = useAppStore(useShallow((s) => s.items))

  return useMemo(() => {
    const q = query.toLowerCase().trim()
    if (q.length < 1) return []

    const map = new Map<string, ItemSuggestion>()

    // Seed from productPrices — track the best (lowest) price per productKey
    for (const p of productPrices) {
      const existing = map.get(p.productKey)
      if (!existing) {
        map.set(p.productKey, {
          productKey: p.productKey,
          displayName: p.productName,
          storeId: p.storeId,
          price: p.price,
        })
      } else if (existing.price === undefined || p.price < existing.price) {
        map.set(p.productKey, { ...existing, storeId: p.storeId, price: p.price })
      }
    }

    // Enrich with category + unit from items; also add items not in productPrices
    for (const item of items) {
      const key = item.name.toLowerCase().trim()
      const unit = normalizeUnit(item.unit)
      const existing = map.get(key)
      if (existing) {
        map.set(key, {
          ...existing,
          categoryId: existing.categoryId ?? item.categoryId,
          unit: existing.unit ?? unit,
        })
      } else {
        map.set(key, {
          productKey: key,
          displayName: item.name,
          categoryId: item.categoryId,
          unit,
        })
      }
    }

    // Split into prefix matches and contains matches
    const prefix: ItemSuggestion[] = []
    const contains: ItemSuggestion[] = []
    for (const s of map.values()) {
      if (!s.productKey.includes(q)) continue
      if (s.productKey.startsWith(q)) prefix.push(s)
      else contains.push(s)
    }

    prefix.sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt'))
    contains.sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt'))

    return [...prefix, ...contains].slice(0, 6)
  }, [query, productPrices, items])
}
