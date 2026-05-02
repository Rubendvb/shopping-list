'use client'
import Link from 'next/link'
import { ShoppingCart, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const mounted = useMounted()
  const lists = useAppStore((s) => s.lists)
  const items = useAppStore((s) => s.items)
  const history = useAppStore((s) => s.history)

  if (!mounted) return null

  const activeLists = lists.filter((l) => !l.isCompleted).slice(0, 5)
  const totalSpent = history.reduce((s, h) => s + h.totalActual, 0)
  const avgPerList = history.length > 0 ? Math.round(totalSpent / history.length) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Início</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Resumo das suas compras</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Listas ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-2xl font-bold">
                {lists.filter((l) => !l.isCompleted).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Listas concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{history.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Total gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-xl font-bold">{formatCurrency(totalSpent)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Média por lista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-xl font-bold">{formatCurrency(avgPerList)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Listas ativas</h2>
          <Link href="/dashboard/listas" className="text-sm text-[var(--primary)] hover:underline">
            Ver todas →
          </Link>
        </div>
        {activeLists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <p className="text-[var(--muted-foreground)]">Nenhuma lista ativa</p>
              <Link
                href="/dashboard/listas"
                className="mt-2 text-sm text-[var(--primary)] hover:underline"
              >
                Criar primeira lista
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeLists.map((list) => {
              const listItems = items.filter((i) => i.listId === list.id)
              const purchased = listItems.filter((i) => i.isPurchased).length
              const total = listItems.length
              const estimated = listItems.reduce(
                (s, i) => s + (i.estimatedPrice ?? 0) * i.quantity,
                0
              )
              const progress = total > 0 ? Math.round((purchased / total) * 100) : 0

              return (
                <Link key={list.id} href={`/dashboard/listas/${list.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium truncate">{list.name}</h3>
                        <Badge
                          variant={progress === 100 ? 'success' : 'secondary'}
                          className="ml-2 shrink-0"
                        >
                          {purchased}/{total}
                        </Badge>
                      </div>
                      <div className="w-full bg-[var(--secondary)] rounded-full h-1.5 mb-2">
                        <div
                          className="bg-[var(--primary)] h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                        <span>{progress}% concluído</span>
                        {estimated > 0 && <span>{formatCurrency(Math.round(estimated))}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
