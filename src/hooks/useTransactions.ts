import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { createOfflineMutation } from './useOfflineMutation'
import { useOfflinePendingItems } from './useOfflinePendingItems'
import { applyOptimisticUpdates } from '@/lib/optimistic-ui'
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
function invalidateTransactionQueries(queryClient: any) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
}

function transformOfflineTransactions(pendingItems: any[], user: any) {
  return pendingItems.map((item) => {
    const payload = item.payload.payload || item.payload
    return {
      id: `pending-${item.localId}`,
      transaction_at: item.createdAt,
      type: item.action === 'CREATE_SALE' ? 'penjualan' : 'pengeluaran',
      payment_method: payload.payment_method || 'tunai',
      status: payload.status || 'sukses',
      total_amount: payload.items?.reduce((sum: number, i: any) => sum + (i.selling_price * i.quantity), 0) || payload.total_amount || 0,
      notes: payload.notes || '',
      recorded_by: user?.id,
      profiles: {
        full_name: user?.user_metadata?.full_name || 'Kasir',
      },
      isOfflinePending: true, // Custom flag
      items: payload.items || [],
    } as any
  })
}

function useInjectedTransactions<T extends object>(result: T): T & { isOfflinePaused: boolean } {
  const user = useAuthStore((state) => state.user)
  const pendingItems = useOfflinePendingItems([
    'CREATE_SALE', 'CREATE_EXPENSE', 'UPDATE_SALE', 'UPDATE_EXPENSE', 'UPDATE_STATUS', 'DELETE_TRANSACTION'
  ])

  const res = result as any
  const isOfflinePaused = (res.isPending && res.fetchStatus === 'paused') || (res.isError && !res.data)

  if (!res.data) {
    return { ...result, isOfflinePaused }
  }

  const creates = pendingItems.filter(i => i.action === 'CREATE_SALE' || i.action === 'CREATE_EXPENSE')
  const offlineTransactions = transformOfflineTransactions(creates, user)

  let data = res.data

  if (data.pages) {
    // Infinite Query
    data = {
      ...data,
      pages: data.pages.map((page: any, index: number) => {
        let mergedData = index === 0 ? [...offlineTransactions, ...page.data] : page.data
        mergedData = applyOptimisticUpdates(mergedData, pendingItems, 'TRANSACTION')
        return { ...page, data: mergedData }
      })
    }
  } else if (data.data && Array.isArray(data.data)) {
    // Paginated structure
    data = {
      ...data,
      data: applyOptimisticUpdates([...offlineTransactions, ...data.data], pendingItems, 'TRANSACTION')
    }
  } else if (Array.isArray(data)) {
    // Flat array
    data = applyOptimisticUpdates([...offlineTransactions, ...data], pendingItems, 'TRANSACTION')
  }

  return { ...result, data, isOfflinePaused }
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

  return useInjectedTransactions(result)
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

  return useInjectedTransactions(result)
}

export function useTransactionSummary(
  filters: Pick<TransactionFilters, 'dateRange' | 'type' | 'recordedBy'> = {},
) {
  const user = useAuthStore((state) => state.user)
  const pendingItems = useOfflinePendingItems(['CREATE_SALE', 'CREATE_EXPENSE'])

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

  // Mix pending items into the summary optimistically
  let data = result.data
  if (data) {
    let extraSales = 0
    let extraSalesTunai = 0
    let extraSalesQris = 0
    let extraPendingQris = 0
    let extraExpenses = 0

    pendingItems.forEach(item => {
      const payload = item.payload.payload || item.payload
      const amt = payload.items?.reduce((sum: number, i: any) => sum + (i.selling_price * i.quantity), 0) || payload.total_amount || 0

      if (item.action === 'CREATE_SALE' && filters.type !== 'pengeluaran') {
        extraSales += amt
        if (payload.payment_method === 'tunai') extraSalesTunai += amt
        if (payload.payment_method === 'qris') {
          extraSalesQris += amt
          if (payload.status === 'pending') extraPendingQris += amt
        }
      } else if (item.action === 'CREATE_EXPENSE' && filters.type !== 'penjualan') {
        extraExpenses += amt
      }
    })

    data = {
      totalSales: data.totalSales + extraSales,
      totalSalesTunai: data.totalSalesTunai + extraSalesTunai,
      totalSalesQris: data.totalSalesQris + extraSalesQris,
      totalPendingQris: data.totalPendingQris + extraPendingQris,
      totalExpenses: data.totalExpenses + extraExpenses,
      totalProfit: data.totalProfit + extraSales - extraExpenses,
    }
  }

  return { ...result, data, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useTodayTransactions(recordedBy?: string) {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'today', recordedBy],
    queryFn: () => getTodayTransactions(recordedBy),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  })

  return useInjectedTransactions(result)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

type CreateSaleArgs = { payload: Parameters<typeof createSaleTransaction>[0] }
export const useCreateSale = createOfflineMutation<CreateSaleArgs, any>(
  'CREATE_SALE',
  async ({ payload }) => {
    // Ensure timestamp is recorded exactly when created if offline
    if (payload.transaction_at === undefined) {
      payload.transaction_at = nowIso()
    }
    return createSaleTransaction(payload)
  },
  {
    successMessage: 'Transaksi penjualan berhasil disimpan!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'menyimpan transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient)
  },
)

type CreateExpenseArgs = { payload: Parameters<typeof createExpenseTransaction>[0] }
export const useCreateExpense = createOfflineMutation<CreateExpenseArgs, any>(
  'CREATE_EXPENSE',
  async ({ payload }) => {
    if (payload.transaction_at === undefined) {
      payload.transaction_at = nowIso()
    }
    return createExpenseTransaction(payload)
  },
  {
    successMessage: 'Pengeluaran berhasil dicatat!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'mencatat pengeluaran',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient)
  },
)

type UpdateSaleArgs = { id: string; payload: Parameters<typeof updateSaleTransaction>[1] }
export const useUpdateSale = createOfflineMutation<UpdateSaleArgs, any>(
  'UPDATE_SALE',
  ({ id, payload }) => updateSaleTransaction(id, payload),
  {
    successMessage: 'Transaksi penjualan berhasil diperbarui!',
    errorAction: 'memperbarui transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient)
  },
)

type UpdateExpenseArgs = { id: string; payload: Parameters<typeof updateExpenseTransaction>[1] }
export const useUpdateExpense = createOfflineMutation<UpdateExpenseArgs, any>(
  'UPDATE_EXPENSE',
  ({ id, payload }) => updateExpenseTransaction(id, payload),
  {
    successMessage: 'Pengeluaran berhasil diperbarui!',
    errorAction: 'memperbarui pengeluaran',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient)
  },
)

type UpdateStatusArgs = { id: string; status: 'sukses' | 'pending' }
export const useUpdateTransactionStatus = createOfflineMutation<UpdateStatusArgs, any>(
  'UPDATE_STATUS',
  (payload) => updateTransactionStatus(payload.id, payload.status),
  {
    successMessage: 'Status transaksi berhasil diperbarui!',
    errorAction: 'memperbarui status transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient)
  },
)

type DeleteTransactionArgs = { id: string }
export const useDeleteTransaction = createOfflineMutation<DeleteTransactionArgs, any>(
  'DELETE_TRANSACTION',
  (payload) => deleteTransaction(payload.id),
  {
    successMessage: 'Transaksi berhasil dihapus!',
    errorAction: 'menghapus transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient)
  },
)
