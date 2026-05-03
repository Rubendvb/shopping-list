'use client'
import { useState, useMemo, useRef } from 'react'
import { Plus, Trash2, Building2, TrendingDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/lib/utils'
import type { PriceRecord } from '@/types'

const EMOJI_SUGGESTIONS = ['🏪', '🏬', '🛒', '🛍️', '🏢', '🏦', '🚗', '🌐', '📦', '🍊', '🟡', '🔵', '🟢', '🔴', '⭐']

export function StoresClient() {
  const mounted = useMounted()
  const stores = useAppStore((s) => s.stores)
  const items = useAppStore((s) => s.items)
  const priceHistory = useAppStore((s) => s.priceHistory)
  const addStore = useAppStore((s) => s.addStore)
  const deleteStore = useAppStore((s) => s.deleteStore)

  const [open, setOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏪')
  const [color, setColor] = useState('#6366f1')
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Build comparison data: group price history by productKey
  const comparisonData = useMemo(() => {
    const map = new Map<string, { productName: string; records: Map<string, PriceRecord> }>()
    for (const r of priceHistory) {
      if (!map.has(r.productKey)) {
        map.set(r.productKey, { productName: r.productName, records: new Map() })
      }
      const group = map.get(r.productKey)!
      const existing = group.records.get(r.storeId)
      if (!existing || r.recordedAt > existing.recordedAt) {
        group.records.set(r.storeId, r)
      }
    }
    return [...map.entries()]
      .map(([key, { productName, records }]) => ({
        key,
        productName,
        storeRecords: [...records.values()].sort((a, b) => a.price - b.price),
      }))
      .filter((p) => p.storeRecords.length > 0)
      .sort((a, b) => a.productName.localeCompare(b.productName))
  }, [priceHistory])

  const filteredComparison = useMemo(() => {
    if (!search.trim()) return comparisonData
    const q = search.toLowerCase()
    return comparisonData.filter((p) => p.productName.toLowerCase().includes(q))
  }, [comparisonData, search])

  if (!mounted)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    )

  function createStore() {
    if (!name.trim()) return
    addStore({ name: name.trim(), icon, color })
    setName('')
    setIcon('🏪')
    setColor('#6366f1')
    setOpen(false)
    toast('Loja criada', 'success')
  }

  function confirmDelete() {
    if (!confirmDeleteId) return
    deleteStore(confirmDeleteId)
    toast('Loja excluída', 'destructive')
    setConfirmDeleteId(null)
  }

  const itemCountForStore = (storeId: string) => items.filter((i) => i.storeId === storeId).length

  const defaults = stores.filter((s) => s.isDefault)
  const custom = stores.filter((s) => !s.isDefault)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lojas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nova loja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova loja</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Supermercado X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createStore()}
                />
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`text-xl p-1.5 rounded border-2 transition-colors cursor-pointer ${
                        icon === e ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-16 rounded cursor-pointer border border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">{color}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)]">
                <span className="text-2xl">{icon}</span>
                <span className="font-medium">{name || 'Prévia'}</span>
                <div className="h-3 w-3 rounded-full ml-auto" style={{ backgroundColor: color }} />
              </div>
              <Button className="w-full" onClick={createStore} disabled={!name.trim()}>
                Criar loja
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="lojas">
        <TabsList>
          <TabsTrigger value="lojas">Lojas</TabsTrigger>
          <TabsTrigger value="precos">
            Comparar preços
            {comparisonData.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {comparisonData.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lojas" className="space-y-6 mt-4">
          {/* Default stores */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-3">PADRÃO</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {defaults.map((store) => (
                <Card key={store.id}>
                  <CardContent className="p-3 flex items-center gap-2">
                    <span className="text-xl">{store.icon ?? '🏪'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{store.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {itemCountForStore(store.id)} ite{itemCountForStore(store.id) === 1 ? 'm' : 'ns'}
                      </p>
                    </div>
                    <div
                      className="h-2 w-2 rounded-full ml-auto shrink-0"
                      style={{ backgroundColor: store.color ?? '#94a3b8' }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom stores */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-3">
              PERSONALIZADAS
            </h2>
            {custom.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Building2 className="h-8 w-8 text-[var(--muted-foreground)] mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Nenhuma loja personalizada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {custom.map((store) => (
                  <Card key={store.id} className="group">
                    <CardContent className="p-3 flex items-center gap-2">
                      <span className="text-xl">{store.icon ?? '🏪'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{store.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {itemCountForStore(store.id)} ite{itemCountForStore(store.id) === 1 ? 'm' : 'ns'}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDeleteId(store.id)}
                        aria-label="Excluir loja"
                        className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="precos" className="mt-4 space-y-4">
          {comparisonData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingDown className="h-8 w-8 text-[var(--muted-foreground)] mb-3" />
                <p className="text-sm font-medium mb-1">Nenhum histórico de preços</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Ao adicionar itens com loja e preço, os dados aparecerão aqui para comparação.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  className={search ? 'pl-8 pr-8' : 'pl-8'}
                  placeholder="Buscar produto..."
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
              {filteredComparison.length === 0 ? (
                <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
                  Nenhum produto encontrado
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredComparison.map(({ key, productName, storeRecords }) => (
                    <Card key={key}>
                      <CardContent className="p-3 space-y-2">
                        <p className="font-medium text-sm truncate">{productName}</p>
                        <div className="space-y-1.5">
                          {storeRecords.map((r) => {
                            const store = stores.find((s) => s.id === r.storeId)
                            const isBest = storeRecords.length > 1 && r.price === storeRecords[0].price
                            return (
                              <div key={r.storeId} className="flex items-center gap-2 text-sm">
                                <span className="text-base">{store?.icon ?? '🏪'}</span>
                                <span className="flex-1 truncate text-xs">
                                  {store?.name ?? r.storeId}
                                </span>
                                <span
                                  className={
                                    isBest
                                      ? 'font-semibold text-green-600 dark:text-green-400'
                                      : 'font-medium'
                                  }
                                >
                                  {formatCurrency(r.price)}
                                </span>
                                {isBest && (
                                  <Badge variant="success" className="text-xs px-1 py-0 shrink-0">
                                    ↓
                                  </Badge>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Excluir loja"
        description="Os itens que usam esta loja ficarão sem loja associada. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
