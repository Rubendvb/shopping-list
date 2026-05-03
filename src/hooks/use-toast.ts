import { create } from 'zustand'

type ToastVariant = 'default' | 'success' | 'destructive'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastStore {
  toasts: ToastItem[]
  add: (message: string, variant: ToastVariant) => void
  dismiss: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, variant) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3000
    )
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export { useToastStore }

/** Call from anywhere — no hook rules required. */
export function toast(message: string, variant: ToastVariant = 'default') {
  useToastStore.getState().add(message, variant)
}
