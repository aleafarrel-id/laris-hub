import { Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CheckoutPanel } from '@/components/kasir/CheckoutPanel'
import { ProductCard } from '@/components/kasir/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProducts } from '@/hooks/useProducts'
import { useCreateSale, useUpdateSale } from '@/hooks/useTransactions'
import { type CartItem, useSaleCart } from '@/hooks/useTransactionForm'
import type { Product, TransactionWithItems } from '@/types'

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
  const isEditing = !!transaction

  const { data: products = [], isLoading: productsLoading } = useProducts(true)
  const { mutate: createSale, isPending: isCreating } = useCreateSale()
  const { mutate: updateSale, isPending: isUpdating } = useUpdateSale()
  const isPending = isCreating || isUpdating

  const { cart, setCart, addToCart, changeQty, totalAmount, totalItems, cartArray } = useSaleCart()
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
      const productData =
        product ??
        ({
          id: item.product_id,
          name: item.product_name,
          hpp: item.product_hpp,
          selling_price: item.selling_price,
          image_url: null,
          sku: null,
          stock: 0,
        } as unknown as Product)

      initialCart.set(item.product_id ?? crypto.randomUUID(), {
        product: productData,
        quantity: item.quantity,
      })
    })
    setCart(initialCart)
  }, [isEditing, transaction, products, productsLoading, setCart])

  // Simple derivations — no useMemo needed for cheap operations (Vercel guideline)
  const query = search.trim().toLowerCase()
  const filtered = query ? products.filter((p) => p.name.toLowerCase().includes(query)) : products

  // In edit mode, also show cart products that don't match the current filter
  let displayProducts = filtered
  if (isEditing) {
    const all = [...filtered]
    cart.forEach((cartItem) => {
      if (!all.find((p) => p.id === cartItem.product.id) && !search) {
        all.push(cartItem.product)
      }
    })
    displayProducts = all
  }

  const handleSubmit = useCallback(() => {
    if (cart.size === 0) return

    const items = cartArray.map((cartItem) => ({
      product_id: cartItem.product.id,
      product_name: cartItem.product.name,
      product_hpp: cartItem.product.hpp,
      selling_price: cartItem.product.selling_price,
      quantity: cartItem.quantity,
    }))

    if (isEditing) {
      updateSale(
        {
          id: transaction.id,
          payload: {
            items,
            notes: notes.trim() || null,
            transaction_at: transaction.transaction_at,
          },
        },
        { onSuccess },
      )
    } else {
      createSale({ payload: { items, notes: notes.trim() || null } }, { onSuccess })
    }
  }, [cart, cartArray, notes, isEditing, transaction, createSale, updateSale, onSuccess])

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
        {productsLoading ? (
          <ProductListSkeleton />
        ) : displayProducts.length ? (
          <div className="flex flex-col gap-3">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart.get(product.id)?.quantity ?? 0}
                onAdd={() => addToCart(product)}
                onChangeQty={(delta) => changeQty(product.id, delta)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Produk tidak ditemukan"
            description="Coba gunakan kata kunci pencarian yang berbeda"
          />
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
        onSubmit={handleSubmit}
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
