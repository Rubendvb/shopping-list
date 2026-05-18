import type { List, Item, Category, Store, PriceRecord, ProductPrice, PurchaseHistory } from '@/types'
import type { ListsSlice } from './slices/lists-slice'
import type { ItemsSlice } from './slices/items-slice'
import type { PricesSlice } from './slices/prices-slice'
import type { CategoriesSlice } from './slices/categories-slice'
import type { StoresSlice } from './slices/stores-slice'

export interface ImportDataInput {
  lists: List[]
  items: Item[]
  categories: Category[]
  history: PurchaseHistory[]
  stores?: Store[]
  priceHistory?: PriceRecord[]
  productPrices?: ProductPrice[]
}

export interface DataSlice {
  importData: (data: ImportDataInput) => void
}

/** Combined type used as the StateCreator bound for all slices */
export type AppStore = ListsSlice & ItemsSlice & PricesSlice & CategoriesSlice & StoresSlice & DataSlice
