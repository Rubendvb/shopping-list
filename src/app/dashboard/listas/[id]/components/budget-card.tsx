'use client'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, cn } from '@/lib/utils'
import type { List } from '@/types'

interface BudgetCardProps {
  list: List
  /** cents */
  estimated: number
  /** cents */
  actual: number
  purchased: number
  total: number
  progress: number
}

export function BudgetCard({ list, estimated, actual, purchased, total, progress }: BudgetCardProps) {
  const overBudget = list.budget && estimated > list.budget
  const budgetUsedPct = list.budget ? Math.round((estimated / list.budget) * 100) : 0
  const budgetDiff = list.budget ? Math.round(estimated) - list.budget : 0

  return (
    <Card className={cn(overBudget && 'border-red-400 transition-colors duration-500')}>
      <CardContent className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Progresso</span>
            <span className="text-sm text-[var(--muted-foreground)]">
              {purchased}/{total} itens
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {list.budget && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {overBudget && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                <span className="font-medium text-sm">
                  {overBudget ? 'Orçamento ultrapassado!' : 'Orçamento'}
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  budgetUsedPct >= 100
                    ? 'text-red-500'
                    : budgetUsedPct >= 80
                      ? 'text-orange-500'
                      : 'text-[var(--muted-foreground)]'
                )}
              >
                {budgetUsedPct}%
              </span>
            </div>
            <div className="w-full bg-[var(--secondary)] rounded-full h-2 overflow-hidden mb-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-700',
                  budgetUsedPct >= 100
                    ? 'bg-red-500'
                    : budgetUsedPct >= 80
                      ? 'bg-orange-400'
                      : 'bg-[var(--primary)]'
                )}
                style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
              />
            </div>
            {overBudget ? (
              <p className="text-sm font-medium text-red-500 flex items-center gap-1 animate-pulse">
                <TrendingUp className="h-3.5 w-3.5" />
                Ultrapassou em {formatCurrency(budgetDiff)}
              </p>
            ) : (
              <p
                className={cn(
                  'text-sm font-medium',
                  budgetUsedPct >= 80 ? 'text-orange-500' : 'text-green-600'
                )}
              >
                Restam {formatCurrency(-budgetDiff)}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-[var(--border)]">
          <div>
            <p className="text-[var(--muted-foreground)] text-xs">Estimado</p>
            <p className="font-semibold">{formatCurrency(Math.round(estimated))}</p>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)] text-xs">Real</p>
            <p className="font-semibold text-green-600">{formatCurrency(Math.round(actual))}</p>
          </div>
          {list.budget && (
            <div>
              <p className="text-[var(--muted-foreground)] text-xs">Orçamento</p>
              <p
                className={cn(
                  'font-semibold',
                  overBudget ? 'text-red-500' : 'text-[var(--foreground)]'
                )}
              >
                {formatCurrency(list.budget)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
