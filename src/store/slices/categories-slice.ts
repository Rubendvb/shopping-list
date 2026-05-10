import type { StateCreator } from 'zustand'
import type { Category } from '@/types'
import { genId } from '../helpers'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import type { AppStore } from '../store-types'

export interface CategoriesSlice {
  categories: Category[]
  addCategory: (data: { name: string; icon?: string; color?: string }) => void
  deleteCategory: (id: string) => void
}

export const createCategoriesSlice: StateCreator<AppStore, [], [], CategoriesSlice> = (set) => ({
  categories: DEFAULT_CATEGORIES,

  addCategory: ({ name, icon = '📦', color = '#94a3b8' }) => {
    set((s) => ({
      categories: [...s.categories, { id: genId(), name, icon, color, isDefault: false }],
    }))
  },

  deleteCategory: (id) => {
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id || c.isDefault),
      items: s.items.map((i) =>
        i.categoryId === id ? { ...i, categoryId: undefined } : i
      ),
    }))
  },
})
