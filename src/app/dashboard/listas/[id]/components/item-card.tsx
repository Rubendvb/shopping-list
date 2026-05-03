'use client'
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, CheckCircle2, Circle, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, cn } from '@/lib/utils'
import { normalizeUnit, unitAbbr } from '@/lib/units'
import type { Item, Category, Store } from '@/types'

export const priorityLabel = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }
export const priorityColor = {
  HIGH: 'destructive' as const,
  MEDIUM: 'warning' as const,
  LOW: 'secondary' as const,
}
export const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }

interface ItemCardProps {
  item: Item
  isDraggable: boolean
  shoppingMode: boolean
  isCompleted: boolean
  categories: Category[]
  stores: Store[]
  priceStatus?: 'best' | 'better-elsewhere'
  betterStoreNames?: string[]
  onToggle: (id: string, isPurchased: boolean) => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
}

export const SortableItemCard = React.memo(function SortableItemCard({
  item,
  isDraggable,
  shoppingMode,
  isCompleted,
  categories,
  stores,
  priceStatus,
  betterStoreNames,
  onToggle,
  onEdit,
  onDelete,
}: ItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isDraggable,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  const category = categories.find((c) => c.id === item.categoryId)
  const store = stores.find((s) => s.id === item.storeId)

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'transition-opacity group',
          item.isPurchased && 'opacity-60',
          isDragging && 'shadow-xl ring-2 ring-[var(--primary)] opacity-80'
        )}
      >
        <CardContent className={cn('flex items-center gap-3', shoppingMode ? 'p-4' : 'p-3')}>
          {isDraggable && (
            <button
              {...listeners}
              className="shrink-0 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center h-10 w-10 md:h-6 md:w-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Arrastar para reordenar"
              tabIndex={-1}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => onToggle(item.id, !item.isPurchased)}
            className="shrink-0 cursor-pointer disabled:cursor-default"
            disabled={isCompleted}
          >
            {item.isPurchased ? (
              <CheckCircle2
                className={cn(shoppingMode ? 'h-8 w-8' : 'h-5 w-5', 'text-green-500')}
              />
            ) : (
              <Circle
                className={cn(
                  shoppingMode ? 'h-8 w-8' : 'h-5 w-5',
                  'text-[var(--muted-foreground)]'
                )}
              />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'font-medium',
                  shoppingMode && 'text-lg',
                  item.isPurchased && 'line-through text-[var(--muted-foreground)]'
                )}
              >
                {item.name}
              </span>
              <span
                className={cn(
                  'text-[var(--muted-foreground)]',
                  shoppingMode ? 'text-base' : 'text-sm'
                )}
              >
                {item.quantity}
                {normalizeUnit(item.unit) ? ` ${unitAbbr(normalizeUnit(item.unit)!)}` : 'x'}
              </span>
              {!shoppingMode && (
                <>
                  <Badge variant={priorityColor[item.priority]} className="text-xs">
                    {priorityLabel[item.priority]}
                  </Badge>
                  {category && (
                    <span className="text-xs bg-[var(--secondary)] px-1.5 py-0.5 rounded">
                      {category.icon} {category.name}
                    </span>
                  )}
                  {store && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: (store.color ?? '#6366f1') + '20',
                        color: store.color ?? '#6366f1',
                      }}
                    >
                      {store.icon} {store.name}
                    </span>
                  )}
                  {priceStatus === 'best' && (
                    <Badge variant="success" className="text-xs">
                      Melhor preço
                    </Badge>
                  )}
                  {priceStatus === 'better-elsewhere' && betterStoreNames && betterStoreNames.length > 0 && (
                    <Badge variant="warning" className="text-xs">
                      ↓ {betterStoreNames.join(', ')}
                    </Badge>
                  )}
                </>
              )}
            </div>
            {!shoppingMode && item.notes && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                {item.notes}
              </p>
            )}
          </div>

          {!shoppingMode && (
            <div className="text-right shrink-0">
              {item.estimatedPrice && (
                <p className="text-sm font-medium">
                  {formatCurrency(Math.round(item.estimatedPrice * item.quantity))}
                </p>
              )}
              {item.estimatedPrice && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatCurrency(item.estimatedPrice)}/un
                </p>
              )}
            </div>
          )}

          {!isCompleted && !shoppingMode && (
            <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => onEdit(item)}
                aria-label="Editar item"
                className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                aria-label="Excluir item"
                className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
