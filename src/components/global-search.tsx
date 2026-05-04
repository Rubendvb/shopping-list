'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useEffect, useState, useMemo, useRef } from 'react'
import { Search, X, ListChecks } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/use-app-store'
import { useGlobalSearch } from '@/hooks/use-global-search'
import { formatCurrency, cn } from '@/lib/utils'
import { normalizeUnit, unitAbbr } from '@/lib/units'

export function GlobalSearch() {
  const router = useRouter()
  const isOpen = useGlobalSearch((s) => s.isOpen)
  const open = useGlobalSearch((s) => s.open)
  const close = useGlobalSearch((s) => s.close)

  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const activeLists = useAppStore(useShallow((s) => s.lists.filter((l) => !l.isCompleted)))
  const items = useAppStore(useShallow((s) => s.items))
  const categories = useAppStore((s) => s.categories)

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Reset query on close
  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const activeIds = new Set(activeLists.map((l) => l.id))
    const matching = items.filter(
      (i) => activeIds.has(i.listId) && i.name.toLowerCase().includes(q)
    )

    const grouped = new Map<string, typeof matching>()
    for (const item of matching) {
      if (!grouped.has(item.listId)) grouped.set(item.listId, [])
      grouped.get(item.listId)!.push(item)
    }

    return activeLists
      .filter((l) => grouped.has(l.id))
      .map((list) => ({ list, items: grouped.get(list.id)! }))
  }, [query, activeLists, items])

  const totalCount = results.reduce((s, g) => s + g.items.length, 0)

  function navigate(listId: string) {
    router.push(`/dashboard/listas/${listId}`)
    close()
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[10%] z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Busca global</DialogPrimitive.Title>

          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
            <Search className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar em todas as listas ativas..."
              className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none text-base"
            />
            {query ? (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                aria-label="Limpar busca"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-1.5 py-0.5 rounded font-mono">
                Esc
              </kbd>
            )}
          </div>

          {/* Results area */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!query ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <ListChecks className="h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  Digite para buscar itens em todas as listas ativas
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhum item encontrado para &ldquo;{query}&rdquo;
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="px-4 pb-2 text-xs text-[var(--muted-foreground)]">
                  {totalCount} ite{totalCount !== 1 ? 'ns' : 'm'} em{' '}
                  {results.length} lista{results.length !== 1 ? 's' : ''}
                </p>

                {results.map(({ list, items: groupItems }) => (
                  <div key={list.id}>
                    {/* List header — click goes to the list */}
                    <button
                      onClick={() => navigate(list.id)}
                      className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-[var(--accent)] transition-colors cursor-pointer text-left"
                    >
                      <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide truncate">
                        {list.name}
                      </span>
                      <span className="ml-auto text-xs text-[var(--muted-foreground)] shrink-0">
                        {groupItems.length} → abrir
                      </span>
                    </button>

                    {/* Items in this list */}
                    {groupItems.map((item) => {
                      const category = categories.find((c) => c.id === item.categoryId)
                      const unit = normalizeUnit(item.unit)
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(list.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--accent)] transition-colors cursor-pointer text-left',
                            item.isPurchased && 'opacity-50'
                          )}
                        >
                          <span className="text-sm shrink-0 text-[var(--muted-foreground)]">
                            {item.isPurchased ? '✓' : '□'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                item.isPurchased && 'line-through'
                              )}
                            >
                              {item.name}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)] ml-1.5">
                              {item.quantity}
                              {unit ? ` ${unitAbbr(unit)}` : 'x'}
                            </span>
                            {category && (
                              <span className="text-xs text-[var(--muted-foreground)] ml-1.5">
                                · {category.icon}
                              </span>
                            )}
                          </div>
                          {item.estimatedPrice !== undefined && (
                            <span className="text-xs text-[var(--muted-foreground)] tabular-nums shrink-0">
                              {formatCurrency(item.estimatedPrice)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
