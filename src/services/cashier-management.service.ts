import { supabase } from '@/lib/supabase'
import { throwEdgeFunctionError } from '@/lib/utils'
import type { Profile } from '@/types'

export interface CreateCashierPayload {
  email: string
  password: string
  full_name: string
  phone?: string | null
}

export interface UpdateCashierPayload {
  id: string
  full_name?: string
  phone?: string | null
  email?: string
  password?: string
}

export interface CashierAuthDetails {
  id: string
  email: string | null
  last_sign_in_at: string | null
  created_at: string
}

export interface DeleteCashierError {
  has_transactions: true
  transaction_count: number
  error: string
}

/**
 * Fetch all cashier profiles. Admin only (RLS enforced).
 */
export async function getCashierList(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
    .eq('role', 'cashier')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Profile[]
}

/**
 * Fetch active cashier profiles (for dropdowns).
 */
export async function getActiveCashiers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, phone')
    .eq('role', 'cashier')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Profile[]
}

/**
 * Fetch cashier's auth details (email, last sign-in) from auth.users via Edge Function.
 * Admin only. ID is passed via x-cashier-id header to avoid CORS issues with query params.
 */
export async function getCashierAuthDetails(cashierId: string): Promise<CashierAuthDetails> {
  const { data, error } = await supabase.functions.invoke('update-cashier', {
    method: 'GET',
    headers: { 'x-cashier-id': cashierId },
  })

  await throwEdgeFunctionError(error, data)
  return data as CashierAuthDetails
}

/**
 * Create a new cashier account via Edge Function.
 * Uses service_role server-side - anon key cannot create auth users.
 */
export async function createCashier(payload: CreateCashierPayload): Promise<Profile> {
  const { data, error } = await supabase.functions.invoke('create-cashier', {
    body: payload,
  })

  await throwEdgeFunctionError(error, data)
  return data.profile as Profile
}

/**
 * Update cashier profile fields and/or auth credentials via Edge Function.
 */
export async function updateCashier(payload: UpdateCashierPayload): Promise<Profile> {
  const { data, error } = await supabase.functions.invoke('update-cashier', {
    method: 'PATCH',
    body: payload,
  })

  await throwEdgeFunctionError(error, data)
  return data.profile as Profile
}

/**
 * Permanently delete a cashier account (auth + profile).
 * Will fail with has_transactions=true if cashier has recorded transactions - in that
 * case the caller should use toggleCashierStatus(false) to suspend instead.
 */
export async function deleteCashier(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('update-cashier', {
    method: 'DELETE',
    body: { id },
  })

  await throwEdgeFunctionError(error, data, (err, ctx) => {
    if (ctx?.has_transactions) {
      ;(err as Error & DeleteCashierError).has_transactions = true
      ;(err as Error & DeleteCashierError).transaction_count = ctx.transaction_count as number
    }
  })
}

/**
 * Toggle cashier active status (suspend / re-activate).
 * Admin only (RLS enforced via profiles_update_admin_only policy).
 */
export async function toggleCashierStatus(id: string, isActive: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
    .single()

  if (error) throw error
  return data as Profile
}
