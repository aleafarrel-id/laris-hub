import { CheckCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Input } from '@/components/ui/Input'
import { formatRupiah } from '@/lib/utils'

interface CheckoutPanelProps {
  cartSize: number
  totalItems: number
  totalAmount: number
  notes: string
  isPending: boolean
  onNotesChange: (value: string) => void
  onSubmit: () => void
}

/**
 * Sticky bottom panel for the sale form.
 * Shows the notes input + checkout button when the cart has items,
 * or a placeholder prompt when the cart is empty.
 */
export function CheckoutPanel({
  cartSize,
  totalItems,
  totalAmount,
  notes,
  isPending,
  onNotesChange,
  onSubmit,
}: CheckoutPanelProps) {
  return (
    <div className="sticky bottom-0 z-10 bg-white border-t border-neutral-200 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] mt-auto">
      <AnimatePresence mode="wait">
        {cartSize > 0 ? (
          <motion.div
            key="checkout"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
          >
            <Input
              type="text"
              placeholder="Catatan transaksi (opsional)"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              maxLength={200}
              className="bg-neutral-50"
            />

            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="w-full py-3 bg-primary text-white rounded-2xl flex items-center justify-between px-4 shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', duration: 0.2, bounce: 0 }}
            >
              <div className="flex flex-col items-start min-w-0 pr-2">
                <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider truncate w-full">
                  {totalItems} Item Terpilih
                </span>
                <span className="text-[15px] sm:text-base font-bold tabular-nums leading-none mt-0.5 truncate w-full">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-xl flex-shrink-0">
                <span className="font-bold text-[13px]">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </span>
                <CheckCircle size={16} strokeWidth={2.5} />
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="py-2 text-center text-neutral-400 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            Pilih produk untuk mulai transaksi
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
