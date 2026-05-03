'use client'
import { useState } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { History, TrendingUp, TrendingDown, ChevronDown, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { Skeleton } from '@/components/ui/skeleton'
import { unitAbbr, normalizeUnit } from '@/lib/units'
import type { ItemSummary } from '@/types'

function ItemRow({ item }: { item: ItemSummary }) {
  const unit = normalizeUnit(item.unit)
  return (
    <div className="flex items-center justify-between py-1.5 gap-3">
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm', !item.isPurchased && 'text-[var(--muted-foreground)]')}>
          {item.name}
        </span>
        <span className="text-xs text-[var(--muted-foreground)] ml-1.5">
          {item.quantity}
          {unit ? ` ${unitAbbr(unit)}` : 'x'}
        </span>
        {item.category && (
          <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">· {item.category}</span>
        )}
      </div>
      <div className="text-right shrink-0 text-xs space-y-0.5">
        {item.actualPrice != null && (
          <p className="font-medium text-green-600">
            {formatCurrency(Math.round(item.actualPrice * item.quantity))}
          </p>
        )}
        {item.estimatedPrice != null && item.actualPrice == null && (
          <p className="text-[var(--muted-foreground)]">
            {formatCurrency(Math.round(item.estimatedPrice * item.quantity))}
          </p>
        )}
        {item.estimatedPrice != null && item.actualPrice != null && (
          <p className="text-[var(--muted-foreground)] line-through">
            {formatCurrency(Math.round(item.estimatedPrice * item.quantity))}
          </p>
        )}
      </div>
    </div>
  )
}

export default function HistoricoPage() {
  const mounted = useMounted()
  const history = useAppStore((s) => s.history)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!mounted) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-16 rounded-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Histórico de Compras</h1>

      {history.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <History className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)]">Nenhum histórico ainda</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Conclua uma lista para registrar no histórico
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((h) => {
            const diff = h.totalActual - h.totalEstimated
            const saved = diff < 0
            const isExpanded = expandedId === h.id
            const purchased = h.itemsSummary.filter((i) => i.isPurchased)
            const notPurchased = h.itemsSummary.filter((i) => !i.isPurchased)

            return (
              <Card key={h.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Header row — always visible */}
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : h.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{h.listName}</h3>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {new Date(h.completedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                          {' · '}
                          {h.itemCount} itens
                        </p>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-lg leading-tight">
                            {formatCurrency(h.totalActual)}
                          </p>
                          {h.totalEstimated > 0 && diff !== 0 && (
                            <div
                              className={cn(
                                'flex items-center gap-1 text-xs justify-end',
                                saved ? 'text-green-600' : 'text-red-500'
                              )}
                            >
                              {saved ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : (
                                <TrendingUp className="h-3 w-3" />
                              )}
                              {saved ? 'Economizou' : 'Gastou a mais'}{' '}
                              {formatCurrency(Math.abs(diff))}
                            </div>
                          )}
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-[var(--muted-foreground)] mt-1 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </div>
                    </div>

                    {/* Preview pills — only when collapsed */}
                    {!isExpanded && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {purchased.slice(0, 6).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[var(--secondary)] px-2 py-0.5 rounded-full"
                          >
                            {item.name}
                          </span>
                        ))}
                        {purchased.length > 6 && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            +{purchased.length - 6} itens
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {purchased.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs font-semibold text-green-600">
                              Comprados ({purchased.length})
                            </span>
                          </div>
                          <div className="divide-y divide-[var(--border)]">
                            {purchased.map((item, idx) => (
                              <ItemRow key={idx} item={item} />
                            ))}
                          </div>
                        </div>
                      )}

                      {notPurchased.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <XCircle className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                            <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                              Não comprados ({notPurchased.length})
                            </span>
                          </div>
                          <div className="divide-y divide-[var(--border)]">
                            {notPurchased.map((item, idx) => (
                              <ItemRow key={idx} item={item} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Totals footer */}
                      <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)]">Estimado</p>
                          <p className="font-semibold">{formatCurrency(h.totalEstimated)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--muted-foreground)]">Real</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(h.totalActual)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
