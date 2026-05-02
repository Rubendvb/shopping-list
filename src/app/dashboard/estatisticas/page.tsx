'use client'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Lightbulb } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import type { ItemSummary } from '@/types'

const monthNames: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
}

export default function EstatisticasPage() {
  const mounted = useMounted()
  const history = useAppStore((s) => s.history)

  if (!mounted) return null

  const totalSpent = history.reduce((s, h) => s + h.totalActual, 0)
  const avgPerList = history.length > 0 ? Math.round(totalSpent / history.length) : 0

  const categoryMap: Record<string, { name: string; total: number }> = {}
  const itemFrequency: Record<string, { name: string; count: number }> = {}

  for (const h of history) {
    for (const item of h.itemsSummary as ItemSummary[]) {
      if (!item.isPurchased) continue
      const price = (item.actualPrice ?? item.estimatedPrice ?? 0) * item.quantity
      const cat = item.category ?? 'Outros'
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, total: 0 }
      categoryMap[cat].total += price

      const key = item.name.toLowerCase()
      if (!itemFrequency[key]) itemFrequency[key] = { name: item.name, count: 0 }
      itemFrequency[key].count += item.quantity
    }
  }

  const categoryStats = Object.values(categoryMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
  const topItems = Object.values(itemFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  const suggestions = topItems.slice(0, 5)
  const maxCategory = categoryStats[0]?.total ?? 1

  const monthlyMap: Record<string, number> = {}
  for (const h of history) {
    const key = h.completedAt.slice(0, 7)
    if (!monthlyMap[key]) monthlyMap[key] = 0
    monthlyMap[key] += h.totalActual
  }
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }))
  const maxMonthly = Math.max(...monthly.map((m) => m.total), 1)

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)]">Nenhum dado ainda</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Conclua listas de compras para ver suas estatísticas
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Total gasto</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Listas concluídas</p>
            <p className="text-xl font-bold mt-1">{history.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Média por lista</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(avgPerList)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Item mais comprado</p>
            <p className="text-xl font-bold mt-1 truncate">{topItems[0]?.name ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryStats.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat.name}</span>
                  <span className="font-medium">{formatCurrency(Math.round(cat.total))}</span>
                </div>
                <div className="w-full bg-[var(--secondary)] rounded-full h-2">
                  <div
                    className="bg-[var(--primary)] h-2 rounded-full"
                    style={{ width: `${(cat.total / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {monthly.map(({ month, total }) => {
                const [, m] = month.split('-')
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span
                      className="text-xs text-[var(--muted-foreground)]"
                      style={{ fontSize: '10px' }}
                    >
                      {formatCurrency(total)}
                    </span>
                    <div
                      className="w-full bg-[var(--primary)] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${(total / maxMonthly) * 100}px`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">{monthNames[m]}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens mais comprados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] w-4">{i + 1}.</span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {Math.round(item.count)}x
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Sugestões inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Baseado no histórico, você costuma comprar:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <span
                  key={item.name}
                  className="px-3 py-1.5 bg-[var(--secondary)] rounded-full text-sm flex items-center gap-1"
                >
                  🛒 {item.name}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    ({Math.round(item.count)}x)
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
