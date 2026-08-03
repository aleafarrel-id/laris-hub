import { supabase } from '@/lib/supabase'
import type {
  Transaction,
  TransactionFilters,
  TransactionUpdate,
  TransactionWithItems,
} from '@/types'
import { nowIso } from './transaction.utils'

export * from './expense.service'
export * from './sale.service'

/**
 * Get transactions with optional filters (RLS enforces visibility).
 */
export async function getTransactions(
  filters: TransactionFilters = {},
  page = 1,
  pageSize = 20,
): Promise<{ data: TransactionWithItems[]; nextPage: number | null }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('transactions')
    .select(
      `
      id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at, payment_method, status,
      transaction_items(id, transaction_id, product_id, product_name, product_hpp, selling_price, quantity, subtotal, profit, created_at),
      profiles!recorded_by(id, full_name, avatar_url, phone)
    `,
      { count: 'exact' },
    )
    .order('transaction_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

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
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    query = query.eq('payment_method', filters.paymentMethod)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error, count } = await query
  if (error) throw error

  const hasNext = count !== null && from + pageSize < count
  return {
    data: (data ?? []) as unknown as TransactionWithItems[],
    nextPage: hasNext ? page + 1 : null,
  }
}

/**
 * Get today's transactions.
 */
export async function getTodayTransactions(recordedBy?: string): Promise<TransactionWithItems[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const res = await getTransactions(
    {
      dateRange: { from: startOfDay, to: new Date() },
      recordedBy,
    },
    1,
    1000,
  )

  return res.data
}

/**
 * Get a single transaction with its items.
 */
export async function getTransactionWithItems(id: string): Promise<TransactionWithItems> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at, payment_method, status,
      transaction_items(id, transaction_id, product_id, product_name, product_hpp, selling_price, quantity, subtotal, profit, created_at),
      profiles!recorded_by(id, full_name, avatar_url, phone)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as TransactionWithItems
}

/**
 * Update a transaction (generic). Admin only (RLS).
 */
export async function updateTransaction(
  id: string,
  updates: TransactionUpdate,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: nowIso() })
    .eq('id', id)
    .select(
      'id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at, payment_method, status',
    )
    .single()

  if (error) throw error
  return data as Transaction
}

/**
 * Update transaction status.
 */
export async function updateTransactionStatus(
  id: string,
  status: 'success' | 'pending',
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ status, updated_at: nowIso() })
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete a transaction. Admin only (RLS).
 * Handles items deletion before transaction deletion atomically via Postgres RPC.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_transaction', { p_transaction_id: id })
  if (error) throw error
}
