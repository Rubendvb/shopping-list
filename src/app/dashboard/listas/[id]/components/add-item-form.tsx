'use client'
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UNITS } from '@/lib/units'
import { useAppStore } from '@/store/use-app-store'
import { useShallow } from 'zustand/react/shallow'
import { toast } from '@/hooks/use-toast'
import { getPriceAlert } from '@/lib/price-alert'
import { PriceAlertBanner } from './price-alert-banner'
import { SuggestionHint } from './suggestion-hint'
import type { SuggestionData } from './suggestion-hint'
import type { Category, Store, Priority, Unit } from '@/types'

interface AddItemFormProps {
  listId: string
  categories: Category[]
  stores: Store[]
}

export function AddItemForm({ listId, categories, stores }: AddItemFormProps) {
  const addItem = useAppStore((s) => s.addItem)
  const productPrices = useAppStore(useShallow((s) => s.productPrices))

  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState<Unit | ''>('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [category, setCategory] = useState('')
  const [storeId, setStoreId] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')

  const suggestion = useMemo((): SuggestionData | null => {
    const productKey = name.toLowerCase().trim()
    if (productKey.length < 2) return null
    const entries = productPrices.filter((p) => p.productKey === productKey)
    if (!entries.length) return null

    const minPrice = Math.min(...entries.map((p) => p.price))
    const avgPrice = Math.round(entries.reduce((s, p) => s + p.price, 0) / entries.length)
    const bestEntries = entries.filter((p) => p.price === minPrice)
    const bestStoreNames = bestEntries
      .map((p) => stores.find((s) => s.id === p.storeId)?.name)
      .filter(Boolean) as string[]

    return { minPrice, avgPrice, bestStoreNames, bestStoreId: bestEntries[0]?.storeId ?? '' }
  }, [name, productPrices, stores])

  const priceAlert = useMemo(
    () => (price ? getPriceAlert(name, price, storeId || undefined, productPrices, stores) : null),
    [name, price, storeId, productPrices, stores]
  )

  function applySuggestion() {
    if (!suggestion) return
    setPrice(suggestion.minPrice)
    setStoreId(suggestion.bestStoreId)
  }

  function reset() {
    setName('')
    setQty('1')
    setUnit('')
    setPrice(undefined)
    setCategory('')
    setStoreId('')
    setPriority('MEDIUM')
    setShowAdd(false)
  }

  function handleAdd() {
    if (!name.trim()) return
    const ok = addItem({
      listId,
      name: name.trim(),
      quantity: parseFloat(qty) || 1,
      unit: unit || undefined,
      estimatedPrice: price !== undefined ? price / 100 : undefined,
      categoryId: category || undefined,
      storeId: storeId || undefined,
      priority,
    })
    if (!ok) {
      toast('Item já existe na lista', 'destructive')
      return
    }
    reset()
    toast('Item adicionado', 'success')
  }

  return (
    <>
      {/* Mobile FAB */}
      <Button
        className="fixed right-6 shadow-lg rounded-full h-14 w-14 p-0 md:hidden"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={() => setShowAdd(true)}
        aria-label="Adicionar item"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Desktop inline card */}
      <Card className="hidden md:block">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Adicionar item</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1 space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input
                placeholder="Ex: Arroz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Qtd</Label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unidade</Label>
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
            <div className="space-y-1">
              <Label className="text-xs">Preço (R$)</Label>
              <CurrencyInput value={price} onChange={setPrice} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
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
              <Label className="text-xs">Categoria</Label>
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
              <Label className="text-xs">Prioridade</Label>
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
            <div className="flex items-end">
              <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
          {suggestion && !price && (
            <div className="mt-3">
              <SuggestionHint data={suggestion} onApply={applySuggestion} />
            </div>
          )}
          {priceAlert && <div className="mt-3"><PriceAlertBanner alert={priceAlert} /></div>}
        </CardContent>
      </Card>

      {/* Mobile dialog */}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {suggestion && !price && (
              <SuggestionHint data={suggestion} onApply={applySuggestion} />
            )}
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
            <div className="space-y-1">
              <Label>Preço estimado (R$)</Label>
              <CurrencyInput value={price} onChange={setPrice} />
            </div>
            <PriceAlertBanner alert={priceAlert} />
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
            <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>
              Adicionar item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
