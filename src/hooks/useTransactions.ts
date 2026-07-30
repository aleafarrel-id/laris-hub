import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import type {
  ExpenseTransactionFormData,
  SaleTransactionFormData,
} from '@/lib/validations/transaction.schema'
import {
  createExpenseTransaction,
  createSaleTransaction,
  deleteTransaction,
  getTodayTransactions,
  getTransactions,
  updateTransaction,
} from '@/services/transaction.service'
import type { TransactionFilters } from '@/types'

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRANSACTIONS, filters],
    queryFn: () => getTransactions(filters),
    staleTime: 1000 * 30, // 30s — transactions change frequently
  })
}

export function useTodayTransactions(recordedBy?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'today', recordedBy],
    queryFn: () => getTodayTransactions(recordedBy),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  })
}

export function useCreateSaleTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaleTransactionFormData) =>
      // Security: recordedBy is now fetched inside the service from the live session,
      // preventing any client-side IDOR spoofing.
      createSaleTransaction({
        items: data.items,
        notes: data.notes,
        transaction_at: data.transaction_at,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Transaksi penjualan berhasil disimpan!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

export function useCreateExpenseTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExpenseTransactionFormData) =>
      // Security: recordedBy is now fetched inside the service from the live session.
      createExpenseTransaction({
        description: data.description,
        total_amount: data.total_amount,
        expense_category: data.expense_category,
        notes: data.notes,
        transaction_at: data.transaction_at,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Pengeluaran berhasil dicatat!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTransaction>[1] }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Transaksi berhasil diperbarui!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Transaksi berhasil dihapus!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

type CreateSaleArgs = {
  payload: Parameters<typeof createSaleTransaction>[0]
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload }: CreateSaleArgs) =>
      // Security: recordedBy fetched from session inside service
      createSaleTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Transaksi penjualan berhasil disimpan!', {
        description: 'Data telah tersimpan ke Buku Kas.',
      })
    },
    onError: (error) => {
      toast.error('Gagal menyimpan transaksi', {
        description: translateError(error),
      })
    },
  })
}

type CreateExpenseArgs = {
  payload: Parameters<typeof createExpenseTransaction>[0]
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload }: CreateExpenseArgs) =>
      // Security: recordedBy fetched from session inside service
      createExpenseTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      toast.success('Pengeluaran berhasil dicatat!', {
        description: 'Data telah tersimpan ke Buku Kas.',
      })
    },
    onError: (error) => {
      toast.error('Gagal mencatat pengeluaran', {
        description: translateError(error),
      })
    },
  })
}
