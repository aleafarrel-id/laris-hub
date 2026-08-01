import { useQuery } from '@tanstack/react-query'
import { ExpenseForm } from '@/components/kasir/ExpenseForm'
import { SaleForm } from '@/components/kasir/SaleForm'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { QUERY_KEYS } from '@/lib/constants'
import { getTransactionWithItems } from '@/services/transaction.service'
import type { TransactionWithItems, TransactionWithProfile } from '@/types'

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: TransactionWithProfile | TransactionWithItems | null
  isOpen: boolean
  onClose: () => void
}) {
  const { data: fullTx, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'detail', transaction?.id],
    queryFn: () => getTransactionWithItems(transaction!.id),
    enabled: isOpen && !!transaction?.id,
  })

  const cachedTx = fullTx ?? (transaction as TransactionWithItems)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cachedTx?.type === 'penjualan' ? 'Edit Penjualan' : 'Edit Pengeluaran'}
    >
      {isLoading ? (
        <div className="p-4 flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : cachedTx?.type === 'penjualan' ? (
        <SaleForm transaction={cachedTx} onSuccess={onClose} />
      ) : cachedTx?.type === 'pengeluaran' ? (
        <ExpenseForm transaction={cachedTx} onSuccess={onClose} />
      ) : null}
    </Modal>
  )
}
