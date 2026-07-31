import { Edit3, TrendingDown, TrendingUp, Trash2, CheckCircle2 } from 'lucide-react'
import { motion } from 'motion/react'
import { PaymentMethodBadge, StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionDetails } from '@/components/ui/TransactionItemsDisplay'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Profile, TransactionWithProfile, TransactionWithItems } from '@/types'

interface BukuKasMobileListProps {
  transactions: TransactionWithProfile[]
  isAdmin: boolean
  isLoading: boolean
  onEditTransaction: (tx: TransactionWithItems) => void
  onDeleteTransaction: (id: string) => void
  onSelectKasirProfile: (profile: Partial<Profile>) => void
  onUpdateStatus?: (id: string, status: 'sukses' | 'pending') => void
}

const SKELETON_COUNT = 5

/** Mobile card skeleton while transactions are loading. */
function MobileListSkeleton({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="space-y-2 md:hidden">
      {Array.from({ length: SKELETON_COUNT }, (_, k) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
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
  )
}

/**
 * Mobile card list view for Buku Kas transactions.
 * Rendered only on screens below `md:` breakpoint.
 */
export function BukuKasMobileList({
  transactions,
  isAdmin,
  isLoading,
  onEditTransaction,
  onDeleteTransaction,
  onSelectKasirProfile,
  onUpdateStatus,
}: BukuKasMobileListProps) {
  if (isLoading) return <MobileListSkeleton isAdmin={isAdmin} />

  return (
    <div className="space-y-2 md:hidden">
      {transactions.map((tx, idx) => (
        <motion.div
          key={tx.id}
          className="app-card p-3.5 flex items-center gap-3 relative"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const, delay: Math.min(idx * 0.03, 0.3) }}
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
                onClick={() => onEditTransaction(tx as unknown as TransactionWithItems)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit Transaksi"
              >
                <Edit3 size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDeleteTransaction(tx.id)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
                title="Hapus Transaksi"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="text-sm font-medium text-neutral-900 pr-12">
              <TransactionDetails transaction={tx as unknown as TransactionWithItems} isMobile />
            </div>


            {tx.type === 'penjualan' && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <PaymentMethodBadge method={tx.payment_method} />
                <StatusBadge status={tx.status} />
              </div>
            )}

            {isAdmin && tx.profiles && (
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => onSelectKasirProfile(tx.profiles as Partial<Profile>)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold"
                >
                  <span className="truncate max-w-[120px]">{tx.profiles.full_name}</span>
                </button>
              </div>
            )}

            <div className="flex items-end justify-between mt-1.5 gap-2">
              <span className="text-[11px] text-neutral-400 tabular-nums pb-0.5 min-w-0">
                {formatDateTime(tx.transaction_at)}
              </span>
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
                {tx.type === 'penjualan' && tx.status === 'pending' && onUpdateStatus && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(tx.id, 'sukses')}
                    className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[11px] font-semibold cursor-pointer shadow-sm active:scale-95"
                  >
                    <CheckCircle2 size={12} />
                    Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
