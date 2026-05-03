'use client'
import { useState, useMemo } from 'react'
import { TrendingDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UNITS, normalizeUnit } from '@/lib/units'
import { useAppStore } from '@/store/use-app-store'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Item, Category, Store, Priority, Unit } from '@/types'

interface EditItemDialogProps {
  item: Item | null
  categories: Category[]
  stores: Store[]
  onClose: () => void
}

interface EditFormProps {
  item: Item
  categories: Category[]
  stores: Store[]
  onClose: () => void
}

function EditItemForm({ item, categories, stores, onClose }: EditFormProps) {
  const updateItem = useAppStore((s) => s.updateItem)
  const priceHistory = useAppStore((s) => s.priceHistory)

  const [name, setName] = useState(item.name)
  const [qty, setQty] = useState(String(item.quantity))
  const [unit, setUnit] = useState<Unit | ''>(normalizeUnit(item.unit) ?? '')
  const [price, setPrice] = useState<number | undefined>(item.estimatedPrice)
  const [actualPrice, setActualPrice] = useState<number | undefined>(item.actualPrice)
  const [category, setCategory] = useState(item.categoryId ?? '')
  const [storeId, setStoreId] = useState(item.storeId ?? '')
  const [priority, setPriority] = useState<Priority>(item.priority)
  const [notes, setNotes] = useState(item.notes ?? '')

  const betterPriceInfo = useMemo(() => {
    if (!price || !name.trim()) return null
    const productKey = name.toLowerCase().trim()
    const relevant = priceHistory.filter((r) => r.productKey === productKey)
    if (!relevant.length) return null

    const byStore = new Map<string, number>()
    for (const r of [...relevant].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))) {
      if (!byStore.has(r.storeId)) byStore.set(r.storeId, r.price)
    }

    let bestPrice = price
    for (const [sid, p] of byStore) {
      if (sid === storeId) continue
      if (p < bestPrice) bestPrice = p
    }

    if (bestPrice >= price) return null

    const storeNames: string[] = []
    for (const [sid, p] of byStore) {
      if (sid === storeId) continue
      if (p === bestPrice) {
        const store = stores.find((s) => s.id === sid)
        if (store) storeNames.push(store.name)
      }
    }

    if (!storeNames.length) return null
    return { storeNames, price: bestPrice }
  }, [name, price, storeId, priceHistory, stores])

  function save() {
    if (!name.trim()) return
    const ok = updateItem(item.id, {
      name: name.trim(),
      quantity: parseFloat(qty) || 1,
      unit: unit || undefined,
      estimatedPrice: price !== undefined ? price / 100 : undefined,
      actualPrice: actualPrice !== undefined ? actualPrice / 100 : undefined,
      categoryId: category || undefined,
      storeId: storeId || undefined,
      priority,
      notes: notes.trim() || undefined,
    })
    if (!ok) {
      toast('Item já existe na lista', 'destructive')
      return
    }
    toast('Item salvo')
    onClose()
  }

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <Label>Nome *</Label>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Quantidade</Label>
          <Input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="0.01"
            step="0.01"
          />
        </div>
        <div className="space-y-1">
          <Label>Unidade</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
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
          <CurrencyInput value={price} onChange={setPrice} />
        </div>
        <div className="space-y-1">
          <Label>Preço real (R$)</Label>
          <CurrencyInput value={actualPrice} onChange={setActualPrice} />
        </div>
      </div>
      {betterPriceInfo && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2.5 py-2 rounded-md">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" />
          <span>
            Preço mais baixo: <strong>{formatCurrency(betterPriceInfo.price)}</strong>{' '}
            {betterPriceInfo.storeNames.length === 1
              ? `no ${betterPriceInfo.storeNames[0]}`
              : betterPriceInfo.storeNames.join(', ')}
          </span>
        </div>
      )}
      <div className="space-y-1">
        <Label>Loja</Label>
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar" />
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
        <Label>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
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
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
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
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={save} disabled={!name.trim()}>
          Salvar
        </Button>
      </div>
    </div>
  )
}

export function EditItemDialog({ item, categories, stores, onClose }: EditItemDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
        </DialogHeader>
        {item && (
          <EditItemForm
            key={item.id}
            item={item}
            categories={categories}
            stores={stores}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
