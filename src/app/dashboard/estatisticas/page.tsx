'use client'
import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, Lightbulb, Plus, ShoppingCart, Calendar } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { toast } from '@/hooks/use-toast'
import type { ItemSummary } from '@/types'

const monthNames: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

const periodOptions = [
  { value: 'last-month', label: 'Último mês' },
  { value: 'last-3-months', label: 'Últimos 3 meses' },
  { value: 'last-6-months', label: 'Últimos 6 meses' },
  { value: 'this-year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
] as const

type Period = (typeof periodOptions)[number]['value']

interface Suggestion {
  name: string
  count: number
  category?: string
}

export default function EstatisticasPage() {
  const mounted = useMounted()
  const history = useAppStore((s) => s.history)
  const lists = useAppStore((s) => s.lists)
  const categories = useAppStore((s) => s.categories)
  const addItem = useAppStore((s) => s.addItem)

  const [period, setPeriod] = useState<Period>('all')
  const [dialogItem, setDialogItem] = useState<Suggestion | null>(null)
  const [selectedListId, setSelectedListId] = useState('')

  // ── filtered history ────────────────────────────────────────────────────────

  const filteredHistory = useMemo(() => {
    if (period === 'all') return history
    const now = new Date()
    let cutoff: Date
    if (period === 'last-month') cutoff = new Date(now.getTime() - 30 * 86_400_000)
    else if (period === 'last-3-months') cutoff = new Date(now.getTime() - 90 * 86_400_000)
    else if (period === 'last-6-months') cutoff = new Date(now.getTime() - 180 * 86_400_000)
    else cutoff = new Date(now.getFullYear(), 0, 1) // this-year
    return history.filter((h) => {
      try {
        return new Date(h.completedAt) >= cutoff
      } catch {
        return false
      }
    })
  }, [history, period])

  // ── computed stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalSpent = filteredHistory.reduce((s, h) => s + h.totalActual, 0)
    const avgPerList = filteredHistory.length > 0 ? Math.round(totalSpent / filteredHistory.length) : 0

    const categoryMap: Record<string, { name: string; total: number }> = {}
    const itemFrequency: Record<string, Suggestion> = {}

    for (const h of filteredHistory) {
      for (const item of h.itemsSummary as ItemSummary[]) {
        if (!item.isPurchased) continue
        const price = (item.actualPrice ?? item.estimatedPrice ?? 0) * item.quantity
        const cat = item.category ?? 'Outros'
        if (!categoryMap[cat]) categoryMap[cat] = { name: cat, total: 0 }
        categoryMap[cat].total += price

        const key = item.name.toLowerCase()
        if (!itemFrequency[key]) itemFrequency[key] = { name: item.name, count: 0 }
        itemFrequency[key].count += item.quantity
        if (item.category && !itemFrequency[key].category) {
          itemFrequency[key].category = item.category
        }
      }
    }

    const categoryStats = Object.values(categoryMap).sort((a, b) => b.total - a.total).slice(0, 8)
    const topItems = Object.values(itemFrequency).sort((a, b) => b.count - a.count).slice(0, 10)
    const suggestions = topItems.slice(0, 5)
    const maxCategory = categoryStats[0]?.total ?? 1

    const monthlyMap: Record<string, number> = {}
    for (const h of filteredHistory) {
      const key = h.completedAt.slice(0, 7)
      if (!monthlyMap[key]) monthlyMap[key] = 0
      monthlyMap[key] += h.totalActual
    }
    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, total }))
    const maxMonthly = Math.max(...monthly.map((m) => m.total), 1)

    return { totalSpent, avgPerList, categoryStats, topItems, suggestions, maxCategory, monthly, maxMonthly }
  }, [filteredHistory])

  const activeLists = useMemo(() => lists.filter((l) => !l.isCompleted), [lists])

  // ── early returns (after all hooks) ────────────────────────────────────────

  if (!mounted) return null

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

  // ── suggestion dialog handlers ──────────────────────────────────────────────

  function openSuggestionDialog(suggestion: Suggestion) {
    setSelectedListId(activeLists[0]?.id ?? '')
    setDialogItem(suggestion)
  }

  function confirmAddSuggestion() {
    if (!dialogItem || !selectedListId) return
    const categoryId = dialogItem.category
      ? categories.find((c) => c.name === dialogItem.category)?.id
      : undefined
    const listName = lists.find((l) => l.id === selectedListId)?.name ?? ''
    addItem({ listId: selectedListId, name: dialogItem.name, quantity: 1, categoryId, priority: 'MEDIUM' })
    toast(`"${dialogItem.name}" adicionado em ${listName}`, 'success')
    setDialogItem(null)
    setSelectedListId('')
  }

  const { totalSpent, avgPerList, categoryStats, topItems, suggestions, maxCategory, monthly, maxMonthly } = stats

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty period state */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-[var(--muted-foreground)] mb-3" />
            <p className="text-[var(--muted-foreground)]">Sem dados para este período</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Tente selecionar um intervalo mais amplo
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
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
                <p className="text-xl font-bold mt-1">{filteredHistory.length}</p>
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
                        <span className="text-[var(--muted-foreground)]" style={{ fontSize: '10px' }}>
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
                    <button
                      key={item.name}
                      onClick={() => openSuggestionDialog(item)}
                      className="px-3 py-1.5 bg-[var(--secondary)] rounded-full text-sm flex items-center gap-1.5 hover:bg-[var(--accent)] transition-colors group"
                      aria-label={`Adicionar ${item.name} a uma lista`}
                    >
                      🛒 {item.name}
                      <span className="text-xs text-[var(--muted-foreground)]">
                        ({Math.round(item.count)}x)
                      </span>
                      <Plus className="h-3.5 w-3.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add-to-list dialog */}
      <Dialog open={!!dialogItem} onOpenChange={(open) => !open && setDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à lista</DialogTitle>
          </DialogHeader>
          {activeLists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ShoppingCart className="h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                Nenhuma lista ativa. Crie uma lista primeiro para adicionar itens.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <p className="text-sm">
                Adicionando <span className="font-semibold">{dialogItem?.name}</span> em:
              </p>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a lista" />
                </SelectTrigger>
                <SelectContent>
                  {activeLists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogItem(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={confirmAddSuggestion} disabled={!selectedListId}>
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
