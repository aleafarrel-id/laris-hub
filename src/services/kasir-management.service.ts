import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export interface CreateKasirPayload {
  email: string
  password: string
  full_name: string
  phone?: string | null
}

/**
 * Fetch all kasir profiles. Admin only (RLS enforced).
 */
export async function getKasirList(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'kasir')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Profile[]
}

/**
 * Create a new kasir account via Edge Function.
 * Uses service_role server-side — the anon key cannot create users.
 */
export async function createKasir(payload: CreateKasirPayload): Promise<Profile> {
  const { data, error } = await supabase.functions.invoke('create-kasir', {
    body: payload,
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data.profile as Profile
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
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Force sign-out a kasir so their current session is immediately invalidated.
 * Requires admin JWT. Called via Edge Function (service_role needed).
 * ponytail: skip until user requests it — Supabase token expiry is 1 hour.
 */
