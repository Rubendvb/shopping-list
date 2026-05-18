'use client'
import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ItemNameInput } from '@/components/ui/item-name-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UNITS, normalizeUnit } from '@/lib/units'
import { useAppStore } from '@/store/use-app-store'
import { useShallow } from 'zustand/react/shallow'
import { useItemSuggestions } from '@/hooks/use-item-suggestions'
import { toast } from '@/hooks/use-toast'
import { getPriceAlert } from '@/lib/price-alert'
import { PriceAlertBanner } from './price-alert-banner'
import type { Item, Category, Store, Priority, Unit } from '@/types'
import type { ItemSuggestion } from '@/hooks/use-item-suggestions'

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
  const productPrices = useAppStore(useShallow((s) => s.productPrices))

  const [name, setName] = useState(item.name)
  const [qty, setQty] = useState(String(item.quantity))
  const [unit, setUnit] = useState<Unit | ''>(normalizeUnit(item.unit) ?? '')
  const [price, setPrice] = useState<number | undefined>(item.estimatedPrice)
  const [actualPrice, setActualPrice] = useState<number | undefined>(item.actualPrice)
  const [category, setCategory] = useState(item.categoryId ?? '')
  const [storeId, setStoreId] = useState(item.storeId ?? '')
  const [priority, setPriority] = useState<Priority>(item.priority)
  const [notes, setNotes] = useState(item.notes ?? '')

  const priceAlert = useMemo(
    () => (price ? getPriceAlert(name, price, storeId || undefined, productPrices, stores) : null),
    [name, price, storeId, productPrices, stores]
  )

  const autocompleteSuggestions = useItemSuggestions(name)

  function handleSelectSuggestion(s: ItemSuggestion) {
    setName(s.displayName)
    if (s.categoryId && !category) setCategory(s.categoryId)
    if (s.unit && !unit) setUnit(s.unit)
    if (s.storeId && !storeId) setStoreId(s.storeId)
    if (s.price !== undefined && price === undefined) setPrice(s.price)
  }

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
        <ItemNameInput
          autoFocus
          value={name}
          onChange={setName}
          onSelect={handleSelectSuggestion}
          suggestions={autocompleteSuggestions}
          onEnter={save}
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
      <PriceAlertBanner alert={priceAlert} />
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
