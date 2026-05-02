import type { Category } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-mercado', name: 'Mercado', icon: '🛒', color: '#22c55e', isDefault: true },
  { id: 'cat-padaria', name: 'Padaria', icon: '🍞', color: '#f59e0b', isDefault: true },
  { id: 'cat-acougue', name: 'Açougue', icon: '🥩', color: '#ef4444', isDefault: true },
  { id: 'cat-limpeza', name: 'Limpeza', icon: '🧹', color: '#3b82f6', isDefault: true },
  { id: 'cat-higiene', name: 'Higiene', icon: '🧴', color: '#8b5cf6', isDefault: true },
  { id: 'cat-bebidas', name: 'Bebidas', icon: '🥤', color: '#06b6d4', isDefault: true },
  { id: 'cat-frios', name: 'Frios e Laticínios', icon: '🧀', color: '#f97316', isDefault: true },
  { id: 'cat-hortifruti', name: 'Hortifruti', icon: '🥦', color: '#10b981', isDefault: true },
  { id: 'cat-eletronicos', name: 'Eletrônicos', icon: '💻', color: '#6366f1', isDefault: true },
  { id: 'cat-outros', name: 'Outros', icon: '📦', color: '#94a3b8', isDefault: true },
]
