import { supabase } from '@/lib/supabase'
import type {
  Transaction,
  TransactionFilters,
  TransactionUpdate,
  TransactionWithItems,
} from '@/types'
import { nowIso } from './transaction.utils'

// Re-export specific services to maintain compatibility with existing imports
export * from './sale.service'
export * from './expense.service'

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
    .select(`
      id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at,
      transaction_items(id, transaction_id, product_name, quantity, selling_price, subtotal),
      profiles!recorded_by(id, full_name, avatar_url, phone)
    `, { count: 'exact' })
    .order('transaction_at', { ascending: false })
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

  const res = await getTransactions({
    dateRange: { from: startOfDay, to: new Date() },
    recordedBy,
  }, 1, 1000)
  
  return res.data
}

/**
 * Get a single transaction with its items.
 */
export async function getTransactionWithItems(id: string): Promise<TransactionWithItems> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at,
      transaction_items(id, transaction_id, product_name, quantity, selling_price, subtotal),
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
    .select('id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at')
    .single()

  if (error) throw error
  return data as Transaction
}

/**
 * Delete a transaction. Admin only (RLS).
 * Assumes cascading delete is not guaranteed on the client side without an RPC,
 * but handles items deletion before transaction deletion. 
 * TODO: Ideally moved to an RPC `delete_transaction(id)` on Postgres to ensure atomicity.
 */
export async function deleteTransaction(id: string): Promise<void> {
  // First delete items to maintain referential integrity if CASCADE is not configured
  const { error: itemsError } = await supabase
    .from('transaction_items')
    .delete()
    .eq('transaction_id', id)
  if (itemsError) throw itemsError

  // Then delete the parent transaction
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
