'use client'
import { useRef } from 'react'
import { cn, formatCurrency } from '@/lib/utils'

interface CurrencyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  /** Value in cents (integer). Pass undefined for empty. */
  value: number | undefined
  /** Called with the new value in cents, or undefined when cleared. */
  onChange: (cents: number | undefined) => void
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  const displayValue = value ? formatCurrency(value) : ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    onChange(digits ? parseInt(digits, 10) : undefined)
    // Restore cursor to end after React re-renders the formatted value
    requestAnimationFrame(() => {
      if (ref.current) {
        const len = ref.current.value.length
        ref.current.setSelectionRange(len, len)
      }
    })
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder="R$ 0,00"
      className={cn(
        'flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
        'placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
