'use client'
import { useState, useMemo } from 'react'
import { Plus, TrendingDown } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Category, Store, Priority, Unit } from '@/types'

interface AddItemFormProps {
  listId: string
  categories: Category[]
  stores: Store[]
}

export function AddItemForm({ listId, categories, stores }: AddItemFormProps) {
  const addItem = useAppStore((s) => s.addItem)
  const priceHistory = useAppStore((s) => s.priceHistory)

  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState<Unit | ''>('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [category, setCategory] = useState('')
  const [storeId, setStoreId] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')

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

  const betterPriceAlert = betterPriceInfo && (
    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2.5 py-2 rounded-md">
      <TrendingDown className="h-3.5 w-3.5 shrink-0" />
      <span>
        Preço mais baixo: <strong>{formatCurrency(betterPriceInfo.price)}</strong>{' '}
        {betterPriceInfo.storeNames.length === 1
          ? `no ${betterPriceInfo.storeNames[0]}`
          : betterPriceInfo.storeNames.join(', ')}
      </span>
    </div>
  )

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
          {betterPriceAlert && <div className="mt-3">{betterPriceAlert}</div>}
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
            {betterPriceAlert}
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
