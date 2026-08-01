import { Search, WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useDeferredValue, useState } from 'react'
import { CheckoutPanel } from '@/components/kasir/CheckoutPanel'
import { PaymentMethodModal } from '@/components/kasir/PaymentMethodModal'
import { ProductCard } from '@/components/kasir/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSaleFormState } from '@/hooks/useTransactionForm'
import { useCreateSale, useUpdateSale } from '@/hooks/useTransactions'
import type { PaymentMethod, TransactionStatus, TransactionWithItems } from '@/types'

interface SaleFormProps {
  /** When provided, the form operates in "edit" mode. */
  transaction?: TransactionWithItems
  onSuccess: () => void
}

/**
 * Unified sale form for both creating and editing.
 * Pass `transaction` to enter edit mode; omit for create mode.
 * Delegates rendering to ProductCard and CheckoutPanel sub-components.
 */
export function SaleForm({ transaction, onSuccess }: SaleFormProps) {
  const {
    isEditing,
    products,
    productsLoading,
    cart,
    addToCart,
    changeQty,
    setQty,
    totalAmount,
    totalItems,
    cartArray,
    isOfflinePaused,
  } = useSaleFormState(transaction)

  // Avoid skeleton trap if offline without data
  const isLoading = productsLoading && !isOfflinePaused

  const { mutate: createSale, isPending: isCreating } = useCreateSale()
  const { mutate: updateSale, isPending: isUpdating } = useUpdateSale()
  const isPending = isCreating || isUpdating

  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const deferredSearch = useDeferredValue(search)

  // Simple derivations — no useMemo needed for cheap operations (Vercel guideline)
  const query = deferredSearch.trim().toLowerCase()
  const filtered = query ? products.filter((p) => p.name.toLowerCase().includes(query)) : products

  // In edit mode, also show cart products that don't match the current filter
  let displayProducts = filtered
  if (isEditing) {
    const all = [...filtered]
    cart.forEach((cartItem) => {
      if (!all.find((p) => p.id === cartItem.product.id) && !deferredSearch) {
        all.push(cartItem.product)
      }
    })
    displayProducts = all
  }

  const handlePreSubmit = useCallback(() => {
    if (cart.size === 0) return
    setIsModalOpen(true)
  }, [cart])

  const handleSubmit = useCallback(
    (paymentMethod: PaymentMethod, status: TransactionStatus) => {
      if (cart.size === 0) return

      // Optimistically close modal
      setIsModalOpen(false)

      const items = cartArray.map((cartItem) => ({
        product_id:
          cartItem.original_product_id !== undefined
            ? cartItem.original_product_id
            : cartItem.product.id,
        product_name: cartItem.product.name,
        product_hpp: cartItem.product.hpp,
        selling_price: cartItem.product.selling_price,
        quantity: cartItem.quantity,
      }))

      if (isEditing && transaction) {
        updateSale(
          {
            id: transaction.id,
            payload: {
              items,
              notes: notes.trim() || null,
              transaction_at: transaction.transaction_at,
              payment_method: paymentMethod,
              status,
            },
          },
          { onSuccess },
        )
      } else {
        createSale(
          {
            payload: {
              items,
              notes: notes.trim() || null,
              payment_method: paymentMethod,
              status,
            },
          },
          { onSuccess },
        )
      }
    },
    [cart, cartArray, notes, isEditing, transaction, createSale, updateSale, onSuccess],
  )

  return (
    <div className="flex flex-col min-h-[60vh] max-h-full">
      {/* Search bar */}
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

      {/* Product list */}
      <div className="p-4 bg-neutral-50/50 flex-1">
        {isLoading ? (
          <ProductListSkeleton />
        ) : isOfflinePaused && !displayProducts?.length ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <EmptyState
              icon={WifiOff}
              title="Katalog Tidak Tersedia"
              description="Anda sedang offline dan data produk belum tersimpan."
              action={{ label: 'Coba Lagi', onClick: () => window.location.reload() }}
            />
          </motion.div>
        ) : displayProducts?.length ? (
          <motion.div layout className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {displayProducts.map((product, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.2) }}
                  key={product.id}
                >
                  <ProductCard
                    product={product}
                    quantity={cart.get(product.id)?.quantity ?? 0}
                    onAdd={() => addToCart(product)}
                    onChangeQty={(delta) => changeQty(product.id, delta)}
                    onSetQty={(qty) => setQty(product.id, qty)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <EmptyState
              icon={Search}
              title="Produk tidak ditemukan"
              description="Coba gunakan kata kunci pencarian yang berbeda"
            />
          </motion.div>
        )}
      </div>

      {/* Checkout panel */}
      <CheckoutPanel
        cartSize={cart.size}
        totalItems={totalItems}
        totalAmount={totalAmount}
        notes={notes}
        isPending={isPending}
        onNotesChange={setNotes}
        onSubmit={handlePreSubmit}
      />

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSubmit}
        totalAmount={totalAmount}
        isPending={isPending}
        activeMethod={transaction?.payment_method as 'tunai' | 'qris' | undefined}
      />
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Skeleton loader shown while the product list is fetching. */
function ProductListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <div
          key={key}
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
  )
}
