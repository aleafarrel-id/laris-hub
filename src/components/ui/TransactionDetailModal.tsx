import { Calendar, CreditCard, FileText, Tag, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PaymentMethodBadge, StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TransactionDetails } from '@/components/ui/TransactionItemsDisplay'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Profile, TransactionWithItems } from '@/types'

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: (TransactionWithItems & { profiles?: Partial<Profile> | null }) | null
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [cachedTx, setCachedTx] = useState<TransactionDetailModalProps['transaction']>(transaction)

  useEffect(() => {
    if (transaction) {
      setCachedTx(transaction)
    }
  }, [transaction])

  const txToRender = transaction || cachedTx

  if (!txToRender) return null

  const isExpense = txToRender.type === 'expense'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" variant={isDesktop ? 'center' : 'bottom'}>
      <div className={isDesktop ? 'pb-2' : ''}>
        {/* Header or Amount Area */}
        <div
          className={`p-6 border-b border-neutral-100 flex flex-col items-center justify-center text-center ${isExpense ? 'bg-danger/5' : 'bg-success/5'}`}
        >
          <div
            className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isExpense ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}
          >
            {isExpense ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
            {isExpense ? 'Total Pengeluaran' : 'Total Penjualan'}
          </p>
          <p
            className={`text-3xl font-black tabular-nums tracking-tight ${isExpense ? 'text-danger' : 'text-success'}`}
          >
            {formatRupiah(txToRender.total_amount)}
          </p>
        </div>

        {/* Info Grid */}
        <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-2 border-b border-neutral-100">
          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <Calendar size={13} /> Tanggal & Waktu
            </p>
            <p className="text-sm font-medium text-neutral-900">
              {formatDateTime(txToRender.transaction_at as string)}
            </p>
          </div>
          {!isExpense && (
            <>
              <div className="flex flex-col items-center text-center">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                  <Tag size={13} /> Status
                </p>
                <div className="mt-0.5 flex justify-center">
                  <StatusBadge status={txToRender.status} forceShow />
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                  <CreditCard size={13} /> Pembayaran
                </p>
                <div className="mt-0.5 flex justify-center">
                  <PaymentMethodBadge method={txToRender.payment_method} forceShow />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <User size={13} /> Kasir
            </p>
            <p className="text-sm font-medium text-neutral-900 truncate max-w-full">
              {txToRender.profiles?.full_name || 'Sistem'}
            </p>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-5">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText size={13} /> Rincian Transaksi
          </p>
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <TransactionDetails transaction={txToRender as TransactionWithItems} />
          </div>
        </div>
      </div>
    </Modal>
  )
}
