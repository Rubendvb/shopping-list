import { useMemo } from 'react'
import type { Item, Category, Store } from '@/types'
import { priorityOrder } from '@/app/dashboard/listas/[id]/components/item-card'

export type SortMode = 'priority' | 'name' | 'category' | 'store' | 'manual'
export type StatusFilter = 'all' | 'pending' | 'purchased'

interface UseListFiltersOptions {
  items: Item[]
  categories: Category[]
  stores: Store[]
  search: string
  filterCategory: string
  filterStatus: StatusFilter
  sortBy: SortMode
}

interface UseListFiltersResult {
  filtered: Item[]
  storeGroups: [string | undefined, Item[]][] | null
}

export function useListFilters({
  items,
  categories,
  stores,
  search,
  filterCategory,
  filterStatus,
  sortBy,
}: UseListFiltersOptions): UseListFiltersResult {
  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
        if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false
        if (filterStatus === 'purchased' && !item.isPurchased) return false
        if (filterStatus === 'pending' && item.isPurchased) return false
        return true
      })
      .sort((a, b) => {
        const orderTie = (a.order ?? Infinity) - (b.order ?? Infinity)

        if (sortBy === 'manual') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          return orderTie
        }
        if (sortBy === 'priority') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          return priorityOrder[a.priority] - priorityOrder[b.priority] || orderTie
        }
        if (sortBy === 'store') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          const storeA = stores.find((s) => s.id === a.storeId)?.name ?? '￿'
          const storeB = stores.find((s) => s.id === b.storeId)?.name ?? '￿'
          return storeA.localeCompare(storeB) || a.name.localeCompare(b.name)
        }

        if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
        const catA = categories.find((c) => c.id === a.categoryId)?.name ?? ''
        const catB = categories.find((c) => c.id === b.categoryId)?.name ?? ''
        if (sortBy === 'category') return catA.localeCompare(catB) || orderTie
        if (sortBy === 'name') return a.name.localeCompare(b.name) || orderTie
        return orderTie
      })
  }, [items, search, filterCategory, filterStatus, sortBy, categories, stores])

  const storeGroups = useMemo((): [string | undefined, Item[]][] | null => {
    if (sortBy !== 'store') return null
    const groups = new Map<string | undefined, Item[]>()
    for (const item of filtered) {
      const key = item.storeId
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (!a) return 1
      if (!b) return -1
      const nameA = stores.find((s) => s.id === a)?.name ?? ''
      const nameB = stores.find((s) => s.id === b)?.name ?? ''
      return nameA.localeCompare(nameB)
    })
  }, [filtered, sortBy, stores])

  return { filtered, storeGroups }
}
