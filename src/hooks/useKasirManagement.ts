import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import {
  createKasir,
  getKasirList,
  toggleKasirStatus,
  type CreateKasirPayload,
} from '@/services/kasir-management.service'

export function useKasirList() {
  return useQuery({
    queryKey: QUERY_KEYS.CASHIERS,
    queryFn: getKasirList,
    staleTime: 1000 * 60 * 2, // 2 min
  })
}

export function useCreateKasir(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateKasirPayload) => createKasir(payload),
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      toast.success(`Akun kasir "${newProfile.full_name}" berhasil dibuat!`, {
        description: 'Kasir sudah bisa login dengan email dan password yang Anda buat.',
      })
      onSuccess?.()
    },
    onError: (error) => {
      toast.error('Gagal membuat akun kasir', { description: translateError(error) })
    },
  })
}

export function useToggleKasirStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleKasirStatus(id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      toast.success(
        updated.is_active
          ? `Akun "${updated.full_name}" diaktifkan kembali.`
          : `Akun "${updated.full_name}" ditangguhkan.`,
      )
    },
    onError: (error) => {
      toast.error('Gagal mengubah status kasir', { description: translateError(error) })
    },
  })
}
