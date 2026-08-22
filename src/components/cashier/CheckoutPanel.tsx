import { CheckCircle, PieChart, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Input } from '@/components/ui/Input'
import type { CartItem } from '@/hooks/useTransactionForm'
import { formatRupiah } from '@/lib/utils'

interface CheckoutPanelProps {
  cartSize: number
  totalItems: number
  totalAmount: number
  notes: string
  isPending: boolean
  onNotesChange: (value: string) => void
  onSubmit: () => void
  onRemoveItem?: (cartKey: string) => void
  cartArray?: CartItem[]
  cart?: Map<string, CartItem>
}

/** Sticky bottom panel — shows notes + checkout button or empty-state hint. */
export function CheckoutPanel({
  cartSize,
  totalItems,
  totalAmount,
  notes,
  isPending,
  onNotesChange,
  onSubmit,
  onRemoveItem,
  cartArray,
  cart,
}: CheckoutPanelProps) {
  const retailItems = cartArray?.filter((item) => item.retail) ?? []

  return (
    <div className="sticky bottom-0 z-10 bg-white border-t border-neutral-200 p-4 sm:p-5 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.12)] mt-auto rounded-t-3xl">
      <AnimatePresence mode="wait">
        {cartSize > 0 ? (
          <motion.div
            key="checkout"
            className="flex flex-col gap-3.5 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Retail items summary strip */}
            <AnimatePresence>
              {retailItems.length > 0 && (
                <motion.div
                  key="retail-strip"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-1.5 bg-indigo-50/80 border border-indigo-200/50 rounded-2xl px-4 py-2.5 mb-1">
                    {retailItems.map((item, idx) => {
                      const cartKey = Array.from(cart?.entries() ?? []).find(
                        ([, v]) => v === item,
                      )?.[0]
                      return (
                        <div key={cartKey ?? idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <PieChart
                              size={12}
                              className="text-indigo-600 flex-shrink-0"
                              strokeWidth={2.5}
                            />
                            <span className="text-[13px] text-indigo-900 font-bold truncate">
                              {item.product?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[13px] font-black text-indigo-700 tabular-nums">
                              {formatRupiah(item.retail?.custom_selling_price ?? 0)}
                            </span>
                            {cartKey && onRemoveItem && (
                              <button
                                type="button"
                                onClick={() => onRemoveItem(cartKey)}
                                className="p-1 text-indigo-400 hover:text-danger hover:bg-danger/10 rounded-lg active:scale-95 transition-all"
                                title="Hapus eceran"
                              >
                                <X size={14} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              type="text"
              placeholder="Catatan transaksi (opsional)"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              maxLength={200}
              className="bg-neutral-50/80 rounded-2xl border-neutral-200/80"
            />

            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="w-full py-3.5 bg-primary text-white rounded-2xl flex items-center justify-between px-5 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-primary/95 transition-all"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', duration: 0.2, bounce: 0 }}
            >
              <div className="flex flex-col items-start min-w-0 pr-3">
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest truncate w-full">
                  {totalItems} Item Terpilih
                </span>
                <span className="text-lg sm:text-xl font-black tabular-nums leading-none mt-1 truncate w-full">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl flex-shrink-0">
                <span className="font-bold text-sm">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </span>
                <CheckCircle size={18} strokeWidth={2.5} />
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="py-4 text-center text-neutral-400 text-sm font-semibold tracking-wide flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="w-12 h-1 bg-neutral-200 rounded-full mb-2"></div>
            Pilih produk untuk mulai transaksi
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
