import { CheckCircle2, ShoppingCart, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { memo } from 'react'
import { PaymentMethodBadge, StatusBadge } from '@/components/ui/Badge'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatRupiah, formatTime } from '@/lib/utils'
import type { TransactionWithItems } from '@/types'

interface TransactionListItemProps {
  tx: TransactionWithItems
  idx: number
  onUpdateStatus?: (id: string, status: 'sukses' | 'pending') => void
}

export const TransactionListItem = memo(function TransactionListItem({
  tx,
  idx,
  onUpdateStatus,
}: TransactionListItemProps) {
  const isPendingQris = tx.type === 'penjualan' && tx.status === 'pending'

  return (
    <motion.div
      className={`app-card p-3.5 flex items-stretch gap-3 ${isPendingQris ? 'border-amber-200 bg-amber-50/30' : ''}`}
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
          <div className="text-sm font-medium text-neutral-900">
            {tx.type === 'penjualan' ? (
              <div className="flex flex-col gap-0.5">
                {tx.transaction_items && tx.transaction_items.length > 1 ? (
                  tx.transaction_items.map((i, index) => (
                    <div key={index} className="flex items-start gap-1.5 min-w-0">
                      <span className="text-neutral-400 flex-shrink-0">•</span>
                      <span className="truncate">
                        {i.product_name}{' '}
                        <span className="text-neutral-400 font-normal tabular-nums text-xs">
                          x{i.quantity}
                        </span>
                      </span>
                    </div>
                  ))
                ) : tx.transaction_items?.length === 1 ? (
                  <p className="truncate">
                    {tx.transaction_items[0].product_name}{' '}
                    <span className="text-neutral-400 font-normal tabular-nums text-xs">
                      x{tx.transaction_items[0].quantity}
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

        {isPendingQris && onUpdateStatus && (
          <button
            type="button"
            onClick={() => onUpdateStatus(tx.id, 'sukses')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-semibold cursor-pointer shadow-sm active:scale-95 mt-2"
          >
            <CheckCircle2 size={15} />
            Selesai
          </button>
        )}
      </div>
    </motion.div>
  )
})
