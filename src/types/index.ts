export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type { Unit } from '@/lib/units'
import type { Unit } from '@/lib/units'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isDefault: boolean
}

export interface List {
  id: string
  name: string
  description?: string
  /** cents (R$ × 100) */
  budget?: number
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Item {
  id: string
  listId: string
  name: string
  quantity: number
  unit?: Unit
  /** cents */
  estimatedPrice?: number
  /** cents */
  actualPrice?: number
  categoryId?: string
  priority: Priority
  isPurchased: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ItemSummary {
  name: string
  quantity: number
  unit?: Unit
  estimatedPrice?: number
  actualPrice?: number
  isPurchased: boolean
  category?: string
}

export interface PurchaseHistory {
  id: string
  listId: string
  listName: string
  /** cents */
  totalEstimated: number
  /** cents */
  totalActual: number
  itemCount: number
  itemsSummary: ItemSummary[]
  completedAt: string
}
