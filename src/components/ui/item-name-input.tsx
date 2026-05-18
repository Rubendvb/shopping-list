'use client'
import { useRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import type { ItemSuggestion } from '@/hooks/use-item-suggestions'

interface ItemNameInputProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: ItemSuggestion) => void
  suggestions: ItemSuggestion[]
  placeholder?: string
  autoFocus?: boolean
  /** Called when Enter is pressed with no active suggestion */
  onEnter?: () => void
  id?: string
  className?: string
}

export function ItemNameInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  autoFocus,
  onEnter,
  id,
  className,
}: ItemNameInputProps) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const showDropdown = open && suggestions.length > 0

  // Reset cursor on suggestion list change
  useEffect(() => {
    setActiveIdx(-1)
  }, [suggestions])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, -1))
        return
      }
      if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault()
        pick(suggestions[activeIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
    }
    if (e.key === 'Enter') {
      onEnter?.()
    }
  }

  function pick(s: ItemSuggestion) {
    onSelect(s)
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.productKey}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors md:py-2 ${
                i === activeIdx
                  ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                  : 'hover:bg-[var(--secondary)]'
              }`}
            >
              <span className="flex-1 truncate">{s.displayName}</span>
              {s.price !== undefined && (
                <span className="shrink-0 tabular-nums text-xs text-[var(--muted-foreground)]">
                  {formatCurrency(s.price)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
