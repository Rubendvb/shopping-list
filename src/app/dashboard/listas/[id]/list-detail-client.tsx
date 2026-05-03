'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Copy,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  Search,
  SlidersHorizontal,
  ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, cn } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { UNITS, normalizeUnit, unitAbbr } from '@/lib/units'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Priority, Unit, Item } from '@/types'

const priorityLabel = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }
const priorityColor = {
  HIGH: 'destructive' as const,
  MEDIUM: 'warning' as const,
  LOW: 'secondary' as const,
}
const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }

export function ListDetailClient({ listId }: { listId: string }) {
  const router = useRouter()
  const mounted = useMounted()

  const list = useAppStore((s) => s.lists.find((l) => l.id === listId))
  const allItems = useAppStore((s) => s.items)
  const categories = useAppStore((s) => s.categories)
  const storeAddItem = useAppStore((s) => s.addItem)
  const storeUpdateItem = useAppStore((s) => s.updateItem)
  const storeDeleteItem = useAppStore((s) => s.deleteItem)
  const storeCompleteList = useAppStore((s) => s.completeList)
  const storeUpdateList = useAppStore((s) => s.updateList)
  const storeDuplicateList = useAppStore((s) => s.duplicateList)

  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  const [itemName, setItemName] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemUnit, setItemUnit] = useState<Unit | ''>('')
  const [itemPrice, setItemPrice] = useState<number | undefined>(undefined)
  const [itemCategory, setItemCategory] = useState('')
  const [itemPriority, setItemPriority] = useState<Priority>('MEDIUM')

  const [shoppingMode, setShoppingMode] = useState(false)
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)
  const [editListOpen, setEditListOpen] = useState(false)
  const [editListName, setEditListName] = useState('')
  const [editListDescription, setEditListDescription] = useState('')
  const [editListBudget, setEditListBudget] = useState<number | undefined>(undefined)

  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editName, setEditName] = useState('')
  const [editQty, setEditQty] = useState('1')
  const [editUnit, setEditUnit] = useState<Unit | ''>('')
  const [editPrice, setEditPrice] = useState<number | undefined>(undefined)
  const [editActualPrice, setEditActualPrice] = useState<number | undefined>(undefined)
  const [editCategory, setEditCategory] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM')
  const [editNotes, setEditNotes] = useState('')

  const listItems = useMemo(() => allItems.filter((i) => i.listId === listId), [allItems, listId])

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
        if (sortBy === 'priority') {
          if (a.isPurchased !== b.isPurchased) return a.isPurchased ? 1 : -1
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        const catA = categories.find((c) => c.id === a.categoryId)?.name ?? ''
        const catB = categories.find((c) => c.id === b.categoryId)?.name ?? ''
        if (sortBy === 'category') return catA.localeCompare(catB)
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return 0
      })
  }, [listItems, search, filterCategory, filterStatus, sortBy, categories])

  if (!mounted) return null
  if (!list) notFound()

  const estimated = listItems.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0)
  const actual = listItems
    .filter((i) => i.isPurchased)
    .reduce((s, i) => s + (i.actualPrice ?? i.estimatedPrice ?? 0) * i.quantity, 0)
  const purchased = listItems.filter((i) => i.isPurchased).length
  const progress = listItems.length > 0 ? (purchased / listItems.length) * 100 : 0
  const overBudget = list.budget && estimated > list.budget
  const budgetUsedPct = list.budget ? Math.round((estimated / list.budget) * 100) : 0
  const budgetDiff = list.budget ? Math.round(estimated) - list.budget : 0

  function addItem() {
    if (!itemName.trim()) return
    storeAddItem({
      listId,
      name: itemName.trim(),
      quantity: parseFloat(itemQty) || 1,
      unit: itemUnit || undefined,
      estimatedPrice: itemPrice !== undefined ? itemPrice / 100 : undefined,
      categoryId: itemCategory || undefined,
      priority: itemPriority,
    })
    setItemName('')
    setItemQty('1')
    setItemUnit('')
    setItemPrice(undefined)
    setItemCategory('')
    setItemPriority('MEDIUM')
    setShowAdd(false)
    toast('Item adicionado', 'success')
  }

  function toggleItem(itemId: string, isPurchased: boolean) {
    storeUpdateItem(itemId, { isPurchased })
  }

  function deleteItem(itemId: string) {
    storeDeleteItem(itemId)
    toast('Item removido', 'destructive')
  }

  function completeList() {
    setConfirmCompleteOpen(true)
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

  function openEdit(item: Item) {
    setEditingItem(item)
    setEditName(item.name)
    setEditQty(String(item.quantity))
    setEditUnit(normalizeUnit(item.unit) ?? '')
    setEditPrice(item.estimatedPrice)
    setEditActualPrice(item.actualPrice)
    setEditCategory(item.categoryId ?? '')
    setEditPriority(item.priority)
    setEditNotes(item.notes ?? '')
  }

  function saveEdit() {
    if (!editingItem || !editName.trim()) return
    storeUpdateItem(editingItem.id, {
      name: editName.trim(),
      quantity: parseFloat(editQty) || 1,
      unit: editUnit || undefined,
      estimatedPrice: editPrice !== undefined ? editPrice / 100 : undefined,
      actualPrice: editActualPrice !== undefined ? editActualPrice / 100 : undefined,
      categoryId: editCategory || undefined,
      priority: editPriority,
      notes: editNotes.trim() || undefined,
    })
    setEditingItem(null)
    toast('Item salvo')
  }

  return (
    <div className="space-y-6 pb-20">
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
        <div className="flex items-center gap-2">
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
          {!list.isCompleted && !shoppingMode && (
            <Button variant="ghost" size="icon" onClick={openEditList} aria-label="Editar lista">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {!shoppingMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDuplicateList}
              aria-label="Duplicar lista"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {!list.isCompleted && !shoppingMode && (
            <Button variant="outline" size="sm" onClick={completeList}>
              <CheckCircle2 className="h-4 w-4" />
              Concluir
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
      {!shoppingMode && <Card className={cn(overBudget && 'border-red-400 transition-colors duration-500')}>
        <CardContent className="p-4 space-y-4">
          {/* Items progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Progresso</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {purchased}/{listItems.length} itens
              </span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Budget progress */}
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

              {/* Colored budget bar */}
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

              {/* Status message */}
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

          {/* Values */}
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
      </Card>}

      {/* Filters */}
      {!shoppingMode && <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            className="pl-8"
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          </SelectContent>
        </Select>
      </div>}

      {/* Items list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            {listItems.length === 0 ? 'Adicione o primeiro item à lista' : 'Nenhum item encontrado'}
          </div>
        )}
        {filtered.map((item) => {
          const category = categories.find((c) => c.id === item.categoryId)
          return (
            <Card
              key={item.id}
              className={cn('transition-opacity group', item.isPurchased && 'opacity-60')}
            >
              <CardContent className={cn('flex items-center gap-3', shoppingMode ? 'p-4' : 'p-3')}>
                <button
                  onClick={() => toggleItem(item.id, !item.isPurchased)}
                  className="shrink-0"
                  disabled={!!list.isCompleted}
                >
                  {item.isPurchased ? (
                    <CheckCircle2 className={cn(shoppingMode ? 'h-8 w-8' : 'h-5 w-5', 'text-green-500')} />
                  ) : (
                    <Circle className={cn(shoppingMode ? 'h-8 w-8' : 'h-5 w-5', 'text-[var(--muted-foreground)]')} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'font-medium',
                        shoppingMode && 'text-lg',
                        item.isPurchased && 'line-through text-[var(--muted-foreground)]'
                      )}
                    >
                      {item.name}
                    </span>
                    <span className={cn('text-[var(--muted-foreground)]', shoppingMode ? 'text-base' : 'text-sm')}>
                      {item.quantity}
                      {normalizeUnit(item.unit) ? ` ${unitAbbr(normalizeUnit(item.unit)!)}` : 'x'}
                    </span>
                    {!shoppingMode && (
                      <>
                        <Badge variant={priorityColor[item.priority]} className="text-xs">
                          {priorityLabel[item.priority]}
                        </Badge>
                        {category && (
                          <span className="text-xs bg-[var(--secondary)] px-1.5 py-0.5 rounded">
                            {category.icon} {category.name}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!shoppingMode && item.notes && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                      {item.notes}
                    </p>
                  )}
                </div>

                {!shoppingMode && (
                  <div className="text-right shrink-0">
                    {item.estimatedPrice && (
                      <p className="text-sm font-medium">
                        {formatCurrency(Math.round(item.estimatedPrice * item.quantity))}
                      </p>
                    )}
                    {item.estimatedPrice && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatCurrency(item.estimatedPrice)}/un
                      </p>
                    )}
                  </div>
                )}

                {!list.isCompleted && !shoppingMode && (
                  <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => openEdit(item)}
                      aria-label="Editar item"
                      className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      aria-label="Excluir item"
                      className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add item FAB / inline form */}
      {!list.isCompleted && !shoppingMode && (
        <>
          <Button
            className="fixed bottom-6 right-6 shadow-lg rounded-full h-12 w-12 p-0 md:hidden"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>

          <Card className="hidden md:block">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Adicionar item</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    placeholder="Ex: Arroz"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidade</Label>
                  <Select value={itemUnit} onValueChange={(v) => setItemUnit(v as Unit)}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.abbr} — {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preço (R$)</Label>
                  <CurrencyInput value={itemPrice} onChange={setItemPrice} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prioridade</Label>
                  <Select
                    value={itemPriority}
                    onValueChange={(v) => setItemPriority(v as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">🔴 Alta</SelectItem>
                      <SelectItem value="MEDIUM">🟡 Média</SelectItem>
                      <SelectItem value="LOW">🟢 Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={addItem} disabled={!itemName.trim()}>
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Mobile add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Arroz"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Select value={itemUnit} onValueChange={(v) => setItemUnit(v as Unit)}>
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.abbr} — {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Preço estimado (R$)</Label>
              <CurrencyInput value={itemPrice} onChange={setItemPrice} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={itemCategory} onValueChange={setItemCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Select value={itemPriority} onValueChange={(v) => setItemPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">🔴 Alta</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Média</SelectItem>
                  <SelectItem value="LOW">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={addItem} disabled={!itemName.trim()}>
              Adicionar item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCompleteOpen}
        onOpenChange={setConfirmCompleteOpen}
        title="Concluir lista"
        description="A lista será salva no histórico e não poderá mais ser editada."
        confirmLabel="Concluir"
        variant="default"
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

      {/* Edit item dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Select value={editUnit} onValueChange={(v) => setEditUnit(v as Unit)}>
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.abbr} — {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Preço estimado (R$)</Label>
                <CurrencyInput value={editPrice} onChange={setEditPrice} />
              </div>
              <div className="space-y-1">
                <Label>Preço real (R$)</Label>
                <CurrencyInput value={editActualPrice} onChange={setEditActualPrice} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">🔴 Alta</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Média</SelectItem>
                  <SelectItem value="LOW">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Input
                placeholder="Observações sobre o item..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={saveEdit} disabled={!editName.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
