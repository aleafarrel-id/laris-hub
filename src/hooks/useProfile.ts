import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { getProfile, updateProfile } from '@/services/auth.service'
import { getActiveCashiers } from '@/services/cashier-management.service'
import { useAuthStore } from '@/store/auth.store'
import type { Profile } from '@/types'
import { createOfflineMutation } from './useOfflineMutation'

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [...QUERY_KEYS.PROFILE, userId],
    queryFn: () => {
      if (!userId) throw new Error('Tidak ada sesi pengguna')
      return getProfile(userId)
    },
    enabled: !!userId,
  })
}

export function useCashiers() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: [...QUERY_KEYS.CASHIERS, 'active-only'],
    queryFn: getActiveCashiers,
    enabled: !!user,
  })
}

export function useUpdateProfile() {
  const { user, profile, setProfile } = useAuthStore()

  return createOfflineMutation<
    { id: string; updates: Pick<Profile, 'full_name' | 'phone' | 'avatar_url'> },
    any
  >(
    'UPDATE_PROFILE',
    ({ id, updates }) => {
      if (!user) throw new Error('Tidak ada sesi pengguna')
      return updateProfile(id, updates)
    },
    {
      successMessage: 'Profil berhasil diperbarui!',
      errorAction: 'memperbarui profil',
      onSuccess: (updatedProfile, _vars, queryClient) => {
        if ((updatedProfile as any)?.offline) {
          setProfile({ ...profile!, ..._vars.updates })
          return
        }
        setProfile(updatedProfile)
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE })
      },
    },
  )()
}

export function useUpdateOwnCredentials() {
  const { user } = useAuthStore()

  return createOfflineMutation<{ email?: string; password?: string }, any>(
    'UPDATE_OWN_CREDENTIALS',
    async ({ email, password }) => {
      if (!user) throw new Error('Tidak ada sesi pengguna')
      const { updateAdminCredentials } = await import('@/services/auth.service')
      return updateAdminCredentials({
        email,
        password,
      })
    },
    {
      successMessage: 'Kredensial keamanan berhasil diperbarui!',
      errorAction: 'memperbarui kredensial',
      onSuccess: () => { },
    },
  )()
}
