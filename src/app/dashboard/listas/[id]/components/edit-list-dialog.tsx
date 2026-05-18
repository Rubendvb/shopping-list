'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useAppStore } from '@/store/use-app-store'
import { toast } from '@/hooks/use-toast'
import type { List } from '@/types'

interface EditListDialogProps {
  list: List
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditListDialog({ list, open, onOpenChange }: EditListDialogProps) {
  const updateList = useAppStore((s) => s.updateList)
  const [name, setName] = useState(list.name)
  const [description, setDescription] = useState(list.description ?? '')
  const [budget, setBudget] = useState<number | undefined>(list.budget)

  useEffect(() => {
    if (open) {
      setName(list.name)
      setDescription(list.description ?? '')
      setBudget(list.budget)
    }
  }, [open, list])

  function save() {
    if (!name.trim()) return
    updateList(list.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      budget: budget !== undefined ? budget / 100 : null,
    })
    onOpenChange(false)
    toast('Lista atualizada', 'success')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar lista</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              placeholder="Opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Orçamento (R$)</Label>
            <CurrencyInput value={budget} onChange={setBudget} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
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
