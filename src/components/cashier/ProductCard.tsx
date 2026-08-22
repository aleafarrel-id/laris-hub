import { CheckCircle, Minus, Package, PieChart, Plus, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import type { Product } from '@/types'

const PRODUCT_COLORS = [
  'from-amber-400/20 to-orange-500/20',
  'from-emerald-400/20 to-teal-500/20',
  'from-blue-400/20 to-indigo-500/20',
  'from-rose-400/20 to-pink-500/20',
  'from-purple-400/20 to-fuchsia-500/20',
]

interface ProductCardProps {
  product: Product
  quantity: number
  onAdd: () => void
  onChangeQty: (delta: number) => void
  onSetQty?: (qty: number) => void
  onAddRetail?: () => void
}

export function ProductCard({
  product,
  quantity,
  onAdd,
  onChangeQty,
  onSetQty,
  onAddRetail,
}: ProductCardProps) {
  const colorIdx = (product.name?.length ?? 0) % PRODUCT_COLORS.length
  const gradient = PRODUCT_COLORS[colorIdx]
  const isInCart = quantity > 0

  const [localQty, setLocalQty] = useState<string>(quantity > 0 ? quantity.toString() : '')
  const [imgError, setImgError] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    setLocalQty(quantity > 0 ? quantity.toString() : '')
  }, [quantity])

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onClick={() => {
        if (!isInCart) {
          onAdd()
        } else if (onSetQty) {
          onSetQty(0)
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!isInCart) onAdd()
          else if (onSetQty) onSetQty(0)
        }
      }}
      className={`relative flex items-center bg-white rounded-3xl border-2 transition-all p-2.5 sm:p-3 gap-3 sm:gap-4 cursor-pointer text-left w-full ${isPressed ? 'scale-[0.98]' : ''} ${
        isInCart
          ? 'border-primary shadow-md shadow-primary/10 bg-primary/5'
          : 'border-transparent shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] hover:border-primary/30'
      }`}
    >
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden group`}
      >
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-active:scale-[0.96] group-hover:scale-105"
          />
        ) : (
          <div className="text-neutral-500/50 drop-shadow-sm transition-transform group-active:scale-[0.96] group-hover:scale-110">
            <Package size={32} strokeWidth={1.5} />
          </div>
        )}
        {isInCart && (
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-all">
            <CheckCircle className="text-white drop-shadow-md opacity-100 scale-110" size={28} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 py-1 self-stretch justify-center">
        <p className="text-sm sm:text-base font-bold text-neutral-900 leading-tight mb-1 line-clamp-2">
          {product.name}
        </p>
        {product.sku && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
            <Tag size={12} strokeWidth={2} />
            <span className="truncate">{product.sku}</span>
          </div>
        )}
        <p className="text-sm sm:text-base font-black text-primary mt-auto tabular-nums">
          {formatRupiah(product.selling_price)}
        </p>
      </div>

      <div className="flex flex-col flex-shrink-0 self-center gap-2">
        {!isInCart ? (
          <>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className="w-10 h-10 sm:w-auto sm:px-5 sm:h-11 bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl active:scale-[0.94] transition-colors shadow-sm"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="hidden sm:inline">Tambah</span>
            </button>
            {onAddRetail && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onAddRetail()
                }}
                className="w-10 h-8 sm:w-auto sm:px-4 sm:h-9 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold rounded-lg active:scale-[0.94] transition-colors"
                title="Jual Sebagian"
              >
                <PieChart size={14} strokeWidth={2.5} />
                <span className="hidden sm:inline">Sebagian</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center justify-between bg-primary rounded-2xl p-1.5 shadow-md shadow-primary/20 min-w-[100px]">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onChangeQty(-1)
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white active:scale-[0.92] transition-transform bg-black/10 rounded-xl hover:bg-black/20 cursor-pointer"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <input
                type="number"
                placeholder="Qty"
                value={localQty}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation()
                  const val = e.target.value
                  setLocalQty(val)
                  if (val !== '' && onSetQty) {
                    const parsed = Number.parseInt(val, 10)
                    if (!Number.isNaN(parsed) && parsed > 0) {
                      onSetQty(parsed)
                    }
                  }
                }}
                onBlur={() => {
                  if (localQty === '' || Number.parseInt(localQty, 10) <= 0) {
                    if (onSetQty) onSetQty(0)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                min={1}
                className="w-10 sm:w-12 bg-transparent text-white font-black text-center text-sm sm:text-base focus:outline-none tabular-nums placeholder:text-white/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onChangeQty(1)
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white active:scale-[0.92] transition-transform bg-black/10 rounded-xl hover:bg-black/20 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
            {onAddRetail && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onAddRetail()
                }}
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-[11px] font-bold active:scale-[0.94] transition-all"
                title="Jual Sebagian"
              >
                <PieChart size={12} strokeWidth={2.5} />
                <span>+ Sebagian</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
