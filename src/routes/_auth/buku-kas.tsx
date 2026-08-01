import { createFileRoute } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { BukuKasFilters } from '@/components/buku-kas/BukuKasFilters'
import { BukuKasMobileList } from '@/components/buku-kas/BukuKasMobileList'
import { BukuKasSummary } from '@/components/buku-kas/BukuKasSummary'
import { BukuKasTableDesktop } from '@/components/buku-kas/BukuKasTableDesktop'
import { CashierProfileModal } from '@/components/ui/CashierProfileModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EditTransactionModal } from '@/components/ui/EditTransactionModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { WifiOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { type BukuKasSearch, useBukuKasFilters } from '@/hooks/useBukuKasFilters'
import { useCashiers } from '@/hooks/useProfile'
import {
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransactionSummary,
  useUpdateTransactionStatus,
} from '@/hooks/useTransactions'
import type { Profile, TransactionWithItems } from '@/types'

export const Route = createFileRoute('/_auth/buku-kas')({
  validateSearch: (search: Record<string, unknown>): BukuKasSearch => {
    return {
      quickRange: search.quickRange as any,
      customFrom: search.customFrom as string | undefined,
      customTo: search.customTo as string | undefined,
      typeFilter: search.typeFilter as any,
      kasirFilter: search.kasirFilter as string | undefined,
      paymentMethodFilter: search.paymentMethodFilter as any,
    }
  },
  component: BukuKasPage,
})

// Filter logic extracted to useBukuKasFilters

function BukuKasPage() {
  const { profile } = useAuth()
  const {
    quickRange,
    customFrom,
    customTo,
    typeFilter,
    kasirFilter,
    paymentMethodFilter,
    filters,
    updateSearch,
  } = useBukuKasFilters()

  const [selectedKasirProfile, setSelectedKasirProfile] = useState<Partial<Profile> | null>(null)
  const [editingTx, setEditingTx] = useState<TransactionWithItems | null>(null)
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  // Queries
  const { data: cashiers } = useCashiers()
  const {
    data: paginatedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isTransactionsLoading,
    isOfflinePaused: isTransactionsOffline,
  } = useInfiniteTransactions(filters, 25)

  const { data: summaryData, isLoading: isSummaryLoading, isOfflinePaused: isSummaryOffline } = useTransactionSummary({
    dateRange: filters.dateRange,
    type: filters.type,
    recordedBy: filters.recordedBy,
  })

  // Mutations
  const deleteTxMutation = useDeleteTransaction()
  const updateStatusMutation = useUpdateTransactionStatus()

  const handleUpdateStatus = (id: string, status: 'sukses' | 'pending') => {
    updateStatusMutation.mutate({ id, status })
  }

  // Prepare data
  const transactions = useMemo(() => {
    return paginatedData?.pages.flatMap((page) => page.data) ?? []
  }, [paginatedData])

  const omzet = summaryData?.totalSales ?? 0
  const omzetTunai = summaryData?.totalSalesTunai ?? 0
  const omzetQris = summaryData?.totalSalesQris ?? 0
  const pendingQris = summaryData?.totalPendingQris ?? 0
  const pengeluaran = summaryData?.totalExpenses ?? 0
  const profit = summaryData?.totalProfit ?? 0
  const net = profit - pengeluaran

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Buku Kas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Catatan lengkap pemasukan & pengeluaran</p>
        </div>
      </div>

      <BukuKasFilters
        isAdmin={isAdmin}
        quickRange={quickRange}
        customFrom={customFrom}
        customTo={customTo}
        typeFilter={typeFilter}
        kasirFilter={kasirFilter}
        paymentMethodFilter={paymentMethodFilter}
        cashiers={cashiers}
        onQuickRangeChange={(val) => updateSearch({ quickRange: val })}
        onCustomFromChange={(val) => updateSearch({ customFrom: val })}
        onCustomToChange={(val) => updateSearch({ customTo: val })}
        onTypeFilterChange={(val) => updateSearch({ typeFilter: val })}
        onKasirFilterChange={(val) => updateSearch({ kasirFilter: val })}
        onPaymentMethodFilterChange={(val) => updateSearch({ paymentMethodFilter: val })}
      />

      {isSummaryOffline ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm mb-6 flex items-center justify-center">
          <EmptyState
            icon={WifiOff}
            title="Ringkasan Tidak Tersedia"
            description="Data ringkasan untuk filter ini tidak tersimpan offline."
            action={{ label: 'Muat Ulang', onClick: () => window.location.reload() }}
          />
        </div>
      ) : (
      <BukuKasSummary
        omzet={omzet}
        omzetTunai={omzetTunai}
        omzetQris={omzetQris}
        pendingQris={pendingQris}
        pengeluaran={pengeluaran}
        profit={profit}
        net={net}
        isLoading={isSummaryLoading}
      />
      )}

      <AnimatePresence mode="wait">
        {isTransactionsOffline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-neutral-200 rounded-2xl"
          >
            <EmptyState
              icon={WifiOff}
              title="Daftar Transaksi Tidak Tersedia"
              description="Riwayat transaksi untuk filter ini tidak tersimpan offline. Coba lagi saat terhubung ke internet."
              action={{ label: 'Coba Lagi', onClick: () => window.location.reload() }}
            />
          </motion.div>
        ) : !isTransactionsLoading && (transactions?.length || 0) === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState
              icon={BookOpen}
              title="Tidak ada transaksi"
              description="Coba ubah filter rentang waktu atau tipe transaksi."
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <BukuKasTableDesktop
              transactions={transactions}
              isAdmin={isAdmin}
              isLoading={isTransactionsLoading}
              onEditTransaction={setEditingTx}
              onDeleteTransaction={setDeletingTxId}
              onSelectKasirProfile={setSelectedKasirProfile}
              onUpdateStatus={handleUpdateStatus}
            />

            <BukuKasMobileList
              transactions={transactions}
              isAdmin={isAdmin}
              isLoading={isTransactionsLoading}
              onEditTransaction={setEditingTx}
              onDeleteTransaction={setDeletingTxId}
              onSelectKasirProfile={setSelectedKasirProfile}
              onUpdateStatus={handleUpdateStatus}
            />

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-6 flex justify-center pb-8">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage ? 'Memuat...' : 'Muat Lebih Banyak'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CashierProfileModal
        isOpen={!!selectedKasirProfile}
        onClose={() => setSelectedKasirProfile(null)}
        profile={selectedKasirProfile}
      />

      <ConfirmDialog
        isOpen={!!deletingTxId}
        title="Hapus Transaksi?"
        description={
          <>
            <p className="text-sm text-neutral-600 leading-relaxed mb-1">
              Data transaksi ini akan dihapus permanen.
            </p>
            <p className="text-sm text-neutral-500">
              Aksi ini tidak dapat dibatalkan dan akan mempengaruhi laporan keuangan.
            </p>
          </>
        }
        confirmText={deleteTxMutation.isPending ? 'Menghapus...' : 'Hapus'}
        onConfirm={() => {
          if (deletingTxId) {
            deleteTxMutation.mutate(
              { id: deletingTxId },
              {
                onSuccess: () => setDeletingTxId(null),
                onError: () => setDeletingTxId(null),
              },
            )
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
