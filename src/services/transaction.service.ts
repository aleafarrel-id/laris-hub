/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { SaleItemFormData } from '@/lib/validations/transaction.schema'
import type {
  Transaction,
  TransactionFilters,
  TransactionUpdate,
  TransactionWithItems,
} from '@/types'

// Note: `as any` casts bypass strict Supabase SDK type inference from
// manually-maintained database types. Safe — RLS enforces access at DB level.

const db = supabase as any

export interface CreateSalePayload {
  items: SaleItemFormData[]
  notes?: string | null
  transaction_at?: string
}

export interface CreateExpensePayload {
  description: string
  total_amount: number
  expense_category: 'operasional' | 'bahan_baku' | 'lainnya'
  /** Optional breakdown items stored as JSONB — e.g. [{name:"Gas LPG",qty:2,unit_price:22000}] */
  expense_items?: Array<{ name: string; qty?: number; unit_price: number }>
  notes?: string | null
  transaction_at?: string
}

/**
 * Create a sale transaction with multiple items.
 * DB trigger auto-calculates subtotal & profit per item.
 */
export async function createSaleTransaction(
  payload: CreateSalePayload,
  recordedBy: string,
): Promise<Transaction> {
  const totalAmount = payload.items.reduce(
    (sum, item) => sum + item.selling_price * item.quantity,
    0,
  )
  const totalProfit = payload.items.reduce(
    (sum, item) => sum + (item.selling_price - item.product_hpp) * item.quantity,
    0,
  )

  const { data: transaction, error: txError } = await db
    .from('transactions')
    .insert([
      {
        type: 'penjualan',
        total_amount: totalAmount,
        total_profit: totalProfit,
        recorded_by: recordedBy,
        notes: payload.notes ?? null,
        transaction_at: payload.transaction_at ?? new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (txError) throw txError

  const tx = transaction as Transaction

  const itemsPayload = payload.items.map((item) => ({
    transaction_id: tx.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_hpp: item.product_hpp,
    selling_price: item.selling_price,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await db.from('transaction_items').insert(itemsPayload)

  if (itemsError) {
    await db.from('transactions').delete().eq('id', tx.id)
    throw itemsError
  }

  return tx
}

/**
 * Create an expense transaction.
 */
export async function createExpenseTransaction(
  payload: CreateExpensePayload,
  recordedBy: string,
): Promise<Transaction> {
  const { data, error } = await db
    .from('transactions')
    .insert([
      {
        type: 'pengeluaran',
        description: payload.description,
        total_amount: payload.total_amount,
        total_profit: 0,
        expense_category: payload.expense_category,
        expense_items: payload.expense_items?.length ? payload.expense_items : null,
        notes: payload.notes ?? null,
        recorded_by: recordedBy,
        transaction_at: payload.transaction_at ?? new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

/**
 * Get transactions with optional filters (RLS enforces visibility).
 */
export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionWithItems[]> {
  let query = db
    .from('transactions')
    .select(`
      *,
      transaction_items(*),
      profiles!recorded_by(full_name)
    `)
    .order('transaction_at', { ascending: false })

  if (filters.dateRange?.from) {
    query = query.gte('transaction_at', filters.dateRange.from.toISOString())
  }
  if (filters.dateRange?.to) {
    const endOfDay = new Date(filters.dateRange.to)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('transaction_at', endOfDay.toISOString())
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters.recordedBy) {
    query = query.eq('recorded_by', filters.recordedBy)
  }
  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as TransactionWithItems[]
}

/**
 * Get today's transactions.
 */
export async function getTodayTransactions(recordedBy?: string): Promise<TransactionWithItems[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  return getTransactions({
    dateRange: { from: startOfDay, to: new Date() },
    recordedBy,
  })
}

/**
 * Get a single transaction with its items.
 */
export async function getTransactionWithItems(id: string): Promise<TransactionWithItems> {
  const { data, error } = await db
    .from('transactions')
    .select(`
      *,
      transaction_items(*),
      profiles!recorded_by(full_name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TransactionWithItems
}

/**
 * Update a transaction. Admin only (RLS).
 */
export async function updateTransaction(
  id: string,
  updates: TransactionUpdate,
): Promise<Transaction> {
  const { data, error } = await db
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

/**
 * Delete a transaction. Admin only (RLS).
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await db.from('transactions').delete().eq('id', id)
  if (error) throw error
}
