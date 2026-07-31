import { supabase } from '@/lib/supabase'
import type { SaleItemFormData } from '@/lib/validations/transaction.schema'
import type {
  Transaction,
  TransactionFilters,
  TransactionUpdate,
  TransactionWithItems,
} from '@/types'

export interface CreateSalePayload {
  items: SaleItemFormData[]
  notes?: string | null
  transaction_at?: string
}

export interface CreateExpensePayload {
  description: string
  total_amount: number
  expense_category: 'operasional' | 'bahan_baku' | 'lainnya'
  /** Optional breakdown items stored as JSONB - e.g. [{name:"Gas LPG",qty:2,unit_price:22000}] */
  expense_items?: Array<{ name: string; qty?: number; unit_price: number }>
  notes?: string | null
  transaction_at?: string
}

/**
 * Get the authenticated user's ID from the current session.
 * This is authoritative - cannot be spoofed by client-side arguments.
 * Prevents IDOR (Insecure Direct Object Reference) attacks.
 */
async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sesi tidak valid. Silakan login ulang.')
  return user.id
}

/** Returns the current timestamp as an ISO string. */
const nowIso = () => new Date().toISOString()

/**
 * Create a sale transaction with multiple items.
 * Security: recorded_by is fetched from the authenticated session,
 * not accepted as an argument, to prevent IDOR spoofing.
 */
export async function createSaleTransaction(payload: CreateSalePayload): Promise<Transaction> {
  const recordedBy = await getAuthenticatedUserId()

  const { data: transaction, error: txError } = await (supabase as any).rpc(
    'create_sale_transaction',
    {
      p_recorded_by: recordedBy,
      p_notes: payload.notes ?? null,
      p_transaction_at: payload.transaction_at ?? nowIso(),
      p_items: payload.items,
    },
  )

  if (txError) throw txError

  return transaction as unknown as Transaction
}

/**
 * Create an expense transaction.
 * Security: recorded_by is fetched from the authenticated session.
 */
export async function createExpenseTransaction(
  payload: CreateExpensePayload,
): Promise<Transaction> {
  const recordedBy = await getAuthenticatedUserId()

  const { data, error } = await supabase
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
        transaction_at: payload.transaction_at ?? nowIso(),
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
  let query = supabase
    .from('transactions')
    .select(`
      *,
      transaction_items(*),
      profiles!recorded_by(id, full_name, avatar_url, phone)
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
  return (data ?? []) as unknown as TransactionWithItems[]
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
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_items(*),
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
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

/**
 * Update an expense transaction. Admin only.
 */
export async function updateExpenseTransaction(
  id: string,
  payload: CreateExpensePayload,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      description: payload.description,
      total_amount: payload.total_amount,
      expense_category: payload.expense_category,
      expense_items: payload.expense_items?.length ? payload.expense_items : null,
      notes: payload.notes ?? null,
      transaction_at: payload.transaction_at ?? nowIso(),
      updated_at: nowIso(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

/**
 * Update a sale transaction. Admin only.
 * This will replace the transaction items and recalculate totals.
 */
export async function updateSaleTransaction(
  id: string,
  payload: CreateSalePayload,
): Promise<Transaction> {
  const { data: transaction, error: txError } = await (supabase as any).rpc(
    'update_sale_transaction',
    {
      p_transaction_id: id,
      p_notes: payload.notes ?? null,
      p_transaction_at: payload.transaction_at ?? nowIso(),
      p_items: payload.items,
    },
  )

  if (txError) throw txError

  return transaction as unknown as Transaction
}

/**
 * Delete a transaction. Admin only (RLS).
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { error: itemsError } = await supabase
    .from('transaction_items')
    .delete()
    .eq('transaction_id', id)
  if (itemsError) throw itemsError

  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
