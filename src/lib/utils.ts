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
