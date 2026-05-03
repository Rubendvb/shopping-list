'use client'
import { useToastStore } from '@/hooks/use-toast'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastClose } from './toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          open
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            t.variant === 'success' &&
              'border-green-300 bg-green-50 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
            t.variant === 'destructive' &&
              'border-red-300 bg-red-50 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100'
          )}
        >
          <ToastTitle>{t.message}</ToastTitle>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
