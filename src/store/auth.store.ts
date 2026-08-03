import type { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/constants'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  isInitialized: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setInitialized: (initialized: boolean) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isInitialized: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, profile: null, isInitialized: true, isLoading: false }),
    }),
    {
      name: `${STORAGE_KEYS.THEME}-auth`,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// Selectors
export const selectUser = (state: AuthState) => state.user
export const selectProfile = (state: AuthState) => state.profile
export const selectIsAdmin = (state: AuthState) => state.profile?.role === 'admin'
export const selectIsCashier = (state: AuthState) => state.profile?.role === 'cashier'
export const selectIsInitialized = (state: AuthState) => state.isInitialized
export const selectIsLoading = (state: AuthState) => state.isLoading
