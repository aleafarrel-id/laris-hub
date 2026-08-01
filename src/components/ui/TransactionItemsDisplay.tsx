import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import type { TransactionWithItems } from '@/types'

interface TransactionDetailsProps {
  transaction: Pick<
    TransactionWithItems,
    'type' | 'description' | 'transaction_items' | 'expense_items' | 'expense_category' | 'notes'
  >
  isMobile?: boolean
}

/**
 * Unified component for displaying transaction details.
 * Renders:
 * 1. Description (if any) and Category Badge side-by-side
 * 2. List of items purchased (sale items or expense items)
 * 3. Notes (if any)
 */
export function TransactionDetails({ transaction, isMobile }: TransactionDetailsProps) {
  const isExpense = transaction.type === 'pengeluaran'
  
  // Offline pending transactions inject `items` instead of `expense_items` / `transaction_items`
  const rawExpense = transaction.expense_items ?? (transaction as any).items
  const expenseItems = Array.isArray(rawExpense) ? rawExpense : []
  const hasExpenseItems = isExpense && expenseItems.length > 0
  
  const rawSale = transaction.transaction_items ?? (transaction as any).items
  const saleItems = Array.isArray(rawSale) ? rawSale : []
  const hasSaleItems = !isExpense && saleItems.length > 0

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-1.5' : 'gap-2'} text-left w-full`}>
      {/* 1. Keterangan & Badge */}
      {(isExpense || !hasSaleItems) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-neutral-900 text-sm">
            {isExpense ? transaction.description : 'Penjualan'}
          </span>
          {isExpense && transaction.expense_category && (
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex-shrink-0">
              {EXPENSE_CATEGORY_LABELS[transaction.expense_category as ExpenseCategory]}
            </span>
          )}
        </div>
      )}

      {/* 2. Detail barang */}
      {hasExpenseItems && (
        <div
          className={`flex flex-col gap-0.5 ${isMobile ? 'text-sm text-neutral-900' : 'text-sm text-neutral-700'}`}
        >
          {expenseItems.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: no stable unique id here
            <div key={index} className={`flex items-start gap-1.5 ${isMobile ? 'min-w-0' : ''}`}>
              <span className="text-neutral-400 flex-shrink-0">•</span>
              <span className={isMobile ? 'truncate' : ''}>
                {item.name}{' '}
                <span className="text-neutral-400 font-normal tabular-nums text-xs">
                  x{item.qty}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {hasSaleItems && (
        <div className="flex flex-col gap-0.5 text-sm text-neutral-900">
          {saleItems.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: no stable unique id here
            <div key={index} className={`flex items-start gap-1.5 ${isMobile ? 'min-w-0' : ''}`}>
              <span className="text-neutral-400 flex-shrink-0">•</span>
              <span className={isMobile ? 'truncate' : ''}>
                {item.product_name}{' '}
                <span className="text-neutral-400 font-normal tabular-nums text-xs">
                  x{item.quantity}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Catatan */}
      {transaction.notes && (
        <p className="text-xs text-neutral-500 truncate italic">"{transaction.notes}"</p>
      )}
    </div>
  )
}
