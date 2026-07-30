import { useAutoAnimate } from '@formkit/auto-animate/react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  BookOpen,
  DollarSign,
  Filter,
  TrendingDown,
  TrendingUp,
  Trash2,
  Edit3,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { TransactionBadge } from '@/components/ui/Badge'
import { CashierProfileModal } from '@/components/ui/CashierProfileModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EditTransactionModal } from '@/components/ui/EditTransactionModal'
import { useAuth } from '@/hooks/useAuth'
import { useCashiers } from '@/hooks/useProfile'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Profile, TransactionFilters, TransactionWithItems } from '@/types'

type BukuKasSearch = {
  quickRange?: QuickRange
  customFrom?: string
  customTo?: string
  typeFilter?: TransactionFilters['type']
  kasirFilter?: string
}

export const Route = createFileRoute('/_auth/buku-kas')({
  validateSearch: (search: Record<string, unknown>): BukuKasSearch => {
    return {
      quickRange: search.quickRange as QuickRange | undefined,
      customFrom: search.customFrom as string | undefined,
      customTo: search.customTo as string | undefined,
      typeFilter: search.typeFilter as TransactionFilters['type'] | undefined,
      kasirFilter: search.kasirFilter as string | undefined,
    }
  },
  component: BukuKasPage,
})

const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

type QuickRange = 'today' | 'week' | 'month' | 'custom'

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: '7 Hari' },
  { key: 'month', label: '30 Hari' },
  { key: 'custom', label: 'Custom' },
]

function getDateRange(range: QuickRange): { from: Date; to: Date } {
  const to = new Date()
  to.setHours(23, 59, 59, 999)

  if (range === 'week') {
    const from = new Date()
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)
    return { from, to }
  }
  if (range === 'month') {
    const from = new Date()
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)
    return { from, to }
  }
  const from = todayStart()
  return { from, to }
}

