import type { QueryClient } from '@tanstack/react-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { enqueueOfflineSale } from '@/lib/offline-queue'
import { translateError } from '@/lib/utils'
import { nowIso } from '@/services/transaction.utils'
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

  return useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, filters, page, pageSize],
    queryFn: () => getTransactions(filters, page, pageSize),
    staleTime: 1000 * 30, // 30s - transactions change frequently
  })
}

export function useInfiniteTransactions(filters: TransactionFilters = {}, pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  return useInfiniteQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'infinite', filters, pageSize],
    queryFn: ({ pageParam = 1 }) => getTransactions(filters, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 30,
  })
}

export function useTransactionSummary(
  filters: Pick<TransactionFilters, 'dateRange' | 'type' | 'recordedBy'> = {},
) {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'summary', filters],
    queryFn: async () => {
      const from = filters.dateRange?.from || new Date(2000, 0, 1)
      const to = filters.dateRange?.to || new Date()
      // getKPISummaryForRange fetches lightweight aggregate columns (type, amount, profit)
      // instead of joining full transaction data
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

// ─── Mutation Factory ──────────────────────────────────────────────────────────

function createTransactionMutation<TVariables, TData>(
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
      mutationFn,
      onSuccess: () => {
        invalidateTransactionQueries(queryClient)
        toast.success(options.successMessage, {
          description: options.successDescription,
        })
      },
      onError: onTransactionError(options.errorAction),
    })
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

type CreateSaleArgs = { payload: Parameters<typeof createSaleTransaction>[0] }
export const useCreateSale = function useMutationHook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ payload }: CreateSaleArgs) => {
      // Ensure offline transactions record the exact time of creation, not sync time
      payload.transaction_at = payload.transaction_at || nowIso()
      
      if (!navigator.onLine) {
        try {
          await enqueueOfflineSale(payload)
          return { offline: true }
        } catch (queueErr: any) {
          toast.error('Gagal Menyimpan Offline', {
            description: queueErr.message || 'Penyimpanan penuh atau bermasalah.',
          })
          throw queueErr
        }
      }
      try {
        return await createSaleTransaction(payload)
      } catch (err) {
        // Fallback to offline queue if it's a network error
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          try {
            await enqueueOfflineSale(payload)
            return { offline: true }
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
          description: 'Data penjualan akan disinkronkan saat koneksi tersedia.',
        })
      } else {
        invalidateTransactionQueries(queryClient)
        toast.success('Transaksi penjualan berhasil disimpan!', {
          description: 'Data telah tersimpan ke Buku Kas.',
        })
      }
    },
    onError: onTransactionError('menyimpan transaksi'),
  })
}

type CreateExpenseArgs = { payload: Parameters<typeof createExpenseTransaction>[0] }
export const useCreateExpense = createTransactionMutation<CreateExpenseArgs, any>(
  ({ payload }) => createExpenseTransaction(payload),
  {
    successMessage: 'Pengeluaran berhasil dicatat!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'mencatat pengeluaran',
  },
)

type UpdateSaleArgs = { id: string; payload: Parameters<typeof updateSaleTransaction>[1] }
export const useUpdateSale = createTransactionMutation<UpdateSaleArgs, any>(
  ({ id, payload }) => updateSaleTransaction(id, payload),
  {
    successMessage: 'Transaksi penjualan berhasil diperbarui!',
    errorAction: 'memperbarui transaksi',
  },
)

type UpdateExpenseArgs = { id: string; payload: Parameters<typeof updateExpenseTransaction>[1] }
export const useUpdateExpense = createTransactionMutation<UpdateExpenseArgs, any>(
  ({ id, payload }) => updateExpenseTransaction(id, payload),
  {
    successMessage: 'Pengeluaran berhasil diperbarui!',
    errorAction: 'memperbarui pengeluaran',
  },
)

type UpdateStatusArgs = { id: string; status: 'sukses' | 'pending' }
export const useUpdateTransactionStatus = createTransactionMutation<UpdateStatusArgs, any>(
  ({ id, status }) => updateTransactionStatus(id, status),
  {
    successMessage: 'Status transaksi berhasil diperbarui!',
    errorAction: 'memperbarui status transaksi',
  },
)

export const useDeleteTransaction = createTransactionMutation<string, any>(
  (id) => deleteTransaction(id),
  {
    successMessage: 'Transaksi berhasil dihapus!',
    errorAction: 'menghapus transaksi',
  },
)
