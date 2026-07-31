import { CheckCircle, Minus, Package, Plus, Search, Tag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProducts } from '@/hooks/useProducts'
import { useCreateSale, useUpdateSale } from '@/hooks/useTransactions'
import { formatRupiah } from '@/lib/utils'
import type { Product, TransactionWithItems } from '@/types'

interface CartItem {
  product: Product
  quantity: number
}

const PRODUCT_COLORS = [
  'from-amber-400/20 to-orange-500/20',
  'from-emerald-400/20 to-teal-500/20',
  'from-blue-400/20 to-indigo-500/20',
  'from-rose-400/20 to-pink-500/20',
  'from-purple-400/20 to-fuchsia-500/20',
]

interface SaleFormProps {
  /** When provided, the form operates in "edit" mode. */
  transaction?: TransactionWithItems
  onSuccess: () => void
}

/**
 * Unified sale form for both creating and editing.
 * Pass `transaction` to enter edit mode; omit for create mode.
 */
export function SaleForm({ transaction, onSuccess }: SaleFormProps) {
  const isEditing = !!transaction

  const { data: products = [], isLoading: productsLoading } = useProducts(true)
  const { mutate: createSale, isPending: isCreating } = useCreateSale()
  const { mutate: updateSale, isPending: isUpdating } = useUpdateSale()
  const isPending = isCreating || isUpdating

  const [cart, setCart] = useState<Map<string, CartItem>>(new Map())
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState(transaction?.notes ?? '')

  // Pre-populate cart when editing an existing transaction
  useEffect(() => {
    if (!isEditing || productsLoading || products.length === 0 || !transaction.transaction_items) {
      return
    }

    const initialCart = new Map<string, CartItem>()
    transaction.transaction_items.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id)
      // If a product was deleted but still appears in the transaction, create a fallback
      const productData = product ?? ({
        id: item.product_id,
        name: item.product_name,
        hpp: item.product_hpp,
        selling_price: item.selling_price,
        image_url: null,
        sku: null,
        stock: 0,
      } as unknown as Product)

      initialCart.set(item.product_id ?? crypto.randomUUID(), { product: productData, quantity: item.quantity })
    })
    setCart(initialCart)
  }, [isEditing, transaction, products, productsLoading])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((p) => p.name.toLowerCase().includes(query))
  }, [products, search])

  // When editing, also show deleted products that are still in the cart
  const displayProducts = useMemo(() => {
    if (!isEditing) return filtered
    const all = [...filtered]
    cart.forEach((c) => {
      if (!all.find((p) => p.id === c.product.id) && !search) {
        all.push(c.product)
      }
    })
    return all
  }, [isEditing, filtered, cart, search])

  const { totalAmount, totalItems, cartArray } = useMemo(() => {
    let amount = 0
    let items = 0
    const arr: CartItem[] = []
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
    if (cart.size === 0) return

    const items = cartArray.map((c) => ({
      product_id: c.product.id,
      product_name: c.product.name,
      product_hpp: c.product.hpp,
      selling_price: c.product.selling_price,
      quantity: c.quantity,
    }))

    if (isEditing) {
      updateSale(
        {
          id: transaction.id,
          payload: { items, notes: notes.trim() || null, transaction_at: transaction.transaction_at },
        },
        { onSuccess },
      )
    } else {
      createSale(
        { payload: { items, notes: notes.trim() || null } },
        { onSuccess },
      )
    }
  }, [cart, cartArray, notes, isEditing, transaction, createSale, updateSale, onSuccess])

  return (
    <div className="flex flex-col min-h-[60vh] max-h-full">
      <div className="sticky top-0 z-10 px-4 py-3 bg-white border-b border-neutral-100">
        <Input
          type="search"
          placeholder="Cari varian produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftDecorator={<Search size={18} className="text-neutral-400" />}
          className="pl-10 bg-neutral-100/70 border-transparent rounded-2xl focus:bg-white focus:border-primary"
        />
      </div>

      <div className="p-4 bg-neutral-50/50 flex-1">
        {productsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div
                key={k}
                className="flex items-center bg-white rounded-2xl border border-neutral-200 overflow-hidden p-3 gap-3"
              >
                <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
                <div className="flex flex-col flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length ? (
          <div className="flex flex-col gap-3">
            {displayProducts.map((product) => {
              const inCart = cart.get(product.id)
              const qty = inCart?.quantity || 0
              const colorIdx = product.name.length % PRODUCT_COLORS.length
              const gradient = PRODUCT_COLORS[colorIdx]

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (qty === 0) addToCart(product)
                  }}
                  className={`relative flex items-center bg-white rounded-2xl border transition-all p-2.5 sm:p-3 gap-3 sm:gap-4 cursor-pointer ${
                    qty > 0
                      ? 'border-primary ring-1 ring-primary shadow-sm shadow-primary/10 bg-primary/5'
                      : 'border-neutral-200 shadow-sm hover:border-primary/50 hover:shadow-md'
                  }`}
                >
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
                    {qty > 0 && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-all">
                        <CheckCircle
                          className="text-white drop-shadow-md opacity-90 scale-110"
                          size={24}
                        />
                      </div>
                    )}
                  </div>

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

                    <p className="text-sm font-bold text-primary mt-auto">
                      {formatRupiah(product.selling_price)}
                    </p>
                  </div>

                  <div className="flex-shrink-0 self-center">
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(product)
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
                            changeQty(product.id, -1)
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white active:scale-[0.96] transition-transform bg-black/10 rounded-lg hover:bg-black/20 cursor-pointer"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-white font-bold tabular-nums text-xs sm:text-sm px-2 sm:px-3 min-w-[1.5rem] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            changeQty(product.id, 1)
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
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Produk tidak ditemukan"
            description="Coba gunakan kata kunci pencarian yang berbeda"
          />
        )}
      </div>

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
              <Input
                type="text"
                placeholder="Catatan transaksi (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                className="bg-neutral-50"
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
