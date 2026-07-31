import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import { getProfile, updateProfile } from '@/services/auth.service'
import { getActiveCashiers } from '@/services/kasir-management.service'
import { useAuthStore } from '@/store/auth.store'
import type { Profile } from '@/types'

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: [...QUERY_KEYS.PROFILE, userId],
    queryFn: () => {
      if (!userId) throw new Error('Tidak ada sesi pengguna')
      return getProfile(userId)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCashiers() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: [...QUERY_KEYS.CASHIERS, 'active-only'],
    queryFn: getActiveCashiers,
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, setProfile } = useAuthStore()

  return useMutation({
    mutationFn: (updates: Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>) => {
      if (!user) throw new Error('Tidak ada sesi pengguna')
      return updateProfile(user.id, updates)
    },
    onSuccess: (updatedProfile) => {
      // Update Zustand store immediately
      setProfile(updatedProfile)
      // Invalidate cached profile query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE })
      toast.success('Profil berhasil diperbarui!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}
