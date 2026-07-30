import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

/**
 * Fetch profile by user ID.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
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
 * Get the current session (non-reactive, one-shot check).
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
  // Authoritative check: ensure the caller owns this profile
  const { data: { user } } = await supabase.auth.getUser()
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
    .select()
    .single()

  if (error) throw error
  return data as Profile
}
