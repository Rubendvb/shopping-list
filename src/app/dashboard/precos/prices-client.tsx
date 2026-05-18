'use client'
import { useState, useMemo, useRef } from 'react'
import { Plus, Pencil, Trash2, TrendingDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useShallow } from 'zustand/react/shallow'
import { useMounted } from '@/hooks/use-mounted'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { ProductPrice } from '@/types'

interface PriceGroup {
  productKey: string
  productName: string
  entries: ProductPrice[]
  bestPrice: number
  tieCount: number
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function PricesClient() {
  const mounted = useMounted()
  const stores = useAppStore((s) => s.stores)
  const productPrices = useAppStore(useShallow((s) => s.productPrices))
  const updateProductPrice = useAppStore((s) => s.updateProductPrice)
  const addProductPrice = useAppStore((s) => s.addProductPrice)
  const removeProductPrice = useAppStore((s) => s.removeProductPrice)

  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const [editTarget, setEditTarget] = useState<{
    productKey: string
    productName: string
    storeId: string
  } | null>(null)
  const [editPrice, setEditPrice] = useState<number | undefined>(undefined)

  const [addTarget, setAddTarget] = useState<{
    productKey: string
    productName: string
  } | null>(null)
  const [addStoreId, setAddStoreId] = useState('')
  const [addPrice, setAddPrice] = useState<number | undefined>(undefined)

  const [removeTarget, setRemoveTarget] = useState<{
    productKey: string
    storeId: string
  } | null>(null)

  const [newProductOpen, setNewProductOpen] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductStoreId, setNewProductStoreId] = useState('')
  const [newProductPrice, setNewProductPrice] = useState<number | undefined>(undefined)

  const groups = useMemo((): PriceGroup[] => {
    const map = new Map<
      string,
      { productKey: string; productName: string; entries: ProductPrice[] }
    >()
    for (const p of productPrices) {
      if (!map.has(p.productKey)) {
        map.set(p.productKey, {
          productKey: p.productKey,
          productName: p.productName,
          entries: [],
        })
      }
      map.get(p.productKey)!.entries.push(p)
    }
    return [...map.values()]
      .map(({ productKey, productName, entries }) => {
        const sorted = [...entries].sort((a, b) => a.price - b.price)
        const bestPrice = sorted[0].price
        const tieCount = sorted.filter((e) => e.price === bestPrice).length
        return { productKey, productName, entries: sorted, bestPrice, tieCount }
      })
      .sort((a, b) => a.productName.localeCompare(b.productName))
  }, [productPrices])

