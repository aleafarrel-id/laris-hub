import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import {
  createKasir,
  deleteKasir,
  getKasirAuthDetails,
  getKasirList,
  toggleKasirStatus,
  updateKasir,
  type CreateKasirPayload,
  type DeleteKasirError,
  type UpdateKasirPayload,
} from '@/services/kasir-management.service'

export function useKasirList() {
  return useQuery({
    queryKey: QUERY_KEYS.CASHIERS,
    queryFn: getKasirList,
    staleTime: 1000 * 60 * 2, // 2 min
  })
}

export function useKasirAuthDetails(kasirId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CASHIERS, 'auth', kasirId],
    queryFn: () => getKasirAuthDetails(kasirId!),
    enabled: !!kasirId,
    staleTime: 1000 * 60 * 5, // 5 min — email rarely changes
    retry: 1,
  })
}

export function useCreateKasir(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateKasirPayload) => createKasir(payload),
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      toast.success(`Akun "${newProfile.full_name}" berhasil dibuat!`, {
        description: 'Kasir sudah bisa login dengan email dan password yang Anda buat.',
      })
      onSuccess?.()
    },
    onError: (error) => {
      toast.error('Gagal membuat akun kasir', { description: translateError(error) })
    },
  })
}

export function useUpdateKasir(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateKasirPayload) => updateKasir(payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      // Also invalidate the auth details cache for this specific kasir
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.CASHIERS, 'auth', updated.id] })
      toast.success(`Data "${updated.full_name}" berhasil diperbarui.`)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error('Gagal memperbarui data kasir', { description: translateError(error) })
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

export function useDeleteKasir(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteKasir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      toast.success('Akun kasir berhasil dihapus.')
      onSuccess?.()
    },
    onError: (error: Error & Partial<DeleteKasirError>) => {
      if (error.has_transactions) {
        toast.error('Tidak bisa dihapus — ada transaksi tersimpan', {
          description: `Kasir ini memiliki ${error.transaction_count} transaksi. Gunakan fitur Tangguhkan untuk menonaktifkan akun tanpa menghapus data.`,
          duration: 6000,
        })
      } else {
        toast.error('Gagal menghapus akun kasir', { description: translateError(error) })
      }
    },
  })
}

