import { Package, PieChart } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatRupiah } from '@/lib/utils'
import type { Product } from '@/types'

interface RetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (product: Product, customPrice: number) => void
}

/** Modal for entering a custom (retail/partial) selling price with live proportion preview. */
export function RetailModal({ product, isOpen, onClose, onConfirm }: RetailModalProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && product) {
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [isOpen, product])

  const handleClose = useCallback(() => {
    setInput('')
    onClose()
  }, [onClose])

  if (!product) return null

  const customPrice = Number(input)
  const isValid = customPrice > 0 && customPrice <= product.selling_price
  const ratio = product.selling_price > 0 ? customPrice / product.selling_price : 0
  const scaledHpp = Math.round(product.hpp * ratio)
  const estimatedProfit = customPrice - scaledHpp
  const displayRatio = Math.min(Math.max(ratio, 0), 1)

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(product, customPrice)
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) handleConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Jual Sebagian" variant="center">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <Package size={20} strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] text-neutral-500 font-semibold tracking-wide uppercase">
              Harga 1 Paket
            </span>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {formatRupiah(product.selling_price)}
            </span>
          </div>
          <div className="text-right flex flex-col min-w-0">
             <span className="text-[11px] text-neutral-500 font-semibold tracking-wide uppercase truncate">
               Produk
             </span>
             <span className="text-xs font-semibold text-neutral-700 truncate max-w-[100px]">
               {product.name}
             </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label
            htmlFor="retail-price-input"
            className="text-xs font-bold text-neutral-700 uppercase tracking-wide"
          >
            Nominal Jual (Rp)
          </label>
          <div
            className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
              input.length > 0
                ? isValid
                  ? 'border-indigo-400 bg-indigo-50/50'
                  : 'border-danger/50 bg-danger/5'
                : 'border-neutral-200 bg-neutral-50/50 focus-within:border-primary focus-within:bg-white'
            }`}
          >
            <span className="text-lg font-bold text-neutral-400 select-none">Rp</span>
            <input
              ref={inputRef}
              id="retail-price-input"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              min={1}
              max={product.selling_price}
              className="flex-1 bg-transparent text-2xl font-black text-neutral-900 focus:outline-none tabular-nums placeholder:text-neutral-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
          </div>
          {input.length > 0 && !isValid && (
            <p className="text-xs text-danger font-semibold">
              {customPrice <= 0
                ? 'Nominal harus lebih dari Rp 0'
                : `Maksimal harga 1 paket (${formatRupiah(product.selling_price)})`}
            </p>
          )}
        </div>

        <AnimatePresence>
          {customPrice > 0 && isValid && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl p-4 flex flex-col gap-3.5 border border-indigo-100/50">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-neutral-600">
                    <span>Proporsi Porsi</span>
                    <span className="font-bold text-indigo-700 tabular-nums">
                      {(displayRatio * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-indigo-200/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${displayRatio * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col p-2 bg-white/60 rounded-xl">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-0.5">
                      HPP Proporsional
                    </span>
                    <span className="text-sm font-bold text-neutral-800 tabular-nums">
                      {formatRupiah(scaledHpp)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end p-2 bg-white/60 rounded-xl">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-0.5">
                      Est. Profit
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        estimatedProfit >= 0 ? 'text-emerald-600' : 'text-danger'
                      }`}
                    >
                      {estimatedProfit >= 0 ? '+' : ''}
                      {formatRupiah(estimatedProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-3 pt-2 mt-2 border-t border-neutral-100">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            className="flex-[2] bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20 hover:shadow-indigo-500/30 text-white border-transparent"
            disabled={!isValid} 
            onClick={handleConfirm}
            leftIcon={<PieChart size={18} strokeWidth={2} />}
          >
            {isValid ? `Tambah ${formatRupiah(customPrice)}` : 'Masukkan Nominal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
