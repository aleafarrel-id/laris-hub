import { useAutoAnimate } from '@formkit/auto-animate/react'
import { CheckCircle2, Edit3, ShoppingBag, ShoppingCart, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { PaymentMethodBadge, StatusBadge, TransactionBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionDetailModal } from '@/components/ui/TransactionDetailModal'
import { TransactionDetails } from '@/components/ui/TransactionItemsDisplay'
import { formatRupiah, formatTime } from '@/lib/utils'
import type { Profile, TransactionWithItems } from '@/types'

interface RecentTransactionsTableProps {
  transactions: TransactionWithItems[] | undefined
  isLoading: boolean
  isAdmin: boolean
  onEditTransaction: (tx: TransactionWithItems) => void
  onDeleteTransaction: (id: string) => void
  onSelectCashierProfile: (profile: Partial<Profile>) => void
  onUpdateStatus?: (id: string, status: 'success' | 'pending') => void
}

export function RecentTransactionsTable({
  transactions,
  isLoading,
  isAdmin,
  onEditTransaction,
  onDeleteTransaction,
  onSelectCashierProfile,
  onUpdateStatus,
}: RecentTransactionsTableProps) {
  const [viewingTx, setViewingTx] = useState<TransactionWithItems | null>(null)
  const [mobileListRef] = useAutoAnimate<HTMLDivElement>()
  const [tbodyRef] = useAutoAnimate<HTMLTableSectionElement>()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((k) => (
          <div key={k} className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!transactions?.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Belum ada transaksi"
        description="Transaksi terbaru akan muncul di sini"
      />
    )
  }

  return (
    <>
      <div ref={mobileListRef} className="flex flex-col gap-3 md:hidden">
        {transactions.map((tx) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => !tx.isOfflinePending && setViewingTx(tx)}
            className={`flex items-center gap-3 p-3.5 bg-neutral-50/50 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors relative cursor-pointer text-left w-full ${
              tx.isOfflinePending ? 'opacity-60 grayscale cursor-not-allowed' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'sale' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              {tx.type === 'sale' ? <ShoppingCart size={18} /> : <Wallet size={18} />}
            </div>
            {isAdmin && !tx.isOfflinePending && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditTransaction(tx as TransactionWithItems)
                  }}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Edit Transaksi"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTransaction(tx.id)
                  }}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  title="Hapus Transaksi"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-sm font-medium text-neutral-900 pr-12">
                <TransactionDetails transaction={tx} isMobile />
              </div>

              {tx.type === 'sale' && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <PaymentMethodBadge method={tx.payment_method} />
                  <StatusBadge status={tx.status} />
                </div>
              )}

              {tx.profiles && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectCashierProfile(tx.profiles as Partial<Profile>)
                    }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold"
                  >
                    <span className="truncate max-w-[120px]">{tx.profiles.full_name}</span>
                  </button>
                </div>
              )}

              <div className="flex items-end justify-between mt-1.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 tabular-nums pb-0.5">
                    {formatTime(tx.transaction_at as string)}
                  </span>
                </div>
                <div className="flex flex-col items-end leading-tight">
                  <span
                    className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                      tx.type === 'sale' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {tx.type === 'sale' ? '+' : '−'}
                    {formatRupiah(tx.total_amount)}
                  </span>
                  {tx.type === 'sale' && tx.status === 'pending' && onUpdateStatus && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateStatus(tx.id, 'success')
                      }}
                      className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[11px] font-semibold cursor-pointer shadow-sm active:scale-95"
                    >
                      <CheckCircle2 size={12} />
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50/80 border-b border-neutral-200">
            <tr>
              <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide rounded-tl-lg">
                Waktu
              </th>
              <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                Keterangan
              </th>
              <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                Tipe
              </th>
              <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                Kasir
              </th>
              <th className="text-right py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                Jumlah
              </th>
              <th className="text-right py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide rounded-tr-lg w-20" />
            </tr>
          </thead>
          <tbody ref={tbodyRef} className="divide-y divide-neutral-100">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => !tx.isOfflinePending && setViewingTx(tx)}
                className={`hover:bg-neutral-50/80 transition-colors cursor-pointer ${
                  tx.isOfflinePending ? 'opacity-60 grayscale cursor-not-allowed' : ''
                }`}
              >
                <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                  {formatTime(tx.transaction_at as string)}
                </td>
                <td className="py-2.5 px-4 max-w-[200px] align-top">
                  <TransactionDetails transaction={tx} />
                </td>
                <td className="py-2.5 px-4 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <TransactionBadge type={tx.type} />
                    {tx.type === 'sale' && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <PaymentMethodBadge method={tx.payment_method} />
                        <StatusBadge status={tx.status} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-neutral-600 truncate max-w-[120px] align-top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectCashierProfile(tx.profiles as Partial<Profile>)
                    }}
                    className="hover:text-primary transition-colors focus:outline-none"
                  >
                    {tx.profiles?.full_name ?? 'Sistem'}
                  </button>
                </td>
                <td
                  className={`py-2.5 px-4 text-right font-bold tabular-nums align-top ${
                    tx.type === 'sale' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'sale' ? '+' : '−'}
                  {formatRupiah(tx.total_amount)}
                </td>
                <td className="py-2.5 px-4 text-right align-top">
                  {!tx.isOfflinePending ? (
                    <div className="flex justify-end items-center gap-1">
                      {tx.type === 'sale' && tx.status === 'pending' && onUpdateStatus && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateStatus(tx.id, 'success')
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-semibold cursor-pointer shadow-sm active:scale-95"
                        >
                          <CheckCircle2 size={14} />
                          Selesai
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditTransaction(tx)
                        }}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title="Edit Transaksi"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTransaction(tx.id)
                        }}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end items-center gap-1 text-xs text-neutral-400 font-medium">
                      Menunggu Sinkronisasi
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionDetailModal
        isOpen={!!viewingTx}
        onClose={() => setViewingTx(null)}
        transaction={viewingTx}
      />
    </>
  )
}
