import { CheckCircle, Minus, Package, Plus, Tag } from 'lucide-react'
import type { Product } from '@/types'
import { formatRupiah } from '@/lib/utils'

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
}

/**
 * A single tappable product card for the sale form.
 * Shows image/placeholder, name, SKU, price, and an add/quantity stepper control.
 */
export function ProductCard({ product, quantity, onAdd, onChangeQty }: ProductCardProps) {
  const colorIdx = product.name.length % PRODUCT_COLORS.length
  const gradient = PRODUCT_COLORS[colorIdx]
  const isInCart = quantity > 0

  return (
    <div
      onClick={() => {
        if (!isInCart) onAdd()
      }}
      className={`relative flex items-center bg-white rounded-2xl border transition-all p-2.5 sm:p-3 gap-3 sm:gap-4 cursor-pointer ${
        isInCart
          ? 'border-primary ring-1 ring-primary shadow-sm shadow-primary/10 bg-primary/5'
          : 'border-neutral-200 shadow-sm hover:border-primary/50 hover:shadow-md'
      }`}
    >
      {/* Product image / placeholder */}
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden group`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-active:scale-[0.96] group-hover:scale-105"
          />
        ) : (
          <div className="text-white/80 drop-shadow-sm transition-transform group-active:scale-[0.96] group-hover:scale-110">
            <Package size={32} strokeWidth={1.5} />
          </div>
        )}
        {isInCart && (
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-all">
            <CheckCircle className="text-white drop-shadow-md opacity-90 scale-110" size={24} />
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col flex-1 min-w-0 py-0.5 self-stretch justify-center">
        <p className="text-sm sm:text-base font-bold text-neutral-900 leading-tight mb-1 line-clamp-1">
          {product.name}
        </p>
        {product.sku && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1.5">
            <Tag size={12} className="text-neutral-400" />
            <span className="truncate">{product.sku}</span>
          </div>
        )}
        <p className="text-sm font-bold text-primary mt-auto">{formatRupiah(product.selling_price)}</p>
      </div>

      {/* Add / stepper control */}
      <div className="flex-shrink-0 self-center">
        {!isInCart ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="w-8 h-8 sm:w-auto sm:px-4 sm:h-9 bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center gap-2 text-xs font-bold rounded-xl active:scale-[0.96] transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-primary rounded-xl p-1 shadow-sm shadow-primary/20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChangeQty(-1)
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white active:scale-[0.96] transition-transform bg-black/10 rounded-lg hover:bg-black/20 cursor-pointer"
            >
              <Minus size={14} strokeWidth={3} />
            </button>
            <span className="text-white font-bold tabular-nums text-xs sm:text-sm px-2 sm:px-3 min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChangeQty(1)
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white active:scale-[0.96] transition-transform bg-black/10 rounded-lg hover:bg-black/20 cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
