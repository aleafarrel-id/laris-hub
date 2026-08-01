import { useQuery } from '@tanstack/react-query'
import { createOfflineMutation } from './useOfflineMutation'
import { useOfflinePendingItems } from './useOfflinePendingItems'
import { toast } from 'sonner'
import { applyOptimisticUpdates } from '@/lib/optimistic-ui'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import {
  createKasir,
  deleteKasir,
  getKasirAuthDetails,
  getKasirList,
  toggleKasirStatus,
  updateKasir,
} from '@/services/kasir-management.service'
import { type CreateKasirPayload, type UpdateKasirPayload } from '@/services/kasir-management.service'
import { useAuthStore } from '@/store/auth.store'

export function useKasirList() {
  const user = useAuthStore((state) => state.user)
  const pendingItems = useOfflinePendingItems([
    'CREATE_KASIR', 'UPDATE_KASIR', 'DELETE_KASIR', 'TOGGLE_KASIR'
  ])

  const result = useQuery({
    enabled: !!user,
    queryKey: QUERY_KEYS.CASHIERS,
    queryFn: getKasirList,
    staleTime: 1000 * 60 * 2, // 2 min
  })

  // Transform pending offline items
  const createCashiers = pendingItems.filter(item => item.action === 'CREATE_KASIR')
  const offlineCashiers = createCashiers.map((item) => {
    const payload = item.payload.payload || item.payload
    return {
      id: `pending-${item.localId}`,
      full_name: payload.full_name,
      role: 'kasir',
      is_active: true,
      created_at: item.createdAt,
      updated_at: item.createdAt,
      isOfflinePending: true,
    } as any
  })

  let mergedData = result.data ? [...offlineCashiers, ...result.data] : result.data
  if (mergedData) {
    mergedData = applyOptimisticUpdates(mergedData, pendingItems, 'KASIR')
  }

  return { ...result, data: mergedData, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useKasirAuthDetails(kasirId: string | null) {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: [...QUERY_KEYS.CASHIERS, 'auth', kasirId],
    queryFn: () => getKasirAuthDetails(kasirId!),
    enabled: !!user && !!kasirId,
    staleTime: 1000 * 60 * 5, // 5 min - email rarely changes
    retry: 1,
  })
}

export function useCreateKasir(onSuccess?: () => void) {
  return createOfflineMutation<CreateKasirPayload, any>(
    'CREATE_KASIR',
    (payload) => createKasir(payload),
    {
      successMessage: 'Akun kasir berhasil dibuat!',
      successDescription: 'Kasir sudah bisa login dengan email dan password yang Anda buat.',
      errorAction: 'membuat akun kasir',
      onSuccess: (_newProfile, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
        onSuccess?.()
      }
    }
  )()
}

export function useUpdateKasir(onSuccess?: () => void) {
  return createOfflineMutation<UpdateKasirPayload, any>(
    'UPDATE_KASIR',
    (payload) => updateKasir(payload),
    {
      successMessage: 'Data kasir berhasil diperbarui.',
      errorAction: 'memperbarui data kasir',
      onSuccess: (updated, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.CASHIERS, 'auth', updated.id] })
        onSuccess?.()
      }
    }
  )()
}

export function useToggleKasirStatus() {
  return createOfflineMutation<{ id: string; isActive: boolean }, any>(
    'TOGGLE_KASIR',
    ({ id, isActive }) => toggleKasirStatus(id, isActive),
    {
      successMessage: 'Status kasir berhasil diubah.',
      errorAction: 'mengubah status kasir',
      onSuccess: (_updated, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      }
    }
  )()
}

export function useDeleteKasir(onSuccess?: () => void) {
  return createOfflineMutation<string, any>(
    'DELETE_KASIR',
    (id) => deleteKasir(id),
    {
      successMessage: 'Akun kasir berhasil dihapus.',
      errorAction: 'menghapus akun kasir',
      onSuccess: (_data, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
        onSuccess?.()
      },
      onError: (error: any) => {
        if (error.has_transactions) {
          toast.error('Tidak dapat dihapus, akun kasir ini masih memiliki riwayat transaksi', {
            description: `Kasir ini memiliki ${error.transaction_count} transaksi. Gunakan fitur Tangguhkan untuk menonaktifkan akun tanpa menghapus data.`,
            duration: 6000,
          })
        } else {
          toast.error('Gagal menghapus akun kasir', { description: translateError(error) })
        }
      }
    }
  )()
}
