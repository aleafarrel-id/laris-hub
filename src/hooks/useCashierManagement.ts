import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { applyOptimisticUpdates } from '@/lib/optimistic-ui'
import { translateError } from '@/lib/utils'
import {
  type CreateCashierPayload,
  createCashier,
  deleteCashier,
  getCashierAuthDetails,
  getCashierList,
  toggleCashierStatus,
  type UpdateCashierPayload,
  updateCashier,
} from '@/services/cashier-management.service'
import { useAuthStore } from '@/store/auth.store'
import { createOfflineMutation } from './useOfflineMutation'
import { useOfflinePendingItems } from './useOfflinePendingItems'

export function useCashierList() {
  const user = useAuthStore((state) => state.user)
  const pendingItems = useOfflinePendingItems([
    'CREATE_CASHIER',
    'UPDATE_CASHIER',
    'DELETE_CASHIER',
    'TOGGLE_CASHIER',
  ])

  const result = useQuery({
    enabled: !!user,
    queryKey: QUERY_KEYS.CASHIERS,
    queryFn: getCashierList,
  })

  const mergedData = useMemo(() => {
    const createCashiers = pendingItems.filter((item) => item.action === 'CREATE_CASHIER')
    const offlineCashiers = createCashiers.map((item) => {
      const payload = item.payload.payload || item.payload
      return {
        id: `pending-${item.localId}`,
        full_name: payload.full_name,
        role: 'cashier',
        is_active: true,
        created_at: item.createdAt,
        updated_at: item.createdAt,
        isOfflinePending: true,
      } as any
    })

    let currentData = result.data ? [...offlineCashiers, ...result.data] : [...offlineCashiers]
    if (currentData) {
      currentData = applyOptimisticUpdates(currentData, pendingItems, 'CASHIER')
    }
    return currentData
  }, [result.data, pendingItems])

  return {
    ...result,
    data: mergedData,
    isOfflinePaused:
      (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data),
  }
}

export function useCashierAuthDetails(cashierId: string | null) {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: [...QUERY_KEYS.CASHIERS, 'auth', cashierId],
    queryFn: () => getCashierAuthDetails(cashierId!),
    enabled:
      !!user &&
      !!cashierId &&
      !cashierId.startsWith('pending-') &&
      (typeof navigator !== 'undefined' ? navigator.onLine : true),
    retry: 1,
  })
}

export function useCreateCashier(onSuccess?: () => void) {
  return createOfflineMutation<CreateCashierPayload, any>(
    'CREATE_CASHIER',
    (payload) => createCashier(payload),
    {
      successMessage: 'Akun cashier berhasil dibuat!',
      successDescription: 'Kasir sudah bisa login dengan email dan password yang Anda buat.',
      errorAction: 'membuat akun cashier',
      onSuccess: (_newProfile, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
        onSuccess?.()
      },
    },
  )()
}

export function useUpdateCashier(onSuccess?: () => void) {
  return createOfflineMutation<UpdateCashierPayload, any>(
    'UPDATE_CASHIER',
    (payload) => updateCashier(payload),
    {
      successMessage: 'Data cashier berhasil diperbarui.',
      errorAction: 'memperbarui data cashier',
      onSuccess: (updated, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.CASHIERS, 'auth', updated.id] })
        onSuccess?.()
      },
    },
  )()
}

export function useToggleCashierStatus() {
  return createOfflineMutation<{ id: string; isActive: boolean }, any>(
    'TOGGLE_CASHIER',
    ({ id, isActive }) => toggleCashierStatus(id, isActive),
    {
      successMessage: 'Status cashier berhasil diubah.',
      errorAction: 'mengubah status cashier',
      onSuccess: (_updated, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      },
    },
  )()
}

export function useDeleteCashier(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const baseMutation = createOfflineMutation<string, any>(
    'DELETE_CASHIER',
    (id) => deleteCashier(id),
    {
      successMessage: 'Akun cashier berhasil dihapus.',
      errorAction: 'menghapus akun cashier',
      onSuccess: (_data, _vars, qc) => {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
        onSuccess?.()
      },
      onError: (error: any) => {
        if (error.has_transactions) {
          toast.error('Tidak dapat dihapus, akun cashier ini masih memiliki riwayat transaksi', {
            description: `Kasir ini memiliki ${error.transaction_count} transaksi. Gunakan fitur Tangguhkan untuk menonaktifkan akun tanpa menghapus data.`,
            duration: 6000,
          })
        } else {
          toast.error('Gagal menghapus akun cashier', { description: translateError(error) })
        }
      },
    },
  )()

  return {
    ...baseMutation,
    mutate: (id: string, options?: any) => {
      if (id.startsWith('pending-')) {
        const localId = id.replace('pending-', '')
        import('@/lib/offline-queue').then(({ dequeueOfflineItem }) => {
          dequeueOfflineItem(localId).then(() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
            toast.success('Pendaftaran akun cashier dibatalkan.')
            onSuccess?.()
            options?.onSuccess?.()
          })
        })
      } else {
        baseMutation.mutate(id, options)
      }
    },
  } as typeof baseMutation
}
