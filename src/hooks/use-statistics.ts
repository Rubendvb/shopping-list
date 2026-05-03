import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { useShallow } from 'zustand/react/shallow'
import type { ItemSummary } from '@/types'

export const periodOptions = [
  { value: 'last-month', label: 'Último mês' },
  { value: 'last-3-months', label: 'Últimos 3 meses' },
  { value: 'last-6-months', label: 'Últimos 6 meses' },
  { value: 'this-year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
] as const

export type Period = (typeof periodOptions)[number]['value']

export interface CategoryStat {
  name: string
  total: number
}

export interface TopItem {
  name: string
  count: number
  category?: string
}

export interface MonthlyStat {
  month: string
  total: number
}

export interface StatisticsResult {
  filteredHistory: ReturnType<typeof useAppStore.getState>['history']
  totalSpent: number
  avgPerList: number
  listsCompleted: number
  categoryStats: CategoryStat[]
  maxCategory: number
  topItems: TopItem[]
  suggestions: TopItem[]
  monthlyData: MonthlyStat[]
  maxMonthly: number
  hasData: boolean
  activeLists: ReturnType<typeof useAppStore.getState>['lists']
}

function getPeriodCutoff(period: Period): Date | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'last-month') return new Date(now.getTime() - 30 * 86_400_000)
  if (period === 'last-3-months') return new Date(now.getTime() - 90 * 86_400_000)
  if (period === 'last-6-months') return new Date(now.getTime() - 180 * 86_400_000)
  return new Date(now.getFullYear(), 0, 1) // this-year
}

export function useStatistics(period: Period): StatisticsResult {
  const history = useAppStore((s) => s.history)
  const activeLists = useAppStore(useShallow((s) => s.lists.filter((l) => !l.isCompleted)))

  const filteredHistory = useMemo(() => {
    const cutoff = getPeriodCutoff(period)
    if (!cutoff) return history
    return history.filter((h) => {
      try {
        return new Date(h.completedAt) >= cutoff
      } catch {
        return false
      }
    })
  }, [history, period])

  const computed = useMemo(() => {
    const totalSpent = filteredHistory.reduce((s, h) => s + h.totalActual, 0)
    const avgPerList =
      filteredHistory.length > 0 ? Math.round(totalSpent / filteredHistory.length) : 0

    const categoryMap: Record<string, CategoryStat> = {}
    const itemMap: Record<string, TopItem> = {}

    for (const h of filteredHistory) {
      for (const item of h.itemsSummary as ItemSummary[]) {
        if (!item.isPurchased) continue

        const cat = item.category ?? 'Outros'
        if (!categoryMap[cat]) categoryMap[cat] = { name: cat, total: 0 }
        categoryMap[cat].total += (item.actualPrice ?? item.estimatedPrice ?? 0) * item.quantity

        const key = item.name.toLowerCase()
        if (!itemMap[key]) itemMap[key] = { name: item.name, count: 0 }
        itemMap[key].count += item.quantity
        if (item.category && !itemMap[key].category) {
          itemMap[key].category = item.category
        }
      }
    }

    const categoryStats = Object.values(categoryMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    const suggestions = topItems.slice(0, 5)
    const maxCategory = categoryStats[0]?.total ?? 1

    const monthlyMap: Record<string, number> = {}
    for (const h of filteredHistory) {
      const key = h.completedAt.slice(0, 7)
      if (!monthlyMap[key]) monthlyMap[key] = 0
      monthlyMap[key] += h.totalActual
    }
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, total }))
    const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1)

    return { totalSpent, avgPerList, categoryStats, topItems, suggestions, maxCategory, monthlyData, maxMonthly }
  }, [filteredHistory])

  return {
    filteredHistory,
    activeLists,
    hasData: history.length > 0,
    listsCompleted: filteredHistory.length,
    ...computed,
  }
}
