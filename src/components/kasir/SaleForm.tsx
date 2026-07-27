import { useAutoAnimate } from '@formkit/auto-animate/react'
import { CheckCircle, Minus, Package, Plus, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProducts } from '@/hooks/useProducts'
import { useCreateSale } from '@/hooks/useTransactions'
import { formatRupiah } from '@/lib/utils'
import type { Product } from '@/types'

interface CartItem {
  product: Product
  quantity: number
}

// Hoist static data outside component
const PRODUCT_COLORS = [
  'from-amber-400/20 to-orange-500/20',
  'from-emerald-400/20 to-teal-500/20',
  'from-blue-400/20 to-indigo-500/20',
  'from-rose-400/20 to-pink-500/20',
  'from-purple-400/20 to-fuchsia-500/20',
]

export function SaleForm({ onSuccess, recordedBy }: { onSuccess: () => void; recordedBy: string }) {
  const { data: products = [], isLoading: productsLoading } = useProducts(true)
  const { mutate: createSale, isPending } = useCreateSale()

  const [cart, setCart] = useState<Map<string, CartItem>>(new Map())
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')

  const [gridRef] = useAutoAnimate()

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((p) => p.name.toLowerCase().includes(query))
  }, [products, search])

  const { totalAmount, totalItems, cartArray } = useMemo(() => {
    let amount = 0
    let items = 0
    const arr: CartItem[] = []

    // Iterate over Map values once
    for (const item of cart.values()) {
      amount += item.product.selling_price * item.quantity
      items += item.quantity
      arr.push(item)
    }
    return { totalAmount: amount, totalItems: items, cartArray: arr }
  }, [cart])

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(product.id)

      if (existing) {
        next.set(product.id, { ...existing, quantity: existing.quantity + 1 })
      } else {
        next.set(product.id, { product, quantity: 1 })
      }
      return next
    })
  }, [])

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.get(productId)
      if (!existing) return prev

      const next = new Map(prev)
      const newQty = existing.quantity + delta

      if (newQty <= 0) {
        next.delete(productId)
      } else {
        next.set(productId, { ...existing, quantity: newQty })
      }
      return next
    })
  }, [])

  const handleSubmit = useCallback(() => {
    if (cart.size === 0 || !recordedBy) return

    createSale(
      {
        payload: {
          items: cartArray.map((c) => ({
            product_id: c.product.id,
            product_name: c.product.name,
            product_hpp: c.product.hpp,
            selling_price: c.product.selling_price,
            quantity: c.quantity,
          })),
          notes: notes.trim() || null,
        },
        recordedBy,
      },
      { onSuccess: () => onSuccess() },
    )
  }, [cart, cartArray, notes, recordedBy, createSale, onSuccess])

  return (
    <div className="flex flex-col min-h-[60vh] max-h-full">
      {/* Search - Sticky Top */}
      <div className="sticky top-0 z-10 px-4 py-3 bg-white border-b border-neutral-100">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            placeholder="Cari varian produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-neutral-100/70 border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 bg-neutral-50/50 flex-1">
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div
                key={k}
                className="flex flex-col bg-white rounded-2xl border border-neutral-200 overflow-hidden"
              >
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="p-3 flex flex-col flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <Skeleton className="h-8 w-full rounded-xl mt-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length ? (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((product) => {
              const inCart = cart.get(product.id)
              const qty = inCart?.quantity || 0

              const colorIdx = product.name.length % PRODUCT_COLORS.length
              const gradient = PRODUCT_COLORS[colorIdx]

              return (
                <div
                  key={product.id}
                  className={`relative flex flex-col bg-white rounded-2xl border transition-all overflow-hidden ${
                    qty > 0
                      ? 'border-primary ring-1 ring-primary shadow-[0_4px_12px_-4px_rgba(40,94,175,0.2)] scale-[0.98]'
                      : 'border-neutral-200 shadow-sm hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {/* Image / Thumbnail */}
                  <div
                    className={`w-full h-28 sm:h-32 flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden group cursor-pointer`}
                    onClick={() => {
                      if (qty === 0) addToCart(product)
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-active:scale-95 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-white/80 drop-shadow-sm transition-transform group-active:scale-95 group-hover:scale-110">
                        <Package size={48} strokeWidth={1.5} />
                      </div>
                    )}
                    {qty > 0 && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-all">
                        <CheckCircle
                          className="text-white drop-shadow-md opacity-90 scale-110"
                          size={32}
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Info & Controls */}
                  <div className="flex flex-col flex-1 p-3 pt-2">
                    <p className="text-sm sm:text-base font-bold text-neutral-900 leading-tight mb-0.5 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-primary mb-3">
                      {formatRupiah(product.selling_price)}
                    </p>

                    <div className="mt-auto pt-1">
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-xl active:scale-95 transition-colors"
                        >
                          + Tambah
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-primary rounded-xl p-1 shadow-sm shadow-primary/20">
                          <button
                            type="button"
                            onClick={() => changeQty(product.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-white active:scale-90 transition-transform bg-black/10 rounded-lg hover:bg-black/20"
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <span className="text-white font-bold tabular-nums text-sm">{qty}</span>
                          <button
                            type="button"
                            onClick={() => changeQty(product.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-white active:scale-90 transition-transform bg-black/10 rounded-lg hover:bg-black/20"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <Search size={32} className="mb-3 opacity-20" />
            <p className="text-sm">Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Footer / Checkout Strip - Sticky Bottom */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-neutral-200 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] mt-auto">
        <AnimatePresence mode="wait">
          {cart.size > 0 ? (
            <motion.div
              key="checkout"
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
            >
              {/* Note input */}
              <input
                type="text"
                placeholder="Catatan transaksi (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />

              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full py-3.5 bg-primary text-white rounded-2xl flex items-center justify-between px-5 shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', duration: 0.2, bounce: 0 }}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                    {totalItems} Item Terpilih
                  </span>
                  <span className="text-lg font-bold tabular-nums leading-none mt-0.5">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl">
                  <span className="font-bold text-sm">{isPending ? 'Menyimpan...' : 'Simpan'}</span>
                  <CheckCircle size={18} strokeWidth={2.5} />
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
    </div>
  )
}
