import type { ProductPrice, Store } from '@/types'

export type PriceAlert =
  | { status: 'best' }
  | { status: 'tie'; tiedStoreNames: string[] }
  | { status: 'above'; betterStoreNames: string[]; savings: number; bestPrice: number }

/**
 * Compares priceCents against known prices for the same product at OTHER stores.
 * Returns null when there is no comparison data (fewer than 2 stores with prices).
 *
 * @param name            - product name (normalized internally)
 * @param priceCents      - price being evaluated, in cents
 * @param currentStoreId  - store to exclude from comparison (undefined = compare vs all)
 * @param productPrices   - global upserted price table
 * @param stores          - store list for name lookup
 */
export function getPriceAlert(
  name: string,
  priceCents: number,
  currentStoreId: string | undefined,
  productPrices: ProductPrice[],
  stores: Store[]
): PriceAlert | null {
  if (!name.trim() || priceCents <= 0) return null

  const productKey = name.toLowerCase().trim()
  const others = productPrices.filter(
    (p) => p.productKey === productKey && p.storeId !== currentStoreId
  )
  if (!others.length) return null

  const minPrice = Math.min(...others.map((p) => p.price))

  if (priceCents < minPrice) return { status: 'best' }

  if (priceCents === minPrice) {
    const tiedStoreNames = others
      .filter((p) => p.price === minPrice)
      .map((p) => stores.find((s) => s.id === p.storeId)?.name)
      .filter(Boolean) as string[]
    return { status: 'tie', tiedStoreNames }
  }

  const betterStoreNames = others
    .filter((p) => p.price === minPrice)
    .map((p) => stores.find((s) => s.id === p.storeId)?.name)
    .filter(Boolean) as string[]

  if (!betterStoreNames.length) return null
  return { status: 'above', betterStoreNames, savings: priceCents - minPrice, bestPrice: minPrice }
}
