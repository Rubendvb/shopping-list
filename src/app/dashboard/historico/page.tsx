'use client'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { History, TrendingUp, TrendingDown } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'

export default function HistoricoPage() {
  const mounted = useMounted()
  const history = useAppStore((s) => s.history)

  if (!mounted) return null

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

            return (
              <Card key={h.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{h.listName}</h3>
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
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(h.totalActual)}</p>
                      {h.totalEstimated > 0 && diff !== 0 && (
                        <div
                          className={`flex items-center gap-1 text-xs justify-end ${saved ? 'text-green-600' : 'text-red-500'}`}
                        >
                          {saved ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {saved ? 'Economizou' : 'Gastou a mais'} {formatCurrency(Math.abs(diff))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {h.itemsSummary
                      .filter((i) => i.isPurchased)
                      .slice(0, 6)
                      .map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-[var(--secondary)] px-2 py-0.5 rounded-full"
                        >
                          {item.name}
                        </span>
                      ))}
                    {h.itemsSummary.length > 6 && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        +{h.itemsSummary.length - 6} itens
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
