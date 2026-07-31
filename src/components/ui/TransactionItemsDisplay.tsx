import type { TransactionWithItems } from '@/types'

interface TransactionItemsDisplayProps {
  transaction: Pick<TransactionWithItems, 'type' | 'description' | 'transaction_items'>
}

/**
 * Renders the main description area of a transaction row.
 * For sales (`penjualan`), shows the list of product names + quantities.
 * For expenses (`pengeluaran`), shows the description text.
 *
 * Eliminates duplicated rendering logic between Buku Kas and Dashboard.
 */
export function TransactionItemsDisplay({ transaction }: TransactionItemsDisplayProps) {
  if (transaction.type !== 'penjualan') {
    return <span className="truncate">{transaction.description}</span>
  }

  const items = transaction.transaction_items ?? []

  if (items.length === 0) {
    return <span>Penjualan</span>
  }

  if (items.length === 1) {
    const item = items[0]
    return (
      <span>
        {item.product_name}{' '}
        <span className="text-neutral-400 tabular-nums">x{item.quantity}</span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable unique id here
        <div key={index} className="flex items-center gap-1.5">
          <span className="text-neutral-400">•</span>
          <span>
            {item.product_name}{' '}
            <span className="text-neutral-400 tabular-nums">x{item.quantity}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

/** Mobile-friendly variant with truncation for list cards. */
export function TransactionItemsMobileDisplay({ transaction }: TransactionItemsDisplayProps) {
  if (transaction.type !== 'penjualan') {
    return <p className="truncate">{transaction.description}</p>
  }

  const items = transaction.transaction_items ?? []

  if (items.length === 0) {
    return <p className="truncate">Penjualan</p>
  }

  if (items.length === 1) {
    const item = items[0]
    return (
      <p className="truncate">
        {item.product_name}{' '}
        <span className="text-neutral-400 font-normal tabular-nums text-xs">x{item.quantity}</span>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable unique id here
        <div key={index} className="flex items-start gap-1.5 min-w-0">
          <span className="text-neutral-400 flex-shrink-0">•</span>
          <span className="truncate">
            {item.product_name}{' '}
            <span className="text-neutral-400 font-normal tabular-nums text-xs">
              x{item.quantity}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
