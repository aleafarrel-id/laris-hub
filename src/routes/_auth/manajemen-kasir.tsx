import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Plus, User, Users } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { CreateKasirModal } from '@/components/manajemen-kasir/CreateKasirModal'
import { KasirCard } from '@/components/manajemen-kasir/KasirCard'
import { KasirDetailDrawer } from '@/components/manajemen-kasir/KasirDetailDrawer'
import { KasirStats } from '@/components/manajemen-kasir/KasirStats'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useKasirList, useToggleKasirStatus } from '@/hooks/useKasirManagement'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { Profile } from '@/types'

export const Route = createFileRoute('/_auth/manajemen-kasir')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    const profile = useAuthStore.getState().profile
    if (profile?.role !== 'admin') throw redirect({ to: '/kasir' })
  },
  component: ManajemenKasirPage,
})

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ManajemenKasirPage() {
  const { profile: adminProfile } = useAuth()
  const { data: kasirList = [], isLoading } = useKasirList()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleKasirStatus()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedKasir, setSelectedKasir] = useState<Profile | null>(null)

  const activeCount = useMemo(() => kasirList.filter((k) => k.is_active).length, [kasirList])
  const suspendedCount = kasirList.length - activeCount

  // Sync selectedKasir with the live kasirList data after any mutation refetch.
  // The drawer always receives syncedKasir (ground truth from the database),
  // never a stale local snapshot that could disagree with what the server stored.
  const syncedKasir = useMemo(
    () => kasirList.find((k) => k.id === selectedKasir?.id) ?? null,
    [kasirList, selectedKasir?.id],
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
                : `${kasirList.length} kasir · ${activeCount} aktif${suspendedCount > 0 ? ` · ${suspendedCount} ditangguhkan` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop-only shortcut to profile */}
            <Link
              to="/profil"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
              aria-label="Profil Admin"
            >
              <User size={16} strokeWidth={2} />
              <span>Profil</span>
            </Link>

            {kasirList.length > 0 && (
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
          {!isLoading && kasirList.length > 0 && <KasirStats kasirList={kasirList} />}

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
          ) : kasirList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Kasir"
              description="Tambahkan kasir pertama agar bisa mulai mencatat transaksi."
              action={{
                label: 'Tambah Kasir',
                onClick: () => setShowCreateModal(true),
              }}
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {kasirList.map((kasir) => (
                <KasirCard key={kasir.id} kasir={kasir} onClick={() => setSelectedKasir(kasir)} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Drawer & Modals */}
      <AnimatePresence>
        <KasirDetailDrawer
          key="kasir-detail-drawer"
          isOpen={!!selectedKasir && !!syncedKasir}
          kasir={syncedKasir || selectedKasir}
          onClose={() => setSelectedKasir(null)}
          onToggle={handleToggle}
          isToggling={isToggling}
          adminId={adminProfile?.id}
        />
      </AnimatePresence>

      <CreateKasirModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
