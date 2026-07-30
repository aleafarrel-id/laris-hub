import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { EditExpenseForm } from '@/components/kasir/EditExpenseForm'
import { EditSaleForm } from '@/components/kasir/EditSaleForm'
import type { TransactionWithItems } from '@/types'

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: TransactionWithItems | null
  isOpen: boolean
  onClose: () => void
}) {
  const [cachedTx, setCachedTx] = useState<TransactionWithItems | null>(transaction)

  useEffect(() => {
    if (transaction) {
      setCachedTx(transaction)
    }
  }, [transaction])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cachedTx?.type === 'penjualan' ? 'Edit Penjualan' : 'Edit Pengeluaran'}
    >
      {cachedTx?.type === 'penjualan' ? (
        <EditSaleForm transaction={cachedTx} onSuccess={onClose} />
      ) : cachedTx?.type === 'pengeluaran' ? (
        <EditExpenseForm transaction={cachedTx} onSuccess={onClose} />
      ) : null}
    </Modal>
  )
}
