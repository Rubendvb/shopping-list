import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { GlobalSearch } from '@/components/global-search'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="pt-16 px-6 pb-6 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
      <Toaster />
      <GlobalSearch />
    </div>
  )
}
