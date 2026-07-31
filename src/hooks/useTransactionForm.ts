import { useCallback, useMemo, useState } from 'react'
import type { Product } from '@/types'

// ─── Sale Cart Logic ─────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
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

  return { cart, setCart, addToCart, changeQty, totalAmount, totalItems, cartArray }
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
