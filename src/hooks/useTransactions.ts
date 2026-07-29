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
import { useAuthStore } from '@/store/auth.store'
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
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: (data: SaleTransactionFormData) => {
      if (!user) throw new Error('Belum login')
      return createSaleTransaction(
        { items: data.items, notes: data.notes, transaction_at: data.transaction_at },
        user.id,
      )
    },
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
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: (data: ExpenseTransactionFormData) => {
      if (!user) throw new Error('Belum login')
      return createExpenseTransaction(
        {
          description: data.description,
          total_amount: data.total_amount,
          expense_category: data.expense_category,
          notes: data.notes,
          transaction_at: data.transaction_at,
        },
        user.id,
      )
    },
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
  recordedBy: string
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload, recordedBy }: CreateSaleArgs) =>
      createSaleTransaction(payload, recordedBy),
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
  recordedBy: string
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload, recordedBy }: CreateExpenseArgs) =>
      createExpenseTransaction(payload, recordedBy),
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
