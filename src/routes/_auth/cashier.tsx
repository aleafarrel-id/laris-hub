import { createFileRoute } from '@tanstack/react-router'
import { ShoppingCart, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ExpenseForm } from '@/components/cashier/ExpenseForm'
import { SaleForm } from '@/components/cashier/SaleForm'
import { TransactionListItem } from '@/components/cashier/TransactionListItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionDetailModal } from '@/components/ui/TransactionDetailModal'
import { useAuth } from '@/hooks/useAuth'
import { useTodayTransactions, useUpdateTransactionStatus } from '@/hooks/useTransactions'
import { formatRupiah } from '@/lib/utils'
import type { TransactionWithItems } from '@/types'

export const Route = createFileRoute('/_auth/cashier')({
  component: CashierPage,
})

function CashierPage() {
  const { profile, isAdmin } = useAuth()
  const { data: todayTx, isLoading } = useTodayTransactions(isAdmin ? undefined : profile?.id)

  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [viewingTx, setViewingTx] = useState<TransactionWithItems | null>(null)
  const updateStatusMutation = useUpdateTransactionStatus()

  const todayOmzet = useMemo(() => {
    return todayTx?.filter((t) => t.type === 'sale').reduce((s, t) => s + t.total_amount, 0) ?? 0
  }, [todayTx])

  const todayPengeluaran = useMemo(() => {
    return todayTx?.filter((t) => t.type === 'expense').reduce((s, t) => s + t.total_amount, 0) ?? 0
  }, [todayTx])

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-base font-bold text-neutral-900">Kasir</h1>
          <p className="text-xs text-neutral-400">Halo, {profile?.full_name ?? ''}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Transaksi hari ini</p>
          <p className="text-sm font-bold tabular-nums text-neutral-900">
            {isLoading ? '0' : (todayTx?.length ?? 0)}
          </p>
        </div>
      </header>

      <div className="page-container max-w-3xl mx-auto space-y-6">
        <motion.div
          className="flex flex-col gap-4 mb-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.button
            type="button"
            onClick={() => setShowSaleModal(true)}
            className="w-full flex items-center justify-between p-4 sm:p-5 bg-primary text-white rounded-2xl shadow-action relative overflow-hidden group cursor-pointer"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: 'spring', duration: 0.3, bounce: 0 },
              },
            }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01, boxShadow: '0 12px 24px -6px rgba(40,94,175,0.45)' }}
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-bold tracking-tight mb-0.5 truncate">
                  Catat Penjualan
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 text-primary-100">
                  <span className="text-xs sm:text-sm font-medium">Omzet Hari Ini:</span>
                  <span className="text-sm font-bold tabular-nums text-white">
                    {isLoading ? <span className="opacity-50">...</span> : formatRupiah(todayOmzet)}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            className="w-full flex items-center justify-between p-4 sm:p-5 bg-white border border-danger/20 text-neutral-800 rounded-2xl shadow-sm hover:border-danger hover:shadow-md transition-all group overflow-hidden relative cursor-pointer"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: 'spring', duration: 0.3, bounce: 0 },
              },
            }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-danger/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-danger/10 text-danger rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-bold tracking-tight mb-0.5 truncate">
                  Catat Pengeluaran
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 text-neutral-500">
                  <span className="text-xs sm:text-sm font-medium">Pengeluaran:</span>
                  <span className="text-sm font-bold text-danger tabular-nums">
                    {isLoading ? (
                      <span className="opacity-50">...</span>
                    ) : (
                      formatRupiah(todayPengeluaran)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>

        <div>
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Transaksi Hari Ini
          </h2>

          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((k) => (
                <div key={k} className="app-card p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
                    <div className="space-y-1.5 flex-1 max-w-[150px]">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !todayTx?.length && (
            <EmptyState
              icon={ShoppingCart}
              title="Belum ada transaksi hari ini"
              description="Tekan 'Catat Penjualan' untuk memulai"
            />
          )}

          {!isLoading && (
            <div className="space-y-2">
              {todayTx?.slice(0, 15).map((tx, idx) => (
                <TransactionListItem
                  key={tx.id}
                  tx={tx as TransactionWithItems}
                  idx={idx}
                  onClick={() => setViewingTx(tx as TransactionWithItems)}
                  onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionDetailModal
        isOpen={!!viewingTx}
        onClose={() => setViewingTx(null)}
        transaction={viewingTx}
      />

      <Modal isOpen={showSaleModal} onClose={() => setShowSaleModal(false)} title="Catat Penjualan">
        <SaleForm onSuccess={() => setShowSaleModal(false)} />
      </Modal>

      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Catat Pengeluaran"
      >
        <ExpenseForm onSuccess={() => setShowExpenseModal(false)} />
      </Modal>
    </>
  )
}
