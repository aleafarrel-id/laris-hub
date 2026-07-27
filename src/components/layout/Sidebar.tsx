import { Link, useRouterState } from '@tanstack/react-router'
import { BarChart2, BookOpen, LogOut, Package, ShoppingCart, User } from 'lucide-react'
import { useAuthActions } from '@/hooks/useAuth'

const ADMIN_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { to: '/buku-kas', label: 'Buku Kas', icon: BookOpen },
  { to: '/produk', label: 'Produk', icon: Package },
] as const

const KASIR_NAV_ITEMS = [
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { to: '/buku-kas', label: 'Riwayat', icon: BookOpen },
] as const

export function Sidebar({
  userName,
  role,
}: {
  userName?: string
  role?: 'admin' | 'kasir' | null
}) {
  const { location } = useRouterState()
  const pathname = location.pathname
  const { signOut } = useAuthActions()

  const navItems = role === 'admin' ? ADMIN_NAV_ITEMS : KASIR_NAV_ITEMS

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-dvh bg-white border-r border-neutral-200 fixed left-0 top-0 z-30 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <img src="/favicon.svg" alt="Laris Hub Logo" className="w-6 h-6 object-contain" />
        </div>
        <div>
          <p className="text-base font-extrabold text-neutral-900 leading-tight">Laris Hub</p>
          <p className="text-xs text-neutral-400 font-medium">
            {role === 'admin' ? 'Dashboard Admin' : 'Panel Kasir'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Navigasi Desktop">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || (pathname.startsWith(to) && to !== '/kasir')
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-6 border-t border-neutral-100 pt-4">
        <Link
          to="/profil"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-1 ${
            pathname === '/profil'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98]'
          }`}
        >
          <User
            size={20}
            strokeWidth={pathname === '/profil' ? 2.5 : 2}
            className="flex-shrink-0"
          />
          <span className="truncate">{userName ?? 'Profil'}</span>
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-neutral-500 hover:bg-danger/10 hover:text-danger active:scale-[0.98] transition-all duration-200"
        >
          <LogOut size={20} strokeWidth={2} className="flex-shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
