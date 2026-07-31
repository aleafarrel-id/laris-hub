import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ExpenseForm } from '@/components/kasir/ExpenseForm'
import { SaleForm } from '@/components/kasir/SaleForm'
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
        <SaleForm transaction={cachedTx} onSuccess={onClose} />
      ) : cachedTx?.type === 'pengeluaran' ? (
        <ExpenseForm transaction={cachedTx} onSuccess={onClose} />
      ) : null}
    </Modal>
  )
}
