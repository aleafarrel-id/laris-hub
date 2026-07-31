import { supabase } from '@/lib/supabase'
import type { SaleItemFormData } from '@/lib/validations/transaction.schema'
import type { Transaction } from '@/types'
import { getAuthenticatedUserId, nowIso } from './transaction.utils'

export interface CreateSalePayload {
  items: SaleItemFormData[]
  notes?: string | null
  transaction_at?: string
  payment_method?: 'tunai' | 'qris'
  status?: 'sukses' | 'pending'
}

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
      p_payment_method: payload.payment_method ?? 'tunai',
      p_status: payload.status ?? 'sukses',
    },
  )

  if (txError) throw txError

  return transaction as unknown as Transaction
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
      p_payment_method: payload.payment_method ?? 'tunai',
      p_status: payload.status ?? 'sukses',
    },
  )

  if (txError) throw txError

  return transaction as unknown as Transaction
}
