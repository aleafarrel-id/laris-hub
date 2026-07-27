import { Link, useRouterState } from '@tanstack/react-router'
import { BarChart2, BookOpen, Package, ShoppingCart, User } from 'lucide-react'

const ADMIN_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { to: '/buku-kas', label: 'Buku Kas', icon: BookOpen },
  { to: '/produk', label: 'Produk', icon: Package },
  { to: '/profil', label: 'Profil', icon: User },
] as const

const KASIR_NAV_ITEMS = [
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { to: '/buku-kas', label: 'Riwayat', icon: BookOpen },
  { to: '/profil', label: 'Profil', icon: User },
] as const

/**
 * Bottom navigation (mobile-first).
 * Displayed only on screens < md.
 * Uses Lucide icons — no emoji.
 * Min hit area 48px per item (touch-friendly).
 */
export function BottomNav({ role }: { role?: 'admin' | 'kasir' | null }) {
  const { location } = useRouterState()
  const pathname = location.pathname

  const navItems = role === 'admin' ? ADMIN_NAV_ITEMS : KASIR_NAV_ITEMS

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 safe-area-inset-bottom z-40"
      aria-label="Navigasi utama"
    >
      <div className="flex max-w-lg mx-auto px-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || (to !== '/kasir' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors active:bg-neutral-50 rounded-lg my-0.5 ${
                isActive ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.75}
                className="transition-[stroke-width]"
                // Active state: filled feel via thicker stroke
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
