import { Banknote, QrCode } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Portal } from '@/components/ui/Portal'
import { formatRupiah } from '@/lib/utils'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (method: 'tunai' | 'qris', status: 'sukses' | 'pending') => void
  totalAmount: number
  isPending: boolean
  activeMethod?: 'tunai' | 'qris'
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  isPending,
  activeMethod,
}: PaymentMethodModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Portal className="z-50" role="dialog">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isPending ? onClose : undefined}
            className="absolute inset-0 bg-neutral-900/60"
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col will-change-transform"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-center">
                <h3 className="text-lg font-bold text-neutral-900">Pilih Pembayaran</h3>
              </div>

              {/* Amount Summary */}
              <div className="px-6 py-8 bg-neutral-50/50 flex flex-col items-center justify-center">
                <span className="text-[13px] font-medium text-neutral-500 mb-1">Total Tagihan</span>
                <span className="text-2xl sm:text-3xl font-black text-neutral-900 tabular-nums tracking-tight">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Options */}
              <div className="p-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => onConfirm('tunai', 'sukses')}
                  disabled={isPending}
                  className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                    activeMethod === 'tunai'
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-neutral-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/30'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                      activeMethod === 'tunai'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 text-emerald-600 group-hover:scale-110'
                    }`}
                  >
                    <Banknote size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start flex-1 text-left">
                    <span className="font-bold text-neutral-900 text-[15px] sm:text-base">
                      Tunai
                    </span>
                    <span className="text-xs text-neutral-500">Bayar dengan uang tunai</span>
                  </div>
                  {activeMethod === 'tunai' && (
                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onConfirm('qris', 'pending')}
                  disabled={isPending}
                  className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                    activeMethod === 'qris'
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-neutral-100 bg-white hover:border-blue-500 hover:bg-blue-50/30'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                      activeMethod === 'qris'
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-600 group-hover:scale-110'
                    }`}
                  >
                    <QrCode size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start flex-1 text-left">
                    <span className="font-bold text-neutral-900 text-[15px] sm:text-base">
                      QRIS
                    </span>
                    <span className="text-xs text-neutral-500">Scan kode QR (Gopay Merchant)</span>
                  </div>
                  {activeMethod === 'qris' && (
                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  )
}
