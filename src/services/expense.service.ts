import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types'
import { getAuthenticatedUserId, nowIso } from './transaction.utils'

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
    .select('id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at')
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
    .select('id, type, description, total_amount, total_profit, expense_category, expense_items, notes, recorded_by, transaction_at, created_at, updated_at')
    .single()

  if (error) throw error
  return data as Transaction
}
