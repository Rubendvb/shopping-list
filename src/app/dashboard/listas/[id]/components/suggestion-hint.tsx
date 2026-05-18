'use client'
import { Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface SuggestionData {
  /** cents */
  minPrice: number
  /** cents — shown only when different from minPrice */
  avgPrice: number
  bestStoreNames: string[]
  bestStoreId: string
}

interface SuggestionHintProps {
  data: SuggestionData
  onApply: () => void
}

export function SuggestionHint({ data, onApply }: SuggestionHintProps) {
  const { minPrice, avgPrice, bestStoreNames } = data
  return (
    <div className="flex items-center justify-between gap-2 text-xs bg-secondary border border-border px-2.5 py-2 rounded-md">
      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">
          <strong>{formatCurrency(minPrice)}</strong>
          {' '}no {bestStoreNames.join(', ')}
          {avgPrice !== minPrice && (
            <span className="text-muted-foreground"> · média {formatCurrency(avgPrice)}</span>
          )}
        </span>
      </div>
      <button
        onClick={onApply}
        type="button"
        className="shrink-0 font-medium text-primary hover:underline cursor-pointer whitespace-nowrap"
      >
        Usar →
      </button>
    </div>
  )
}
