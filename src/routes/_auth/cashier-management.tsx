import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Plus, User, Users } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { CashierCard } from '@/components/cashier-management/CashierCard'
import { CashierDetailDrawer } from '@/components/cashier-management/CashierDetailDrawer'
import { CashierStats } from '@/components/cashier-management/CashierStats'
import { CreateCashierModal } from '@/components/cashier-management/CreateCashierModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useCashierList, useToggleCashierStatus } from '@/hooks/useCashierManagement'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { Profile } from '@/types'

export const Route = createFileRoute('/_auth/cashier-management')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    const profile = useAuthStore.getState().profile as any
    if (profile?.role !== 'admin') throw redirect({ to: '/cashier' })
  },
  component: CashierManagementPage,
})

// Main Page
function CashierManagementPage() {
  const { profile: adminProfile } = useAuth()
  const { data: cashierList = [], isLoading } = useCashierList()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleCashierStatus()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCashier, setSelectedCashier] = useState<Profile | null>(null)

  const activeCount = useMemo(
    () => cashierList?.filter((k) => k.is_active)?.length ?? 0,
    [cashierList],
  )
  const suspendedCount = (cashierList?.length ?? 0) - activeCount

  const syncedCashier = useMemo(
    () => cashierList.find((k) => k.id === selectedCashier?.id) ?? null,
    [cashierList, selectedCashier?.id],
  )

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      if (id === adminProfile?.id) return
      toggleStatus({ id, isActive })
    },
    [adminProfile, toggleStatus],
  )

  return (
    <div className="flex flex-col min-h-dvh bg-neutral-50/50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">
              Tim Kasir
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
              {isLoading
                ? 'Memuat...'
                : `${cashierList?.length ?? 0} cashier · ${activeCount} aktif${suspendedCount > 0 ? ` · ${suspendedCount} ditangguhkan` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/profile"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
              aria-label="Profil Admin"
            >
              <User size={16} strokeWidth={2} />
              <span>Profil</span>
            </Link>

            {(cashierList?.length ?? 0) > 0 && (
              <Button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex-shrink-0 h-[44px]"
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
              >
                <span className="hidden sm:inline">Tambah Kasir</span>
                <span className="inline sm:hidden">Tambah</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Stats */}
          {!isLoading && (cashierList?.length ?? 0) > 0 && (
            <CashierStats cashierList={cashierList} />
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((k) => (
                <div
                  key={k}
                  className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4"
                >
                  <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : (cashierList?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Kasir"
              description="Tambahkan cashier pertama agar bisa mulai mencatat transaksi."
              action={{
                label: 'Tambah Kasir',
                onClick: () => setShowCreateModal(true),
              }}
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {cashierList.map((cashier) => (
                <CashierCard
                  key={cashier.id}
                  cashier={cashier}
                  onClick={() => setSelectedCashier(cashier)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Drawer & Modals */}
      <AnimatePresence>
        <CashierDetailDrawer
          key="cashier-detail-drawer"
          isOpen={!!selectedCashier && !!syncedCashier}
          cashier={syncedCashier || selectedCashier}
          onClose={() => setSelectedCashier(null)}
          onToggle={handleToggle}
          isToggling={isToggling}
          adminId={adminProfile?.id}
        />
      </AnimatePresence>

      <CreateCashierModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
