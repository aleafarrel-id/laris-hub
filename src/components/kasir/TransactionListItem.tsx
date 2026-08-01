import { CheckCircle2, ShoppingCart, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { memo } from 'react'
import { PaymentMethodBadge, StatusBadge } from '@/components/ui/Badge'
import { TransactionDetails } from '@/components/ui/TransactionItemsDisplay'
import { formatRupiah, formatTime } from '@/lib/utils'
import type { TransactionWithItems } from '@/types'

interface TransactionListItemProps {
  tx: TransactionWithItems
  idx: number
  onClick?: (tx: TransactionWithItems) => void
  onUpdateStatus?: (id: string, status: 'sukses' | 'pending') => void
}

export const TransactionListItem = memo(function TransactionListItem({
  tx,
  idx,
  onClick,
  onUpdateStatus,
}: TransactionListItemProps) {
  const isPendingQris = tx.type === 'penjualan' && tx.status === 'pending'

  return (
    <motion.div
      onClick={() => {
        if (!(tx as any).isOfflinePending) onClick?.(tx)
      }}
      className={`app-card p-3.5 flex items-stretch gap-3 hover:border-primary/30 transition-colors ${isPendingQris ? 'border-amber-200 bg-amber-50/30' : ''} ${
        (tx as any).isOfflinePending ? 'opacity-60 grayscale-[0.5] border-dashed cursor-not-allowed' : 'cursor-pointer'
      }`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: idx * 0.04 }}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-start mt-0.5 ${
          tx.type === 'penjualan' ? 'bg-success/10' : 'bg-danger/10'
        }`}
      >
        {tx.type === 'penjualan' ? (
          <ShoppingCart size={14} className="text-success" />
        ) : (
          <Wallet size={14} className="text-danger" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="text-sm font-medium text-neutral-900 pr-4">
            <TransactionDetails transaction={tx} isMobile />
          </div>

          {tx.type === 'penjualan' && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <PaymentMethodBadge method={tx.payment_method} />
              <StatusBadge status={tx.status} />
            </div>
          )}
        </div>

        <p className="text-[11px] text-neutral-400 tabular-nums mt-1.5">
          {formatTime(tx.transaction_at)}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0 pl-2">
        <span
          className={`text-sm font-bold tabular-nums whitespace-nowrap ${
            tx.type === 'penjualan' ? 'text-success' : 'text-danger'
          }`}
        >
          {tx.type === 'penjualan' ? '+' : '−'}
          {formatRupiah(tx.total_amount)}
        </span>

        {!(tx as any).isOfflinePending ? (
          isPendingQris && onUpdateStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onUpdateStatus(tx.id, 'sukses')
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-semibold cursor-pointer shadow-sm active:scale-95 mt-2"
            >
              <CheckCircle2 size={15} />
              Selesai
            </button>
          )
        ) : (
          <span className="text-[10px] font-semibold text-neutral-400 mt-2 text-right">
            Menunggu<br/>Sinkronisasi
          </span>
        )}
      </div>
    </motion.div>
  )
})
