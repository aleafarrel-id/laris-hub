import type { QueryClient } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
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

// ─── Mutations ────────────────────────────────────────────────────────────────

type CreateSaleArgs = {
  payload: Parameters<typeof createSaleTransaction>[0]
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    // Security: recordedBy fetched from session inside service, not passed as arg
    mutationFn: ({ payload }: CreateSaleArgs) => createSaleTransaction(payload),
    onSuccess: () => {
      invalidateTransactionQueries(queryClient)
      toast.success('Transaksi penjualan berhasil disimpan!', {
        description: 'Data telah tersimpan ke Buku Kas.',
      })
    },
    onError: onTransactionError('menyimpan transaksi'),
  })
}

type CreateExpenseArgs = {
  payload: Parameters<typeof createExpenseTransaction>[0]
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    // Security: recordedBy fetched from session inside service, not passed as arg
    mutationFn: ({ payload }: CreateExpenseArgs) => createExpenseTransaction(payload),
    onSuccess: () => {
      invalidateTransactionQueries(queryClient)
      toast.success('Pengeluaran berhasil dicatat!', {
        description: 'Data telah tersimpan ke Buku Kas.',
      })
    },
    onError: onTransactionError('mencatat pengeluaran'),
  })
}

type UpdateSaleArgs = {
  id: string
  payload: Parameters<typeof updateSaleTransaction>[1]
}

export function useUpdateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateSaleArgs) => updateSaleTransaction(id, payload),
    onSuccess: () => {
      invalidateTransactionQueries(queryClient)
      toast.success('Transaksi penjualan berhasil diperbarui!')
    },
    onError: onTransactionError('memperbarui transaksi'),
  })
}

type UpdateExpenseArgs = {
  id: string
  payload: Parameters<typeof updateExpenseTransaction>[1]
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateExpenseArgs) => updateExpenseTransaction(id, payload),
    onSuccess: () => {
      invalidateTransactionQueries(queryClient)
      toast.success('Pengeluaran berhasil diperbarui!')
    },
    onError: onTransactionError('memperbarui pengeluaran'),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      invalidateTransactionQueries(queryClient)
      toast.success('Transaksi berhasil dihapus!')
    },
    onError: (error) => toast.error(translateError(error)),
  })
}
