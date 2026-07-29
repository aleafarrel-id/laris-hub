import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/utils'
import { getProfile, signIn, signOut } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { user, profile, isLoading, isInitialized } = useAuthStore()

  const isAdmin = profile?.role === 'admin'
  const isKasir = profile?.role === 'kasir'

  return {
    user,
    profile,
    isLoading,
    isInitialized,
    isAdmin,
    isKasir,
    role: profile?.role ?? null,
  }
}

export function useAuthActions() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { setUser, setProfile, setLoading, setInitialized, clearAuth } = useAuthStore()

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { session, user } = await signIn(email, password)
      if (!session || !user) throw new Error('Login gagal. Coba lagi.')

      setUser(user)
      const profile = await getProfile(user.id)
      setProfile(profile)
      setInitialized(true)

      return profile
    } catch (error) {
      throw new Error(translateError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      clearAuth()
      queryClient.clear()
      navigate({ to: '/login' })
    } catch (error) {
      toast.error(translateError(error))
    }
  }

  return { signIn: handleSignIn, signOut: handleSignOut }
}

export function useAuthListener() {
  const queryClient = useQueryClient()
  const { setUser, setProfile, setInitialized, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        try {
          const profile = await getProfile(session.user.id)
          if (mounted) setProfile(profile)
        } catch {
          // Profile fetch failed — still mark initialized
        }
      }

      if (mounted) {
        setInitialized(true)
        setLoading(false)
      }
    })

    // Subscribe to future auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const profile = await getProfile(session.user.id)
          if (mounted) setProfile(profile)
        } catch {
          // Silently handle — user is logged in even if profile fetch fails
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
        queryClient.clear()
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setUser(session.user)
      }

      if (mounted) {
        setInitialized(true)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [queryClient, setUser, setProfile, setInitialized, setLoading, clearAuth])
}
