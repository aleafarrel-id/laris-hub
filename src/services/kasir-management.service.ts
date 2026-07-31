import { supabase } from '@/lib/supabase'
import { throwEdgeFunctionError } from '@/lib/utils'
import type { Profile } from '@/types'

export interface CreateKasirPayload {
  email: string
  password: string
  full_name: string
  phone?: string | null
}

export interface UpdateKasirPayload {
  id: string
  full_name?: string
  phone?: string | null
  email?: string
  password?: string
}

export interface KasirAuthDetails {
  id: string
  email: string | null
  last_sign_in_at: string | null
  created_at: string
}

export interface DeleteKasirError {
  has_transactions: true
  transaction_count: number
  error: string
}

/**
 * Fetch all kasir profiles. Admin only (RLS enforced).
 */
export async function getKasirList(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
    .eq('role', 'kasir')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Profile[]
}

/**
 * Fetch kasir's auth details (email, last sign-in) from auth.users via Edge Function.
 * Admin only. ID is passed via x-kasir-id header to avoid CORS issues with query params.
 */
export async function getKasirAuthDetails(kasirId: string): Promise<KasirAuthDetails> {
  const { data, error } = await supabase.functions.invoke('update-kasir', {
    method: 'GET',
    headers: { 'x-kasir-id': kasirId },
  })

  await throwEdgeFunctionError(error, data)
  return data as KasirAuthDetails
}

/**
 * Create a new kasir account via Edge Function.
 * Uses service_role server-side - anon key cannot create auth users.
 */
export async function createKasir(payload: CreateKasirPayload): Promise<Profile> {
  const { data, error } = await supabase.functions.invoke('create-kasir', {
    body: payload,
  })

  await throwEdgeFunctionError(error, data)
  return data.profile as Profile
}

/**
 * Update kasir profile fields and/or auth credentials via Edge Function.
 */
export async function updateKasir(payload: UpdateKasirPayload): Promise<Profile> {
  const { data, error } = await supabase.functions.invoke('update-kasir', {
    method: 'PATCH',
    body: payload,
  })

  await throwEdgeFunctionError(error, data)
  return data.profile as Profile
}

/**
 * Permanently delete a kasir account (auth + profile).
 * Will fail with has_transactions=true if kasir has recorded transactions - in that
 * case the caller should use toggleKasirStatus(false) to suspend instead.
 */
export async function deleteKasir(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('update-kasir', {
    method: 'DELETE',
    body: { id },
  })

  await throwEdgeFunctionError(error, data, (err, ctx) => {
    if (ctx?.has_transactions) {
      ;(err as Error & DeleteKasirError).has_transactions = true
      ;(err as Error & DeleteKasirError).transaction_count = ctx.transaction_count as number
    }
  })
}

/**
 * Toggle kasir active status (suspend / re-activate).
 * Admin only (RLS enforced via profiles_update_admin_only policy).
 */
export async function toggleKasirStatus(id: string, isActive: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
    .single()

  if (error) throw error
  return data as Profile
}
