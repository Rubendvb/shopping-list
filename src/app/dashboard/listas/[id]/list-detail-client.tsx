'use client'
import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ArrowLeft,
  Pencil,
  Copy,
  Share2,
  MoreVertical,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, calcEstimated, calcActual } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { normalizeUnit, unitAbbr } from '@/lib/units'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Item } from '@/types'
import { BudgetCard } from './components/budget-card'
import { SortableItemCard, priorityOrder } from './components/item-card'
import { EditItemDialog } from './components/edit-item-dialog'
import { AddItemForm } from './components/add-item-form'

export function ListDetailClient({ listId }: { listId: string }) {
  const router = useRouter()
  const mounted = useMounted()

  const list = useAppStore((s) => s.lists.find((l) => l.id === listId))
  const listItems = useAppStore(useShallow((s) => s.items.filter((i) => i.listId === listId)))
  const categories = useAppStore((s) => s.categories)
  const stores = useAppStore((s) => s.stores)
  const priceHistory = useAppStore((s) => s.priceHistory)
  const storeUpdateItem = useAppStore((s) => s.updateItem)
  const storeDeleteItem = useAppStore((s) => s.deleteItem)
  const storeCompleteList = useAppStore((s) => s.completeList)
  const storeUpdateList = useAppStore((s) => s.updateList)
  const storeDuplicateList = useAppStore((s) => s.duplicateList)
  const storeReorderItems = useAppStore((s) => s.reorderItems)

  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  const [shoppingMode, setShoppingMode] = useState(false)
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)
  const [editListOpen, setEditListOpen] = useState(false)
  const [editListName, setEditListName] = useState('')
  const [editListDescription, setEditListDescription] = useState('')
  const [editListBudget, setEditListBudget] = useState<number | undefined>(undefined)
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filtered = useMemo(() => {
    return listItems
      .filter((item) => {
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
        if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false
        if (filterStatus === 'purchased' && !item.isPurchased) return false
        if (filterStatus === 'pending' && item.isPurchased) return false
        return true
      })
      .sort((a, b) => {
        const orderTie = (a.order ?? Infinity) - (b.order ?? Infinity)
        if (sortBy === 'manual') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          return orderTie
        }
        if (sortBy === 'priority') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          return priorityOrder[a.priority] - priorityOrder[b.priority] || orderTie
        }
        if (sortBy === 'store') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          const storeA = stores.find((s) => s.id === a.storeId)?.name ?? '￿'
          const storeB = stores.find((s) => s.id === b.storeId)?.name ?? '￿'
          return storeA.localeCompare(storeB) || a.name.localeCompare(b.name)
        }
        if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
        const catA = categories.find((c) => c.id === a.categoryId)?.name ?? ''
        const catB = categories.find((c) => c.id === b.categoryId)?.name ?? ''
        if (sortBy === 'category') return catA.localeCompare(catB) || orderTie
        if (sortBy === 'name') return a.name.localeCompare(b.name) || orderTie
        return orderTie
      })
  }, [listItems, search, filterCategory, filterStatus, sortBy, categories, stores])

  // Compute price status per item for badges
  const priceStatusMap = useMemo(() => {
    const map = new Map<string, { status: 'best' | 'better-elsewhere'; betterStoreNames?: string[] }>()
    for (const item of listItems) {
      if (!item.estimatedPrice || !item.storeId) continue
      const productKey = item.name.toLowerCase().trim()
      const relevant = priceHistory.filter((r) => r.productKey === productKey)
      if (!relevant.length) continue

      const byStore = new Map<string, number>()
      for (const r of [...relevant].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))) {
        if (!byStore.has(r.storeId)) byStore.set(r.storeId, r.price)
      }

      let betterPrice = item.estimatedPrice
      for (const [sid, p] of byStore) {
        if (sid === item.storeId) continue
        if (p < betterPrice) betterPrice = p
      }

      if (betterPrice < item.estimatedPrice) {
        const betterStoreNames: string[] = []
        for (const [sid, p] of byStore) {
          if (sid === item.storeId) continue
          if (p === betterPrice) {
            const name = stores.find((s) => s.id === sid)?.name
            if (name) betterStoreNames.push(name)
          }
        }
        if (betterStoreNames.length > 0) {
          map.set(item.id, { status: 'better-elsewhere', betterStoreNames })
        }
      } else if (byStore.size > 1) {
        const minPrice = Math.min(...byStore.values())
        if (item.estimatedPrice <= minPrice) {
          map.set(item.id, { status: 'best' })
        }
      }
    }
    return map
  }, [listItems, priceHistory, stores])

  // Groups for "por loja" view
  const storeGroups = useMemo(() => {
    if (sortBy !== 'store') return null
    const groups = new Map<string | undefined, Item[]>()
    for (const item of filtered) {
      const key = item.storeId
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (!a) return 1
      if (!b) return -1
      const nameA = stores.find((s) => s.id === a)?.name ?? ''
      const nameB = stores.find((s) => s.id === b)?.name ?? ''
      return nameA.localeCompare(nameB)
    })
  }, [filtered, sortBy, stores])

  if (!mounted) return (
    <div className="space-y-6 pb-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-3">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
  if (!list) notFound()

  const estimated = calcEstimated(listItems)
  const actual = calcActual(listItems)
  const purchased = listItems.filter((i) => i.isPurchased).length
  const progress = listItems.length > 0 ? (purchased / listItems.length) * 100 : 0

  function toggleItem(itemId: string, isPurchased: boolean) {
    storeUpdateItem(itemId, { isPurchased })
  }

  function deleteItem(itemId: string) {
    storeDeleteItem(itemId)
    toast('Item removido', 'destructive')
  }

  function executeCompleteList() {
    storeCompleteList(listId)
    toast('Lista concluída e salva no histórico!', 'success')
  }

  function handleDuplicateList() {
    const newId = storeDuplicateList(listId)
    toast('Lista duplicada', 'success')
    router.push(`/dashboard/listas/${newId}`)
  }

  function openEditList() {
    if (!list) return
    setEditListName(list.name)
    setEditListDescription(list.description ?? '')
    setEditListBudget(list.budget)
    setEditListOpen(true)
  }

  function saveEditList() {
    if (!editListName.trim()) return
    storeUpdateList(listId, {
      name: editListName.trim(),
      description: editListDescription.trim() || undefined,
      budget: editListBudget !== undefined ? editListBudget / 100 : null,
    })
    setEditListOpen(false)
    toast('Lista atualizada', 'success')
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filtered.findIndex((i) => i.id === active.id)
    const newIndex = filtered.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newFiltered = arrayMove(filtered, oldIndex, newIndex)

    const allSorted = [...listItems].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    const filteredIdSet = new Set(filtered.map((i) => i.id))
    const positions = allSorted.reduce<number[]>((acc, item, idx) => {
      if (filteredIdSet.has(item.id)) acc.push(idx)
      return acc
    }, [])

    const newAll = [...allSorted]
    positions.forEach((pos, i) => {
      newAll[pos] = newFiltered[i]
    })

    storeReorderItems(listId, newAll.map((i) => i.id))
  }

  function buildShareText(): string {
    if (!list) return ''
    const d = new Date()
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const header = `${list.name} - ${day}/${month}`

    const sorted = [...listItems].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'category') {
        const catA = categories.find((c) => c.id === a.categoryId)?.name ?? ''
        const catB = categories.find((c) => c.id === b.categoryId)?.name ?? ''
        return catA.localeCompare(catB)
      }
      if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    const lines = sorted.map((item) => {
      const prefix = item.isPurchased ? '✓' : '□'
      const unit = normalizeUnit(item.unit)
      const qtyStr =
        unit && unit !== 'UN'
          ? `${item.quantity}${unitAbbr(unit)}`
          : item.quantity !== 1
            ? `${item.quantity}x`
            : ''
      const price = item.isPurchased
        ? (item.actualPrice ?? item.estimatedPrice)
        : item.estimatedPrice
      const totalCents = price !== undefined ? Math.round(price * item.quantity) : undefined
      const priceStr = totalCents !== undefined ? ` - ${formatCurrency(totalCents)}` : ''
      const namePart = qtyStr ? `${item.name} ${qtyStr}` : item.name
      return `${prefix} ${namePart}${priceStr}`
    })

    return [header, ...lines].join('\n')
  }

  async function shareList() {
    if (!list) return
    const text = buildShareText()
    const nav = window.navigator

    if ('share' in nav) {
      try {
        await nav.share({ title: list.name, text })
        toast('Lista compartilhada!', 'success')
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          toast('Não foi possível compartilhar a lista', 'destructive')
        }
      }
    } else {
      try {
        await window.navigator.clipboard.writeText(text)
        toast('Lista copiada para a área de transferência', 'success')
      } catch {
        toast('Não foi possível compartilhar a lista', 'destructive')
      }
    }
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/listas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{list.name}</h1>
            {list.isCompleted && <Badge variant="success">Concluída</Badge>}
          </div>
          {list.description && (
            <p className="text-[var(--muted-foreground)] text-sm mt-1">{list.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!list.isCompleted && (
            <Button
              variant={shoppingMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShoppingMode((v) => !v)}
              aria-label="Modo de compras"
              aria-pressed={shoppingMode}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{shoppingMode ? 'Sair' : 'Compras'}</span>
            </Button>
          )}

          {!shoppingMode && (
            <>
              <div className="hidden md:flex items-center gap-1.5">
                {!list.isCompleted && (
                  <Button variant="ghost" size="icon" onClick={openEditList} aria-label="Editar lista">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleDuplicateList} aria-label="Duplicar lista">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={shareList} aria-label="Compartilhar lista">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mais opções">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!list.isCompleted && (
                    <DropdownMenuItem onClick={openEditList}>
                      <Pencil className="h-4 w-4" />
                      Editar lista
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDuplicateList}>
                    <Copy className="h-4 w-4" />
                    Duplicar lista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={shareList}>
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!list.isCompleted && !shoppingMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCompleteOpen(true)}
              aria-label="Concluir lista"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Concluir</span>
            </Button>
          )}
        </div>
      </div>

      {/* Shopping mode progress bar */}
      {shoppingMode && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
            <span>{purchased}/{listItems.length} itens</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Budget card */}
      {!shoppingMode && (
        <BudgetCard
          list={list}
          estimated={estimated}
          actual={actual}
          purchased={purchased}
          total={listItems.length}
          progress={progress}
        />
      )}

      {/* Filters */}
      {!shoppingMode && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <Input
              ref={searchInputRef}
              className={search ? 'pl-8 pr-8' : 'pl-8'}
              placeholder="Buscar item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchInputRef.current?.focus() }}
                aria-label="Limpar busca"
                className="absolute right-0 top-0 h-full px-2.5 flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="purchased">Comprados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
              <SelectItem value="store">Por loja</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            {listItems.length === 0
              ? 'Adicione o primeiro item à lista'
              : 'Nenhum item encontrado'}
          </div>
        )}

        {storeGroups ? (
          // Store-grouped view
          <div className="space-y-5">
            {storeGroups.map(([gStoreId, groupItems]) => {
              const store = stores.find((s) => s.id === gStoreId)
              return (
                <div key={gStoreId ?? 'no-store'} className="space-y-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                    <span className="text-base">{store?.icon ?? '🏪'}</span>
                    <span className="text-sm font-semibold">
                      {store?.name ?? 'Sem loja'}
                    </span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {groupItems.length} ite{groupItems.length === 1 ? 'm' : 'ns'}
                    </Badge>
                  </div>
                  {groupItems.map((item) => {
                    const ps = priceStatusMap.get(item.id)
                    return (
                      <SortableItemCard
                        key={item.id}
                        item={item}
                        isDraggable={false}
                        shoppingMode={shoppingMode}
                        isCompleted={!!list.isCompleted}
                        categories={categories}
                        stores={stores}
                        priceStatus={ps?.status}
                        betterStoreNames={ps?.betterStoreNames}
                        onToggle={toggleItem}
                        onEdit={setEditingItem}
                        onDelete={deleteItem}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        ) : (
          // Flat list with DnD support
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {filtered.map((item) => {
                const ps = priceStatusMap.get(item.id)
                return (
                  <SortableItemCard
                    key={item.id}
                    item={item}
                    isDraggable={sortBy === 'manual' && !shoppingMode && !list.isCompleted}
                    shoppingMode={shoppingMode}
                    isCompleted={!!list.isCompleted}
                    categories={categories}
                    stores={stores}
                    priceStatus={ps?.status}
                    betterStoreNames={ps?.betterStoreNames}
                    onToggle={toggleItem}
                    onEdit={setEditingItem}
                    onDelete={deleteItem}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Mobile spacer */}
      {!list.isCompleted && !shoppingMode && (
        <div className="h-24 md:hidden" aria-hidden="true" />
      )}

      {/* Add item form */}
      {!list.isCompleted && !shoppingMode && (
        <AddItemForm listId={listId} categories={categories} stores={stores} />
      )}

      {/* Edit item dialog */}
      <EditItemDialog
        item={editingItem}
        categories={categories}
        stores={stores}
        onClose={() => setEditingItem(null)}
      />

      {/* Complete list confirmation */}
      <ConfirmDialog
        open={confirmCompleteOpen}
        onOpenChange={setConfirmCompleteOpen}
        title="Concluir lista"
        description={
          purchased === 0
            ? 'Nenhum item foi marcado como comprado. Deseja concluir mesmo assim?'
            : 'A lista será salva no histórico e não poderá mais ser editada.'
        }
        confirmLabel="Concluir"
        variant={purchased === 0 ? 'destructive' : 'default'}
        onConfirm={executeCompleteList}
      />

      {/* Edit list dialog */}
      <Dialog open={editListOpen} onOpenChange={setEditListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                autoFocus
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEditList()}
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                placeholder="Opcional"
                value={editListDescription}
                onChange={(e) => setEditListDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Orçamento (R$)</Label>
              <CurrencyInput value={editListBudget} onChange={setEditListBudget} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditListOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={saveEditList} disabled={!editListName.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
