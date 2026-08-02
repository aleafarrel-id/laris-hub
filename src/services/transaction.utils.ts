import { supabase } from '@/lib/supabase'

/**
 * Get the authenticated user's ID from the current session.
 * This is authoritative - cannot be spoofed by client-side arguments.
 * Prevents IDOR (Insecure Direct Object Reference) attacks.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sesi tidak valid. Silakan login ulang.')
  return user.id
}

/** Returns the current timestamp as an ISO string. */
export const nowIso = () => new Date().toISOString()