function BukuKasPage() {
  const { isAdmin } = useAuth()
  
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const quickRange = search.quickRange || 'today'
  const customFrom = search.customFrom || todayStart().toISOString().split('T')[0]
  const customTo = search.customTo || new Date().toISOString().split('T')[0]
  const typeFilter = search.typeFilter || 'all'
  const kasirFilter = search.kasirFilter || 'all'

  const setQuickRange = (range: QuickRange) => navigate({ search: (prev) => ({ ...prev, quickRange: range }) })
  const setCustomFrom = (val: string) => navigate({ search: (prev) => ({ ...prev, customFrom: val }) })
  const setCustomTo = (val: string) => navigate({ search: (prev) => ({ ...prev, customTo: val }) })
  const setTypeFilter = (val: TransactionFilters['type']) => navigate({ search: (prev) => ({ ...prev, typeFilter: val }) })
  const setKasirFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, kasirFilter: val }) })

  const [selectedKasirProfile, setSelectedKasirProfile] = useState<Partial<Profile> | null>(null)

  const [listRef] = useAutoAnimate()

  const { data: cashiers } = useCashiers()
  
  const deleteTxMutation = useDeleteTransaction()
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<TransactionWithItems | null>(null)

  const dateRange =
    quickRange === 'custom'
      ? { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) }
      : getDateRange(quickRange)

  const { data: transactions, isLoading } = useTransactions({
    dateRange,
    type: typeFilter,
    recordedBy: isAdmin && kasirFilter !== 'all' ? kasirFilter : undefined,
  })

  const { omzet, pengeluaran, profit, net } = useMemo(() => {
    let o = 0
    let p = 0
    let pr = 0

    if (transactions) {
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i]
        if (t.type === 'penjualan') {
          o += t.total_amount
          pr += t.total_profit
        } else if (t.type === 'pengeluaran') {
          p += t.total_amount
        }
      }
    }

    return {
      omzet: o,
      pengeluaran: p,
      profit: pr,
      net: o - p,
    }
  }, [transactions])

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen size={18} className="text-primary" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Buku Kas</h1>
          <p className="text-xs text-neutral-500">
            {isAdmin ? 'Semua transaksi' : 'Transaksi saya'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full min-w-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full min-w-0">
          <Filter size={14} className="text-neutral-400 flex-shrink-0" />
          {QUICK_RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setQuickRange(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.96] whitespace-nowrap flex-shrink-0 ${
                quickRange === key
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
          {isAdmin && (
            <CustomSelect
              value={kasirFilter}
              onChange={(val) => setKasirFilter(val)}
              options={[
                { value: 'all', label: 'Semua Kasir' },
                ...(cashiers?.map((c) => ({ value: c.id, label: c.full_name })) || []),
              ]}
              className="min-w-[130px]"
            />
          )}
          <CustomSelect
            value={typeFilter as string}
            onChange={(val) => setTypeFilter(val as TransactionFilters['type'])}
            options={[
              { value: 'all', label: 'Semua Tipe' },
              { value: 'penjualan', label: 'Penjualan' },
              { value: 'pengeluaran', label: 'Pengeluaran' },
            ]}
          />
        </div>
      </div>

      {quickRange === 'custom' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 bg-white border border-neutral-200 rounded-xl p-2 sm:p-1.5 shadow-sm w-full sm:max-w-fit">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          />
          <span className="text-neutral-400 text-xs font-semibold px-1">s/d</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          />
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        <SummaryCard
          label="Omzet"
          value={formatRupiah(omzet)}
          icon={TrendingUp}
          color="text-primary"
          bg="bg-primary/10"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Total Pengeluaran"
          value={formatRupiah(pengeluaran)}
          icon={TrendingDown}
          color="text-danger"
          bg="bg-danger/10"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Profit Kotor"
          value={formatRupiah(profit)}
          icon={ArrowLeftRight}
          color="text-success"
          bg="bg-success/10"
          isLoading={isLoading}
        />
        <SummaryCard
          label="Profit Bersih"
          value={formatRupiah(net)}
          icon={DollarSign}
          color={net >= 0 ? 'text-success' : 'text-danger'}
          bg={net >= 0 ? 'bg-success/10' : 'bg-danger/10'}
          isLoading={isLoading}
        />
      </motion.div>

      {isLoading && (
        <>
          <div className="space-y-2 md:hidden">
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="app-card p-3.5 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Skeleton className="h-4 w-20" />
                  {isAdmin && <Skeleton className="h-3 w-16" />}
                </div>
              </div>
            ))}
          </div>

          <div className="app-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Waktu
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Keterangan
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Tipe
                    </th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                        Kasir
                      </th>
                    )}
                    <th className="text-right py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Jumlah
                    </th>
                    {isAdmin && (
                      <th className="text-right py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                        Profit
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[1, 2, 3, 4, 5].map((k) => (
                    <tr key={k}>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isLoading && !transactions?.length && (
        <EmptyState
          icon={BookOpen}
          title="Tidak ada transaksi"
          description="Tidak ada transaksi untuk filter yang dipilih"
        />
      )}

      {!isLoading && transactions && transactions.length > 0 && (
        <>
          <div ref={listRef} className="space-y-2 md:hidden">
            {transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                className="app-card p-3.5 flex items-center gap-3 relative"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' as const, delay: idx * 0.03 }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'penjualan' ? 'bg-success/10' : 'bg-danger/10'
                  }`}
                >
                  {tx.type === 'penjualan' ? (
                    <TrendingUp size={15} className="text-success" />
                  ) : (
                    <TrendingDown size={15} className="text-danger" />
                  )}
                </div>
                {isAdmin && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditingTx(tx as TransactionWithItems)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit Transaksi"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTxId(tx.id)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-sm font-medium text-neutral-900 pr-12">
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
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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

                  {isAdmin && tx.profiles && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedKasirProfile(tx.profiles as Partial<Profile>)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold"
                      >
                        <span className="truncate max-w-[120px]">{tx.profiles.full_name}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-end justify-between mt-1.5 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 tabular-nums pb-0.5 min-w-0">
                        {formatDateTime(tx.transaction_at)}
                      </span>

                    </div>

                    <div className="flex flex-col items-end leading-tight flex-shrink-0">
                      <span
                        className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                          tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {tx.type === 'penjualan' ? '+' : '−'}
                        {formatRupiah(tx.total_amount)}
                      </span>
                      {isAdmin && tx.type === 'penjualan' && (
                        <span className="text-[10px] text-neutral-400 tabular-nums mt-0.5">
                          profit {formatRupiah(tx.total_profit)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="app-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Waktu
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Keterangan
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Tipe
                    </th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                        Kasir
                      </th>
                    )}
                    <th className="text-right py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Jumlah
                    </th>
                    {isAdmin && (
                      <th className="text-right py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                        Profit
                      </th>
                    )}
                    {isAdmin && (
                      <th className="text-right py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide w-20">
                        
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody ref={listRef} className="divide-y divide-neutral-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                        {formatDateTime(tx.transaction_at)}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-2 mb-0.5">
                          <div className="text-sm font-medium text-neutral-900">
                            {tx.type === 'penjualan' ? (
                              <div className="flex flex-col gap-0.5">
                                {(tx as TransactionWithItems).transaction_items &&
                                (tx as TransactionWithItems).transaction_items.length > 1 ? (
                                  (tx as TransactionWithItems).transaction_items.map((i, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className="text-neutral-400">•</span>
                                      <span>
                                        {i.product_name}{' '}
                                        <span className="text-neutral-400 tabular-nums">
                                          x{i.quantity}
                                        </span>
                                      </span>
                                    </div>
                                  ))
                                ) : (tx as TransactionWithItems).transaction_items?.length === 1 ? (
                                  <span>
                                    {(tx as TransactionWithItems).transaction_items[0].product_name}{' '}
                                    <span className="text-neutral-400 tabular-nums">
                                      x{(tx as TransactionWithItems).transaction_items[0].quantity}
                                    </span>
                                  </span>
                                ) : (
                                  <span>Penjualan</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{tx.description}</span>
                                {tx.type === 'pengeluaran' && tx.expense_category && (
                                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex-shrink-0">
                                    {
                                      EXPENSE_CATEGORY_LABELS[
                                        tx.expense_category as ExpenseCategory
                                      ]
                                    }
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {tx.notes && (
                          <p className="text-xs text-neutral-500 truncate italic mt-1">
                            "{tx.notes}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <TransactionBadge type={tx.type} />
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-neutral-600 truncate max-w-[120px]">
                          <button
                            type="button"
                            onClick={() => setSelectedKasirProfile(tx.profiles as Partial<Profile>)}
                            className="hover:text-primary transition-colors focus:outline-none"
                          >
                            {tx.profiles?.full_name ?? 'Sistem'}
                          </button>
                        </td>
                      )}
                      <td
                        className={`py-3 px-4 text-right font-semibold tabular-nums ${
                          tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {tx.type === 'penjualan' ? '+' : '−'}
                        {formatRupiah(tx.total_amount)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right tabular-nums text-neutral-600">
                          {tx.type === 'penjualan' ? formatRupiah(tx.total_profit) : '—'}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingTx(tx as TransactionWithItems)}
                              className="p-1.5 rounded-lg text-neutral-300 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTxId(tx.id)}
                              className="p-1.5 rounded-lg text-neutral-300 hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-3 text-right tabular-nums">
            {transactions.length} transaksi
          </p>
        </>
      )}

      <CashierProfileModal
        isOpen={!!selectedKasirProfile}
        onClose={() => setSelectedKasirProfile(null)}
        profile={selectedKasirProfile}
      />

      <ConfirmDialog
        isOpen={!!deletingTxId}
        title="Hapus Transaksi?"
        description="Data transaksi ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan dan akan mempengaruhi laporan keuangan."
        confirmText={deleteTxMutation.isPending ? 'Menghapus...' : 'Hapus'}
        onConfirm={() => {
          if (deletingTxId) {
            deleteTxMutation.mutate(deletingTxId, {
              onSuccess: () => setDeletingTxId(null),
            })
          }
        }}
        onCancel={() => setDeletingTxId(null)}
      />

      <EditTransactionModal
        transaction={editingTx}
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  isLoading,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  color: string
  bg: string
  isLoading: boolean
}) {
  return (
    <motion.div
      className="app-card p-4 flex items-center gap-4"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 280 } },
      }}
    >
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} className={color} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 break-words">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-6 w-3/4 rounded-md" />
        ) : (
          <p
            className={`text-lg sm:text-xl md:text-2xl font-bold tabular-nums break-words ${color}`}
          >
            {value}
          </p>
        )}
      </div>
    </motion.div>
  )
}
