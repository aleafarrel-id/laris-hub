import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  PlusCircle,
  User,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import {
  useKasirList,
  useToggleKasirStatus,
} from '@/hooks/useKasirManagement'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import { KasirCard } from '@/components/manajemen-kasir/KasirCard'
import { CreateKasirModal } from '@/components/manajemen-kasir/CreateKasirModal'
import { KasirDetailDrawer } from '@/components/manajemen-kasir/KasirDetailDrawer'
import { KasirStats } from '@/components/manajemen-kasir/KasirStats'

export const Route = createFileRoute('/_auth/manajemen-kasir')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    if (session.user.app_metadata?.role !== 'admin') throw redirect({ to: '/kasir' })
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

  const activeCount = kasirList.filter((k) => k.is_active).length
  const suspendedCount = kasirList.length - activeCount

  // Sync selectedKasir with the live kasirList data after any mutation refetch.
  // The drawer always receives syncedKasir (ground truth from the database),
  // never a stale local snapshot that could disagree with what the server stored.
  const syncedKasir = kasirList.find((k) => k.id === selectedKasir?.id) ?? null

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
          {/* Desktop-only shortcut to profile */}
          <Link
            to="/profil"
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
            aria-label="Profil Admin"
          >
            <User size={16} strokeWidth={2} />
            <span>Profil</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Stats */}
          {!isLoading && kasirList.length > 0 && (
            <KasirStats kasirList={kasirList} />
          )}

          {/* Add Kasir CTA — below stats, always visible */}
          {!isLoading && (
            <motion.button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-semibold text-sm bg-primary/5 hover:bg-primary/10 hover:border-primary/50 active:scale-[0.98] transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <PlusCircle size={18} strokeWidth={2.5} />
              Tambah Kasir
            </motion.button>
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
          ) : kasirList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Kasir"
              description="Tambahkan kasir pertama agar bisa mulai mencatat transaksi."
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
        {selectedKasir && syncedKasir && (
          <KasirDetailDrawer
            kasir={syncedKasir}
            onClose={() => setSelectedKasir(null)}
            onToggle={handleToggle}
            isToggling={isToggling}
            adminId={adminProfile?.id}
          />
        )}
      </AnimatePresence>

      <CreateKasirModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
