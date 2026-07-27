import { useAuthListener } from '@/hooks/useAuth'

// ============================================================
// AuthProvider — mounts the Supabase auth listener once at app root
// ============================================================

/**
 * Mounts the global auth state listener.
 * Place this inside QueryClientProvider but wrapping all routes.
 * Renders nothing — pure side-effect component.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthListener()
  return <>{children}</>
}
