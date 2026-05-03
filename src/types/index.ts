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

export interface Store {
  id: string
  name: string
  color?: string
  icon?: string
  isDefault: boolean
}

export interface PriceRecord {
  id: string
  productName: string
  /** normalized (toLowerCase().trim()) for lookups */
  productKey: string
  storeId: string
  /** cents */
  price: number
  recordedAt: string
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
  storeId?: string
  priority: Priority
  isPurchased: boolean
  /** manual sort position within the list */
  order?: number
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
  storeId?: string
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
