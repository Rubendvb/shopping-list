'use client'
import { useRef, useState } from 'react'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

interface BackupFile {
  lists: unknown[]
  items: unknown[]
  categories: unknown[]
  history: unknown[]
  stores?: unknown[]
  priceHistory?: unknown[]
  productPrices?: unknown[]
}

function isValidBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    Array.isArray(d.lists) &&
    Array.isArray(d.items) &&
    Array.isArray(d.categories) &&
    Array.isArray(d.history)
  )
}

export default function ConfiguracoesPage() {
  const mounted = useMounted()
  const lists = useAppStore((s) => s.lists)
  const items = useAppStore((s) => s.items)
  const categories = useAppStore((s) => s.categories)
  const history = useAppStore((s) => s.history)
  const stores = useAppStore((s) => s.stores)
  const priceHistory = useAppStore((s) => s.priceHistory)
  const productPrices = useAppStore((s) => s.productPrices)
  const importData = useAppStore((s) => s.importData)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)

  if (!mounted) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  function handleExport() {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      lists,
      items,
      categories,
      history,
      stores,
      priceHistory,
      productPrices,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listafacil-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Backup exportado com sucesso', 'success')
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      if (fileInputRef.current) fileInputRef.current.value = ''
      try {
        const parsed: unknown = JSON.parse(ev.target?.result as string)
        if (!isValidBackup(parsed)) {
          toast('Arquivo inválido: estrutura não reconhecida', 'destructive')
          return
        }
        setPendingImport(parsed)
        setConfirmImportOpen(true)
      } catch {
        toast('Erro ao ler o arquivo — verifique se é um JSON válido', 'destructive')
      }
    }
    reader.readAsText(file)
  }

  function executeImport() {
    if (!pendingImport) return
    importData({
      lists: pendingImport.lists as never,
      items: pendingImport.items as never,
      categories: pendingImport.categories as never,
      history: pendingImport.history as never,
      stores: pendingImport.stores as never,
      priceHistory: pendingImport.priceHistory as never,
      productPrices: pendingImport.productPrices as never,
    })
    setPendingImport(null)
    toast('Dados importados com sucesso', 'success')
  }

  const stats = [
    { label: 'Listas', value: lists.length },
    { label: 'Itens', value: items.length },
    { label: 'Categorias', value: categories.length },
    { label: 'Histórico', value: history.length },
    { label: 'Lojas', value: stores.length },
    { label: 'Preços', value: productPrices.length },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup e Restauração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current data summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Export */}
          <div className="flex items-start gap-4 rounded-lg border border-[var(--border)] p-4">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Exportar dados</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Salva listas, itens, categorias e histórico em um arquivo <code>.json</code>.
              </p>
            </div>
            <Button size="sm" onClick={handleExport} className="shrink-0">
              Exportar
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-start gap-4 rounded-lg border border-[var(--border)] p-4">
            <Upload className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Importar dados</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Restaura a partir de um arquivo <code>.json</code> exportado anteriormente.
                Substitui todos os dados atuais.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              Importar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
            <p>
              A importação substitui permanentemente todos os dados atuais. Exporte um backup antes
              de importar um arquivo externo.
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmImportOpen}
        onOpenChange={(open) => {
          setConfirmImportOpen(open)
          if (!open) setPendingImport(null)
        }}
        title="Importar dados"
        description={`Isso substituirá ${lists.length} lista(s) e ${items.length} item(ns) atuais. Esta ação não pode ser desfeita.`}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={executeImport}
      />
    </div>
  )
}
