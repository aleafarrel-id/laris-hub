import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

/**
 * Fetch profile by user ID.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('ACCOUNT_SUSPENDED')
    }
    throw error
  }
  return data as Profile
}

/**
 * Sign in with email and password.
 *
 * Security: after successful auth, checks profiles.is_active.
 * Suspended accounts are signed out immediately before returning,
 * preventing any access even with valid credentials.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  // Check if account is active before granting access
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', data.user.id)
    .single()

  if (profileError?.code === 'PGRST116' || profile?.is_active === false) {
    await supabase.auth.signOut()
    throw new Error('ACCOUNT_SUSPENDED')
  } else if (profileError) {
    throw profileError
  }

  return data
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the current session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Update profile fields.
 *
 * Security: validates that the calling user's session matches userId to prevent
 * client-side IDOR (Insecure Direct Object Reference).
 * RLS on the 'profiles' table provides the server-side enforcement.
 */
export async function updateProfile(
  userId: string,
  updates: Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>,
): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: Tidak dapat mengubah profil pengguna lain.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.full_name,
      phone: updates.phone,
      avatar_url: updates.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Update Admin's own credentials via Edge Function.
 * Bypasses email confirmation for fake emails.
 */
export async function updateAdminCredentials(payload: { email?: string; password?: string }) {
  const { data, error } = await supabase.functions.invoke('update-admin', {
    method: 'PATCH',
    body: payload,
  })

  if (error) {
    throw error
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
