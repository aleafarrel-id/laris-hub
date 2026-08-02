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
      toast.success('Berhasil keluar dari akun')
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

    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!mounted) return

      if (sessionError || !session) {
        setInitialized(true)
        setLoading(false)
        return
      }

      if (!navigator.onLine) {
        // If offline, just rely on the stored session state from Zustand
        if (session.user) setUser(session.user)
        setInitialized(true)
        setLoading(false)
        return
      }

      supabase.auth.getUser().then(async ({ data: { user }, error }) => {
        if (!mounted) return

        if (user && !error) {
          setUser(user)
          try {
            const profile = await getProfile(user.id)
            if (profile?.is_active === false) {
              await signOut()
              clearAuth()
              queryClient.clear()
              return
            }
            if (mounted) setProfile(profile)
          } catch (error: any) {
            if (error.message === 'ACCOUNT_SUSPENDED') {
              await signOut()
              clearAuth()
              queryClient.clear()
            }
          }
        }

        if (mounted) {
          setInitialized(true)
          setLoading(false)
        }
      })
    })

    // Subscribe to future auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        if (navigator.onLine) {
          try {
            const profile = await getProfile(session.user.id)
            if (profile?.is_active === false) {
              await signOut()
              clearAuth()
              queryClient.clear()
              return
            }
            if (mounted) setProfile(profile)
          } catch (error: any) {
            if (error.message === 'ACCOUNT_SUSPENDED') {
              await signOut()
              clearAuth()
              queryClient.clear()
            }
          }
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
