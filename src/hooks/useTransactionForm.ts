import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import type { Product, TransactionWithItems } from '@/types'

// ─── Sale Cart Logic ─────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
  original_product_id?: string | null
}

export function useSaleCart(initialCart?: Map<string, CartItem>) {
  const [cart, setCart] = useState<Map<string, CartItem>>(initialCart ?? new Map())

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

  const setQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      const existing = prev.get(productId)
      if (!existing) return prev
      const next = new Map(prev)
      if (qty <= 0) {
        next.delete(productId)
      } else {
        next.set(productId, { ...existing, quantity: qty })
      }
      return next
    })
  }, [])

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

  return { cart, setCart, addToCart, changeQty, setQty, totalAmount, totalItems, cartArray }
}

/**
 * Deep module that coordinates data fetching and cart initialization.
 * Abstracts the complexity away from SaleForm.tsx.
 */
export function useSaleFormState(transaction?: TransactionWithItems) {
  const isEditing = !!transaction
  const { data: products = [], isLoading: productsLoading, isOfflinePaused } = useProducts(true)
  const cartState = useSaleCart()
  const { setCart } = cartState

  // Pre-populate cart when editing an existing transaction
  useEffect(() => {
    if (!isEditing || productsLoading || products.length === 0 || !transaction.transaction_items) {
      return
    }

    const initialCart = new Map<string, CartItem>()
    transaction.transaction_items.forEach((item) => {
      let product = products.find((p) => p.id === item.product_id)
      
      // Backward compatibility for old cache that only had product_name
      if (!product && !item.product_id && item.product_name) {
        product = products.find((p) => p.name === item.product_name)
      }

      const fallbackId = item.product_id ?? product?.id ?? crypto.randomUUID()
      const productData =
        product ??
        ({
          id: fallbackId,
          name: item.product_name,
          hpp: item.product_hpp ?? 0,
          selling_price: item.selling_price ?? 0,
          image_url: null,
          sku: null,
          stock: 0,
        } as unknown as Product)

      initialCart.set(fallbackId, {
        product: productData,
        quantity: item.quantity,
        original_product_id: item.product_id,
      })
    })
    setCart(initialCart)
  }, [isEditing, transaction, products, productsLoading, setCart])

  return {
    isEditing,
    products,
    productsLoading,
    isOfflinePaused,
    ...cartState,
  }
}

// ─── Expense Items Logic ──────────────────────────────────────────────────────

export interface ExpenseLineItem {
  id: string
  name: string
  qty: number
  unit_price: number
}

export function useExpenseItems(initialItems: ExpenseLineItem[] = []) {
  const [items, setItems] = useState<ExpenseLineItem[]>(initialItems)

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: '', qty: 1, unit_price: 0 }])
  }, [])

  const updateItem = useCallback(
    (id: string, field: keyof ExpenseLineItem, value: string | number) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    },
    [],
  )

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const lineItemsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number.isFinite(item.qty) ? item.qty : 0
      const price = Number.isFinite(item.unit_price) ? item.unit_price : 0
      return sum + price * qty
    }, 0)
  }, [items])

  return { items, setItems, addItem, updateItem, removeItem, lineItemsTotal }
}
