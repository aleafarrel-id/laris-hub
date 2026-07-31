import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import {
  createExpenseTransaction,
  createSaleTransaction,
  deleteTransaction,
  getTodayTransactions,
  getTransactions,
  updateExpenseTransaction,
  updateSaleTransaction,
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

export function useTransactions(filters: TransactionFilters = {}) {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, filters],
    queryFn: () => getTransactions(filters),
    staleTime: 1000 * 30, // 30s - transactions change frequently
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
export const useCreateSale = createTransactionMutation<CreateSaleArgs, any>(
  ({ payload }) => createSaleTransaction(payload),
  {
    successMessage: 'Transaksi penjualan berhasil disimpan!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'menyimpan transaksi',
  },
)

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

export const useDeleteTransaction = createTransactionMutation<string, any>(
  (id) => deleteTransaction(id),
  {
    successMessage: 'Transaksi berhasil dihapus!',
    errorAction: 'menghapus transaksi',
  },
)
