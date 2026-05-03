'use client'
import { useState, useEffect } from 'react'
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
import type { Item, Category, Priority, Unit } from '@/types'

interface EditItemDialogProps {
  item: Item | null
  categories: Category[]
  onClose: () => void
}

export function EditItemDialog({ item, categories, onClose }: EditItemDialogProps) {
  const updateItem = useAppStore((s) => s.updateItem)

  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState<Unit | ''>('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [actualPrice, setActualPrice] = useState<number | undefined>(undefined)
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (item) {
      setName(item.name)
      setQty(String(item.quantity))
      setUnit(normalizeUnit(item.unit) ?? '')
      setPrice(item.estimatedPrice)
      setActualPrice(item.actualPrice)
      setCategory(item.categoryId ?? '')
      setPriority(item.priority)
      setNotes(item.notes ?? '')
    }
  }, [item])

  function save() {
    if (!item || !name.trim()) return
    updateItem(item.id, {
      name: name.trim(),
      quantity: parseFloat(qty) || 1,
      unit: unit || undefined,
      estimatedPrice: price !== undefined ? price / 100 : undefined,
      actualPrice: actualPrice !== undefined ? actualPrice / 100 : undefined,
      categoryId: category || undefined,
      priority,
      notes: notes.trim() || undefined,
    })
    toast('Item salvo')
    onClose()
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  )
}
