import type { QueryClient } from '@tanstack/react-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import type { OfflineQueueAction } from '@/lib/offline-queue'
import { enqueueOfflineItem } from '@/lib/offline-queue'
import { translateError } from '@/lib/utils'
import { getKPISummaryForRange } from '@/services/dashboard.service'
import {
  createExpenseTransaction,
  createSaleTransaction,
  deleteTransaction,
  getTodayTransactions,
  getTransactions,
  updateExpenseTransaction,
  updateSaleTransaction,
  updateTransactionStatus,
} from '@/services/transaction.service'
import { nowIso } from '@/services/transaction.utils'
import { useAuthStore } from '@/store/auth.store'
import type { TransactionFilters } from '@/types'

// ─── Private Helpers ──────────────────────────────────────────────────────────

/** Invalidate all data that depends on transaction changes. */
function invalidateTransactionQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
}

/** Standard error handler for transaction mutations. */
function onTransactionError(action: string) {
  return (error: unknown) => {
    toast.error(`Gagal ${action}`, { description: translateError(error) })
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters = {}, page = 1, pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, filters, page, pageSize],
    queryFn: () => getTransactions(filters, page, pageSize),
    staleTime: 1000 * 30, // 30s - transactions change frequently
  })
  
  return { ...result, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useInfiniteTransactions(filters: TransactionFilters = {}, pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  const result = useInfiniteQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'infinite', filters, pageSize],
    queryFn: ({ pageParam = 1 }) => getTransactions(filters, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 30,
  })
  
  return { ...result, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useTransactionSummary(
  filters: Pick<TransactionFilters, 'dateRange' | 'type' | 'recordedBy'> = {},
) {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'summary', filters],
    queryFn: async () => {
      const from = filters.dateRange?.from || new Date(2000, 0, 1)
      const to = filters.dateRange?.to || new Date()
      const kpi = await getKPISummaryForRange(from, to, filters.recordedBy)
      return {
        totalSales: filters.type === 'pengeluaran' ? 0 : kpi.omzet,
        totalSalesTunai: filters.type === 'pengeluaran' ? 0 : (kpi.omzetTunai ?? 0),
        totalSalesQris: filters.type === 'pengeluaran' ? 0 : (kpi.omzetQris ?? 0),
        totalPendingQris: filters.type === 'pengeluaran' ? 0 : (kpi.pendingQris ?? 0),
        totalExpenses: filters.type === 'penjualan' ? 0 : kpi.pengeluaran,
        totalProfit: filters.type === 'pengeluaran' ? 0 : kpi.profit,
      }
    },
    staleTime: 1000 * 30,
  })
  
  return { ...result, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useTodayTransactions(recordedBy?: string) {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'today', recordedBy],
    queryFn: () => getTodayTransactions(recordedBy),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  })
}

// ─── Offline Mutation Factory ─────────────────────────────────────────────────

function createOfflineMutation<TVariables, TData>(
  action: OfflineQueueAction,
  mutationFn: (vars: TVariables) => Promise<TData>,
  options: {
    successMessage: string
    successDescription?: string
    errorAction: string
  },
) {
  return function useMutationHook() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (payload: TVariables) => {
        // Ensure timestamp is recorded exactly when created if offline
        const targetPayload = (payload as any).payload || payload
        if (
          typeof targetPayload === 'object' &&
          targetPayload !== null &&
          !('id' in targetPayload) &&
          targetPayload.transaction_at === undefined
        ) {
          targetPayload.transaction_at = nowIso()
        }

        if (!navigator.onLine) {
          try {
            await enqueueOfflineItem(action, payload)
            return { offline: true } as any
          } catch (queueErr: any) {
            toast.error('Gagal Menyimpan Offline', {
              description: queueErr.message || 'Penyimpanan penuh atau bermasalah.',
            })
            throw queueErr
          }
        }

        try {
          return await mutationFn(payload)
        } catch (err) {
          if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            try {
              await enqueueOfflineItem(action, payload)
              return { offline: true } as any
            } catch (queueErr: any) {
              toast.error('Gagal Menyimpan Offline', {
                description: queueErr.message || 'Penyimpanan penuh atau bermasalah.',
              })
              throw queueErr
            }
          }
          throw err
        }
      },
      onSuccess: (data) => {
        if (data && (data as any).offline) {
          toast.success('Disimpan secara offline!', {
            description: 'Tindakan ini akan disinkronkan saat koneksi tersedia.',
          })
        } else {
          invalidateTransactionQueries(queryClient)
          toast.success(options.successMessage, {
            description: options.successDescription,
          })
        }
      },
      onError: onTransactionError(options.errorAction),
    })
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

type CreateSaleArgs = { payload: Parameters<typeof createSaleTransaction>[0] }
export const useCreateSale = createOfflineMutation<CreateSaleArgs, any>(
  'CREATE_SALE',
  ({ payload }) => createSaleTransaction(payload),
  {
    successMessage: 'Transaksi penjualan berhasil disimpan!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'menyimpan transaksi',
  },
)

type CreateExpenseArgs = { payload: Parameters<typeof createExpenseTransaction>[0] }
export const useCreateExpense = createOfflineMutation<CreateExpenseArgs, any>(
  'CREATE_EXPENSE',
  ({ payload }) => createExpenseTransaction(payload),
  {
    successMessage: 'Pengeluaran berhasil dicatat!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'mencatat pengeluaran',
  },
)

type UpdateSaleArgs = { id: string; payload: Parameters<typeof updateSaleTransaction>[1] }
export const useUpdateSale = createOfflineMutation<UpdateSaleArgs, any>(
  'UPDATE_SALE',
  ({ id, payload }) => updateSaleTransaction(id, payload),
  {
    successMessage: 'Transaksi penjualan berhasil diperbarui!',
    errorAction: 'memperbarui transaksi',
  },
)

type UpdateExpenseArgs = { id: string; payload: Parameters<typeof updateExpenseTransaction>[1] }
export const useUpdateExpense = createOfflineMutation<UpdateExpenseArgs, any>(
  'UPDATE_EXPENSE',
  ({ id, payload }) => updateExpenseTransaction(id, payload),
  {
    successMessage: 'Pengeluaran berhasil diperbarui!',
    errorAction: 'memperbarui pengeluaran',
  },
)

type UpdateStatusArgs = { id: string; status: 'sukses' | 'pending' }
export const useUpdateTransactionStatus = createOfflineMutation<UpdateStatusArgs, any>(
  'UPDATE_STATUS',
  (payload) => updateTransactionStatus(payload.id, payload.status),
  {
    successMessage: 'Status transaksi berhasil diperbarui!',
    errorAction: 'memperbarui status transaksi',
  },
)

type DeleteTransactionArgs = { id: string }
export const useDeleteTransaction = createOfflineMutation<DeleteTransactionArgs, any>(
  'DELETE_TRANSACTION',
  (payload) => deleteTransaction(payload.id),
  {
    successMessage: 'Transaksi berhasil dihapus!',
    errorAction: 'menghapus transaksi',
  },
)
