'use client'
import { useState } from 'react'
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
import { useStatistics, periodOptions } from '@/hooks/use-statistics'
import { Skeleton } from '@/components/ui/skeleton'
import type { Period, TopItem } from '@/hooks/use-statistics'

const monthNames: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

export default function EstatisticasPage() {
  const mounted = useMounted()
  const categories = useAppStore((s) => s.categories)
  const lists = useAppStore((s) => s.lists)
  const addItem = useAppStore((s) => s.addItem)

  const [period, setPeriod] = useState<Period>('all')
  const [dialogItem, setDialogItem] = useState<TopItem | null>(null)
  const [selectedListId, setSelectedListId] = useState('')

  const {
    hasData,
    filteredHistory,
    totalSpent,
    avgPerList,
    listsCompleted,
    categoryStats,
    maxCategory,
    topItems,
    suggestions,
    monthlyData,
    maxMonthly,
    activeLists,
  } = useStatistics(period)

  if (!mounted) return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3 pt-6">
              <Skeleton className="h-4 w-36 mb-2" />
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  if (!hasData) {
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

  function openSuggestionDialog(suggestion: TopItem) {
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
                <p className="text-xl font-bold mt-1">{listsCompleted}</p>
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
                  {monthlyData.map(({ month, total }) => {
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
