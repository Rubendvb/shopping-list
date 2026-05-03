import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/** Extracts only digits from a formatted currency string and returns cents. */
export function parseCurrencyToCents(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0
}

export function toCents(value: string | number): number {
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value
  return Math.round(num * 100)
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

type PriceItem = { estimatedPrice?: number; quantity: number }

/** Total estimated cost (cents) for all items regardless of purchase status. */
export function calcEstimated(items: PriceItem[]): number {
  return items.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0)
}

type ActualItem = {
  actualPrice?: number
  estimatedPrice?: number
  quantity: number
  isPurchased: boolean
}

/**
 * Total actual cost (cents) for purchased items only.
 * Falls back to estimatedPrice when actualPrice is absent.
 */
export function calcActual(items: ActualItem[]): number {
  return items
    .filter((i) => i.isPurchased)
    .reduce((s, i) => s + (i.actualPrice ?? i.estimatedPrice ?? 0) * i.quantity, 0)
}
