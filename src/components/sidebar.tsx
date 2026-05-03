'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ListChecks, ShoppingCart, Tag, History, Settings, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { useMounted } from '@/hooks/use-mounted'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: ShoppingCart },
  { href: '/dashboard/listas', label: 'Minhas Listas', icon: ListChecks },
  { href: '/dashboard/estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { href: '/dashboard/historico', label: 'Histórico', icon: History },
  { href: '/dashboard/categorias', label: 'Categorias', icon: Tag },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const mounted = useMounted()
  const rawActiveCount = useAppStore((s) => s.lists.filter((l) => !l.isCompleted).length)
  const activeCount = mounted ? rawActiveCount : 0

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-[var(--card)] border border-[var(--border)] shadow cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col transition-transform duration-200',
          'md:translate-x-0 md:static md:flex',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 p-6 border-b border-[var(--sidebar-border)]">
          <ShoppingCart className="h-6 w-6 text-[var(--primary)]" />
          <span className="font-bold text-lg">ListaFácil</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            const showBadge = href === '/dashboard/listas' && activeCount > 0
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--sidebar-foreground)] hover:bg-[var(--accent)]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <Badge
                    className={cn(
                      'ml-auto px-1.5 py-0 min-w-[1.25rem] justify-center text-xs leading-5',
                      isActive
                        ? 'bg-white/20 text-white border-transparent hover:bg-white/20'
                        : 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                    )}
                    aria-label={`${activeCount} lista${activeCount !== 1 ? 's' : ''} ativa${activeCount !== 1 ? 's' : ''}`}
                  >
                    {activeCount > 99 ? '99+' : activeCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[var(--sidebar-border)]">
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
