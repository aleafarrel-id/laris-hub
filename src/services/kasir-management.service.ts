import { supabase } from '@/lib/supabase'
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
    .select('*')
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

  if (error) {
    if (error instanceof Error && 'context' in error) {
      let context = (error as any).context
      if (context instanceof Response) {
        try { context = await context.clone().json() } catch {}
      } else if (typeof context === 'string') {
        try { context = JSON.parse(context) } catch {}
      }
      const err = new Error(context?.error || error.message)
      ;(err as any).isUserFacing = true
      throw err
    }
    throw error
  }
  if (data?.error) {
    const err = new Error(data.error)
    ;(err as any).isUserFacing = true
    throw err
  }
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

  if (error) {
    if (error instanceof Error && 'context' in error) {
      let context = (error as any).context
      if (context instanceof Response) {
        try { context = await context.clone().json() } catch {}
      } else if (typeof context === 'string') {
        try { context = JSON.parse(context) } catch {}
      }
      const err = new Error(context?.error || error.message)
      ;(err as any).isUserFacing = true
      throw err
    }
    throw error
  }
  if (data?.error) {
    const err = new Error(data.error)
    ;(err as any).isUserFacing = true
    throw err
  }
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

  if (error) {
    if (error instanceof Error && 'context' in error) {
      let context = (error as any).context
      if (context instanceof Response) {
        try { context = await context.clone().json() } catch {}
      } else if (typeof context === 'string') {
        try { context = JSON.parse(context) } catch {}
      }
      const err = new Error(context?.error || error.message)
      ;(err as any).isUserFacing = true
      throw err
    }
    throw error
  }
  if (data?.error) {
    const err = new Error(data.error)
    ;(err as any).isUserFacing = true
    throw err
  }
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

  if (error) {
    if (error instanceof Error) {
      let context = (error as any).context
      if (context instanceof Response) {
        try { context = await context.clone().json() } catch {}
      } else if (typeof context === 'string') {
        try { context = JSON.parse(context) } catch {}
      }
      
      // If context is empty, sometimes supabase-js puts the JSON in error.message
      if (!context && typeof error.message === 'string' && error.message.startsWith('{')) {
        try { context = JSON.parse(error.message) } catch {}
      }
      
      const err = new Error(context?.error || error.message) as Error & DeleteKasirError
      ;(err as any).isUserFacing = true
      if (context?.has_transactions) {
        err.has_transactions = true
        err.transaction_count = context.transaction_count
      }
      throw err
    }
    throw error
  }

  // Edge Function signals a business-logic conflict (has transactions) via data.error + 409
  // but if it returned 200 OK with error payload we still handle it here:
  if (data?.error) {
    const err = new Error(data.error) as Error & DeleteKasirError
    ;(err as any).isUserFacing = true
    if (data.has_transactions) {
      err.has_transactions = true
      err.transaction_count = data.transaction_count
    }
    throw err
  }
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
