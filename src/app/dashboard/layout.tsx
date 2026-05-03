import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/toaster'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-16 px-6 pb-6 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
