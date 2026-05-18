import type { StateCreator } from 'zustand'
import type { Store } from '@/types'
import { genId } from '../helpers'
import { DEFAULT_STORES } from '@/lib/stores'
import type { AppStore } from '../store-types'

export interface StoresSlice {
  stores: Store[]
  addStore: (data: { name: string; icon?: string; color?: string }) => void
  deleteStore: (id: string) => void
}

export const createStoresSlice: StateCreator<AppStore, [], [], StoresSlice> = (set) => ({
  stores: DEFAULT_STORES,

  addStore: ({ name, icon = '🏪', color = '#6366f1' }) => {
    set((s) => ({
      stores: [...s.stores, { id: genId(), name, icon, color, isDefault: false }],
    }))
  },

  deleteStore: (id) => {
    set((s) => ({
      stores: s.stores.filter((st) => st.id !== id || st.isDefault),
      items: s.items.map((i) => (i.storeId === id ? { ...i, storeId: undefined } : i)),
      productPrices: s.productPrices.filter((p) => p.storeId !== id),
    }))
  },
})
