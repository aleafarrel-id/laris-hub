import { motion, AnimatePresence } from 'motion/react'
import { Banknote, QrCode, X } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (method: 'tunai' | 'qris', status: 'sukses' | 'pending') => void
  totalAmount: number
  isPending: boolean
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  isPending,
}: PaymentMethodModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isPending ? onClose : undefined}
            className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">Pilih Pembayaran</h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Amount Summary */}
              <div className="px-6 py-8 bg-neutral-50/50 flex flex-col items-center justify-center">
                <span className="text-sm font-medium text-neutral-500 mb-1">Total Tagihan</span>
                <span className="text-3xl font-black text-neutral-900 tabular-nums tracking-tight">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Options */}
              <div className="p-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => onConfirm('tunai', 'sukses')}
                  disabled={isPending}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-neutral-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Banknote size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start flex-1 text-left">
                    <span className="font-bold text-neutral-900 text-lg">Tunai</span>
                    <span className="text-sm text-neutral-500">Bayar dengan uang cash</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onConfirm('qris', 'pending')}
                  disabled={isPending}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-neutral-100 bg-white hover:border-blue-500 hover:bg-blue-50/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <QrCode size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start flex-1 text-left">
                    <span className="font-bold text-neutral-900 text-lg">QRIS</span>
                    <span className="text-sm text-neutral-500">Scan kode QR (Gopay Merchant)</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
