import { createFileRoute } from '@tanstack/react-router'
import { ShoppingCart, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { ExpenseForm } from '@/components/kasir/ExpenseForm'
import { SaleForm } from '@/components/kasir/SaleForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useTodayTransactions } from '@/hooks/useTransactions'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatRupiah, formatTime } from '@/lib/utils'
import type { TransactionWithItems } from '@/types'

export const Route = createFileRoute('/_auth/kasir')({
  component: KasirPage,
})

function KasirPage() {
  const { profile, isAdmin } = useAuth()
  const { data: todayTx, isLoading } = useTodayTransactions(isAdmin ? undefined : profile?.id)

  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  const todayOmzet =
    todayTx?.filter((t) => t.type === 'penjualan').reduce((s, t) => s + t.total_amount, 0) ?? 0

  const todayPengeluaran =
    todayTx?.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + t.total_amount, 0) ?? 0

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
                <motion.div
                  key={tx.id}
                  className="app-card p-3.5 flex items-center gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' as const, delay: idx * 0.04 }}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'penjualan' ? 'bg-success/10' : 'bg-danger/10'
                    }`}
                  >
                    {tx.type === 'penjualan' ? (
                      <ShoppingCart size={14} className="text-success" />
                    ) : (
                      <Wallet size={14} className="text-danger" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-sm font-medium text-neutral-900">
                      {tx.type === 'penjualan' ? (
                        <div className="flex flex-col gap-0.5">
                          {(tx as TransactionWithItems).transaction_items &&
                          (tx as TransactionWithItems).transaction_items.length > 1 ? (
                            (tx as TransactionWithItems).transaction_items.map((i, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 min-w-0">
                                <span className="text-neutral-400 flex-shrink-0">•</span>
                                <span className="truncate">
                                  {i.product_name}{' '}
                                  <span className="text-neutral-400 font-normal tabular-nums text-xs">
                                    x{i.quantity}
                                  </span>
                                </span>
                              </div>
                            ))
                          ) : (tx as TransactionWithItems).transaction_items?.length === 1 ? (
                            <p className="truncate">
                              {(tx as TransactionWithItems).transaction_items[0].product_name}{' '}
                              <span className="text-neutral-400 font-normal tabular-nums text-xs">
                                x{(tx as TransactionWithItems).transaction_items[0].quantity}
                              </span>
                            </p>
                          ) : (
                            <p className="truncate">Penjualan</p>
                          )}
                        </div>
                      ) : (
                        <p className="truncate">{tx.description}</p>
                      )}
                    </div>

                    {(tx.expense_category || tx.notes) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {tx.type === 'pengeluaran' && tx.expense_category && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex-shrink-0">
                            {EXPENSE_CATEGORY_LABELS[tx.expense_category as ExpenseCategory]}
                          </span>
                        )}
                        {tx.notes && (
                          <p className="text-xs text-neutral-500 truncate italic">"{tx.notes}"</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-1.5 gap-2">
                      <p className="text-[11px] text-neutral-400 tabular-nums pb-0.5 min-w-0">
                        {formatTime(tx.transaction_at)}
                      </p>
                      <div className="flex flex-col items-end leading-tight flex-shrink-0">
                        <span
                          className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                            tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {tx.type === 'penjualan' ? '+' : '−'}
                          {formatRupiah(tx.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

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