  const filtered = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups.filter((g) => g.productName.toLowerCase().includes(q))
  }, [groups, search])

  const availableStoresToAdd = useMemo(() => {
    if (!addTarget) return []
    const taken = new Set(
      productPrices
        .filter((p) => p.productKey === addTarget.productKey)
        .map((p) => p.storeId)
    )
    return stores.filter((s) => !taken.has(s.id))
  }, [addTarget, productPrices, stores])

  function openEdit(entry: ProductPrice, productName: string) {
    setEditTarget({ productKey: entry.productKey, productName, storeId: entry.storeId })
    setEditPrice(entry.price)
  }

  function saveEdit() {
    if (!editTarget || !editPrice || editPrice <= 0) return
    updateProductPrice(editTarget.productKey, editTarget.storeId, editPrice)
    toast('Preço atualizado', 'success')
    setEditTarget(null)
  }

  function openAdd(group: PriceGroup) {
    setAddTarget({ productKey: group.productKey, productName: group.productName })
    setAddStoreId('')
    setAddPrice(undefined)
  }

  function saveAdd() {
    if (!addTarget || !addStoreId || !addPrice || addPrice <= 0) return
    const ok = addProductPrice(addTarget.productName, addStoreId, addPrice)
    if (!ok) {
      toast('Já existe um preço para essa loja', 'destructive')
      return
    }
    toast('Loja adicionada', 'success')
    setAddTarget(null)
  }

  function confirmRemove() {
    if (!removeTarget) return
    removeProductPrice(removeTarget.productKey, removeTarget.storeId)
    toast('Preço removido', 'destructive')
    setRemoveTarget(null)
  }

  function openNewProduct() {
    setNewProductName('')
    setNewProductStoreId('')
    setNewProductPrice(undefined)
    setNewProductOpen(true)
  }

  function saveNewProduct() {
    const name = newProductName.trim()
    if (!name || !newProductStoreId || !newProductPrice || newProductPrice <= 0) return
    const ok = addProductPrice(name, newProductStoreId, newProductPrice)
    if (!ok) {
      toast('Já existe um preço para esse produto nessa loja', 'destructive')
      return
    }
    toast('Produto cadastrado', 'success')
    setNewProductOpen(false)
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const editStore = editTarget
    ? stores.find((s) => s.id === editTarget.storeId)
    : null

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comparador de Preços</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {groups.length} produto{groups.length !== 1 ? 's' : ''} com preço registrado
          </p>
        </div>
        <Button onClick={openNewProduct} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Novo produto</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingDown className="h-10 w-10 text-[var(--muted-foreground)] mb-4" />
            <p className="font-medium mb-1">Nenhum preço registrado</p>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
              Adicione itens com loja e preço em qualquer lista, ou clique em{' '}
              <strong>Novo produto</strong> para cadastrar direto aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <Input
              ref={searchRef}
              className={search ? 'pl-8 pr-8' : 'pl-8'}
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  searchRef.current?.focus()
                }}
                aria-label="Limpar busca"
                className="absolute right-0 top-0 h-full px-2.5 flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
              Nenhum produto encontrado
            </p>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((group) => {
                const { productKey, productName, entries, bestPrice, tieCount } = group
                const missingStores = stores.filter(
                  (s) => !entries.some((e) => e.storeId === s.id)
                )
                return (
                  <Card key={productKey}>
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate min-w-0">{productName}</p>
                        {missingStores.length > 0 && (
                          <button
                            onClick={() => openAdd(group)}
                            aria-label="Adicionar loja ao produto"
                            title="Adicionar loja"
                            className="shrink-0 flex items-center justify-center h-8 w-8 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {entries.map((entry) => {
                          const store = stores.find((s) => s.id === entry.storeId)
                          const isBest = entry.price === bestPrice
                          const isTie = isBest && tieCount > 1

                          return (
                            <div
                              key={entry.storeId}
                              className="flex items-center gap-1.5 text-sm group/row"
                            >
                              <span className="text-base shrink-0 leading-none">
                                {store?.icon ?? '🏪'}
                              </span>
                              <span className="flex-1 text-xs truncate min-w-0">
                                {store?.name ?? entry.storeId}
                              </span>
                              <span
                                className={
                                  isBest
                                    ? 'font-semibold text-green-600 dark:text-green-400 tabular-nums text-xs'
                                    : 'font-medium text-amber-600 dark:text-amber-400 tabular-nums text-xs'
                                }
                              >
                                {formatCurrency(entry.price)}
                              </span>
                              {isTie ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0 h-4 shrink-0"
                                >
                                  =
                                </Badge>
                              ) : isBest ? (
                                <Badge
                                  variant="success"
                                  className="text-xs px-1 py-0 h-4 shrink-0"
                                >
                                  ↓
                                </Badge>
                              ) : (
                                <span className="w-5 shrink-0" aria-hidden />
                              )}
                              <span className="hidden lg:inline text-xs text-[var(--muted-foreground)] shrink-0 tabular-nums">
                                {fmtDate(entry.updatedAt)}
                              </span>
                              <div className="flex items-center opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity shrink-0 gap-0">
                                <button
                                  onClick={() => openEdit(entry, productName)}
                                  aria-label="Editar preço"
                                  className="flex items-center justify-center h-10 w-10 md:h-7 md:w-7 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5 md:h-3 md:w-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    setRemoveTarget({ productKey, storeId: entry.storeId })
                                  }
                                  aria-label="Remover preço"
                                  className="flex items-center justify-center h-10 w-10 md:h-7 md:w-7 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5 md:h-3 md:w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Edit price dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar preço</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)]">
                <span className="text-2xl">{editStore?.icon ?? '🏪'}</span>
                <div>
                  <p className="font-medium text-sm">{editTarget.productName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {editStore?.name ?? editTarget.storeId}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Novo preço (R$)</Label>
                <CurrencyInput
                  value={editPrice}
                  onChange={setEditPrice}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditTarget(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveEdit}
                  disabled={!editPrice || editPrice <= 0}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add store dialog */}
      <Dialog open={!!addTarget} onOpenChange={(o) => !o && setAddTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar loja</DialogTitle>
          </DialogHeader>
          {addTarget && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-[var(--muted-foreground)]">
                Produto: <strong>{addTarget.productName}</strong>
              </p>
              <div className="space-y-1">
                <Label>Loja</Label>
                <Select value={addStoreId} onValueChange={setAddStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStoresToAdd.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Preço (R$)</Label>
                <CurrencyInput value={addPrice} onChange={setAddPrice} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAddTarget(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveAdd}
                  disabled={!addStoreId || !addPrice || addPrice <= 0}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove confirm */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remover preço"
        description="O preço desta loja para este produto será removido da comparação. Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={confirmRemove}
      />

      {/* New product dialog */}
      <Dialog open={newProductOpen} onOpenChange={(o) => !o && setNewProductOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="new-product-name">Nome do produto</Label>
              <Input
                id="new-product-name"
                placeholder="Ex: Arroz 5kg"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveNewProduct()}
              />
            </div>
            <div className="space-y-1">
              <Label>Loja</Label>
              <Select value={newProductStoreId} onValueChange={setNewProductStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Preço (R$)</Label>
              <CurrencyInput value={newProductPrice} onChange={setNewProductPrice} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setNewProductOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={saveNewProduct}
                disabled={
                  !newProductName.trim() ||
                  !newProductStoreId ||
                  !newProductPrice ||
                  newProductPrice <= 0
                }
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
