'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Copy, ShoppingCart, CheckCircle, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, calcEstimated } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TEMPLATES } from '@/lib/templates'

export function ListsClient() {
  const router = useRouter()
  const mounted = useMounted()
  const lists = useAppStore((s) => s.lists)
  const items = useAppStore((s) => s.items)
  const addList = useAppStore((s) => s.addList)
  const addItem = useAppStore((s) => s.addItem)
  const deleteList = useAppStore((s) => s.deleteList)
  const duplicateList = useAppStore((s) => s.duplicateList)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState<number | undefined>(undefined)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) ?? null

  if (!mounted) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  function resetDialog() {
    setName('')
    setDescription('')
    setBudget(undefined)
    setSelectedTemplateId('')
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId)
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (tpl) {
      setName(tpl.name)
      setDescription(tpl.description)
    }
  }

  function createList() {
    if (!name.trim()) return
    const id = addList({
      name: name.trim(),
      description: description.trim() || undefined,
      budget: budget !== undefined ? budget / 100 : undefined,
    })
    if (selectedTemplate) {
      for (const item of selectedTemplate.items) {
        addItem({
          listId: id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          categoryId: item.categoryId,
          priority: item.priority,
        })
      }
      toast(`Lista criada com ${selectedTemplate.items.length} itens`, 'success')
    } else {
      toast('Lista criada', 'success')
    }
    resetDialog()
    setOpen(false)
    router.push(`/dashboard/listas/${id}`)
  }

  function handleDeleteList(id: string, e: React.MouseEvent) {
    e.preventDefault()
    setConfirmDeleteId(id)
  }

  function handleDuplicateList(id: string, e: React.MouseEvent) {
    e.preventDefault()
    const newId = duplicateList(id)
    toast('Lista duplicada', 'success')
    router.push(`/dashboard/listas/${newId}`)
  }

  function confirmDeleteList() {
    if (!confirmDeleteId) return
    deleteList(confirmDeleteId)
    toast('Lista excluída', 'destructive')
    setConfirmDeleteId(null)
  }

  const filtered = lists.filter((l) =>
    filter === 'all' ? true : filter === 'active' ? !l.isCompleted : l.isCompleted
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minhas Listas</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nova lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova lista de compras</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Template selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Usar template
                </Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (lista em branco)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none-placeholder" disabled className="hidden" />
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template preview */}
              {selectedTemplate && (
                <div className="rounded-md border border-[var(--border)] bg-[var(--secondary)]/40 p-3 space-y-2">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    {selectedTemplate.items.length} itens incluídos
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.items.slice(0, 8).map((item) => (
                      <span
                        key={item.name}
                        className="text-xs bg-[var(--secondary)] px-2 py-0.5 rounded-full"
                      >
                        {item.name}
                      </span>
                    ))}
                    {selectedTemplate.items.length > 8 && (
                      <span className="text-xs text-[var(--muted-foreground)] self-center">
                        +{selectedTemplate.items.length - 8} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nome da lista *</Label>
                <Input
                  placeholder="Ex: Mercado semanal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createList()}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Opcional"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Orçamento (R$)</Label>
                <CurrencyInput value={budget} onChange={setBudget} />
              </div>
              <Button className="w-full" onClick={createList} disabled={!name.trim()}>
                {selectedTemplate ? `Criar lista com ${selectedTemplate.items.length} itens` : 'Criar lista'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {(['active', 'all', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80'
            }`}
          >
            {f === 'active' ? 'Ativas' : f === 'all' ? 'Todas' : 'Concluídas'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)]">
              {filter === 'completed'
                ? 'Nenhuma lista concluída ainda'
                : 'Nenhuma lista encontrada'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((list) => {
            const listItems = items.filter((i) => i.listId === list.id)
            const purchased = listItems.filter((i) => i.isPurchased).length
            const total = listItems.length
            const estimated = calcEstimated(listItems)
            const progress = total > 0 ? Math.round((purchased / total) * 100) : 0

            return (
              <Link key={list.id} href={`/dashboard/listas/${list.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {list.isCompleted && (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                          <h3 className="font-medium truncate">{list.name}</h3>
                        </div>
                        {list.description && (
                          <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                            {list.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDuplicateList(list.id, e)}
                        aria-label="Duplicar lista"
                        className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteList(list.id, e)}
                        aria-label="Excluir lista"
                        className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500 transition-all ml-1 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-full bg-[var(--secondary)] rounded-full h-1.5 mb-2">
                      <div
                        className="bg-[var(--primary)] h-1.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>
                        {purchased}/{total} itens
                      </span>
                      <div className="flex items-center gap-2">
                        {list.budget && (
                          <Badge
                            variant={estimated > list.budget ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            Orç: {formatCurrency(list.budget)}
                          </Badge>
                        )}
                        {estimated > 0 && <span>{formatCurrency(Math.round(estimated))}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Excluir lista"
        description="Todos os itens desta lista serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDeleteList}
      />
    </div>
  )
}
