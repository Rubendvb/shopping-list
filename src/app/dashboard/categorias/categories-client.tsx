'use client'
import { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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

const EMOJI_SUGGESTIONS = [
  '🛒',
  '🍞',
  '🥩',
  '🧹',
  '🧴',
  '🥤',
  '🧀',
  '🥦',
  '💻',
  '📦',
  '🎮',
  '👕',
  '🏠',
  '💊',
  '🐾',
]

export function CategoriesClient() {
  const mounted = useMounted()
  const categories = useAppStore((s) => s.categories)
  const items = useAppStore((s) => s.items)
  const addCategory = useAppStore((s) => s.addCategory)
  const deleteCategory = useAppStore((s) => s.deleteCategory)

  const [open, setOpen] = useState(false)
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('#6366f1')

  if (!mounted) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  function createCategory() {
    if (!name.trim()) return
    addCategory({ name: name.trim(), icon, color })
    setName('')
    setIcon('📦')
    setColor('#6366f1')
    setOpen(false)
    toast('Categoria criada', 'success')
  }

  function handleDeleteCategory(id: string) {
    setConfirmDeleteCategoryId(id)
  }

  function confirmDeleteCategory() {
    if (!confirmDeleteCategoryId) return
    deleteCategory(confirmDeleteCategoryId)
    toast('Categoria excluída', 'destructive')
    setConfirmDeleteCategoryId(null)
  }

  const itemCountForCategory = (catId: string) => items.filter((i) => i.categoryId === catId).length

  const defaults = categories.filter((c) => c.isDefault)
  const custom = categories.filter((c) => !c.isDefault)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Farmácia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createCategory()}
                />
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`text-xl p-1.5 rounded border-2 transition-colors ${
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

              <Button className="w-full" onClick={createCategory} disabled={!name.trim()}>
                Criar categoria
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default categories */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-3">PADRÃO</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {defaults.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-3 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {itemCountForCategory(cat.id)} itens
                  </p>
                </div>
                <div
                  className="h-2 w-2 rounded-full ml-auto shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] mb-3">
          PERSONALIZADAS
        </h2>
        {custom.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Tag className="h-8 w-8 text-[var(--muted-foreground)] mb-3" />
              <p className="text-sm text-[var(--muted-foreground)]">
                Nenhuma categoria personalizada
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {custom.map((cat) => (
              <Card key={cat.id} className="group">
                <CardContent className="p-3 flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {itemCountForCategory(cat.id)} itens
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    aria-label="Excluir categoria"
                    className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-all shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!confirmDeleteCategoryId}
        onOpenChange={(open) => !open && setConfirmDeleteCategoryId(null)}
        title="Excluir categoria"
        description="Os itens que usam esta categoria ficarão sem categorização. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={confirmDeleteCategory}
      />
    </div>
  )
}
