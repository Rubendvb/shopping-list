'use client'
import { CheckCircle2, Minus, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PriceAlert } from '@/lib/price-alert'

interface PriceAlertBannerProps {
  alert: PriceAlert | null
}

export function PriceAlertBanner({ alert }: PriceAlertBannerProps) {
  if (!alert) return null

  if (alert.status === 'best') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 px-2.5 py-2 rounded-md">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Melhor preço registrado</span>
      </div>
    )
  }

  if (alert.status === 'tie') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-2 rounded-md">
        <Minus className="h-3.5 w-3.5 shrink-0" />
        <span>
          Empate com <strong>{alert.tiedStoreNames.join(', ')}</strong>
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2.5 py-2 rounded-md">
      <TrendingDown className="h-3.5 w-3.5 shrink-0" />
      <span>
        Economize <strong>{formatCurrency(alert.savings)}</strong> no{' '}
        <strong>{alert.betterStoreNames.join(', ')}</strong>
      </span>
    </div>
  )
}
