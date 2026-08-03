import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { QUERY_KEYS } from '@/lib/constants'
import type { OfflineQueueItem } from '@/lib/offline-queue'
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
import type { TransactionFilters, TransactionWithItems } from '@/types'
import { createOfflineMutation } from './useOfflineMutation'
import { useOfflinePendingItems } from './useOfflinePendingItems'

// Private Helpers

/** Invalidate all data that depends on transaction changes. */
function invalidateTransactionQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
}

function transformOfflineTransactions(
  pendingItems: OfflineQueueItem<Record<string, unknown>>[],
  user: { id?: string; user_metadata?: { full_name?: string } } | null,
): TransactionWithItems[] {
  return pendingItems.map((item) => {
    const payload = (item.payload.payload || item.payload) as Record<string, unknown>
    const items = (payload.items as Array<{ selling_price: number; quantity: number }>) || []
    return {
      id: `pending-${item.localId}`,
      transaction_at: item.createdAt,
      type: item.action === 'CREATE_SALE' ? 'sale' : 'expense',
      payment_method: (payload.payment_method as string) || 'cash',
      status: (payload.status as string) || 'success',
      total_amount:
        items.reduce((sum, i) => sum + (i.selling_price || 0) * (i.quantity || 1), 0) ||
        (payload.total_amount as number) ||
        0,
      notes: (payload.notes as string) || '',
      description: (payload.description as string) || '',
      expense_category: (payload.expense_category as string) || '',
      expense_items: (payload.expense_items as any) || [],
      recorded_by: user?.id || '',
      profiles: {
        full_name: user?.user_metadata?.full_name || 'Cashier',
      },
      isOfflinePending: true,
      items: (payload.items as any) || [],
    } as unknown as TransactionWithItems
  })
}

function useInjectedTransactions<
  T extends { isPending?: boolean; fetchStatus?: string; isError?: boolean; data?: unknown },
>(result: T, emptyFallback: any): T & { isOfflinePaused: boolean } {
  const user = useAuthStore((state) => state.user)
  const pendingItems = useOfflinePendingItems([
    'CREATE_SALE',
    'CREATE_EXPENSE',
    'UPDATE_SALE',
    'UPDATE_EXPENSE',
    'UPDATE_STATUS',
    'DELETE_TRANSACTION',
  ])

  const isOfflinePaused = Boolean(
    (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data),
  )

  const data = useMemo(() => {
    const creates = pendingItems.filter(
      (i) => i.action === 'CREATE_SALE' || i.action === 'CREATE_EXPENSE',
    )
    const offlineTransactions = transformOfflineTransactions(
      creates as OfflineQueueItem<Record<string, unknown>>[],
      user,
    )

    let currentData = (result.data || emptyFallback) as Record<string, unknown>

    if (currentData.pages && Array.isArray(currentData.pages)) {
      currentData = {
        ...currentData,
        pages: currentData.pages.map((page: { data: TransactionWithItems[] }, index: number) => {
          let mergedData = index === 0 ? [...offlineTransactions, ...page.data] : page.data
          mergedData = applyOptimisticUpdates(mergedData, pendingItems, 'TRANSACTION')
          return { ...page, data: mergedData }
        }),
      }
    } else if (currentData.data && Array.isArray(currentData.data)) {
      currentData = {
        ...currentData,
        data: applyOptimisticUpdates(
          [...offlineTransactions, ...(currentData.data as TransactionWithItems[])],
          pendingItems,
          'TRANSACTION',
        ),
      }
    } else if (Array.isArray(currentData)) {
      currentData = applyOptimisticUpdates(
        [...offlineTransactions, ...(currentData as unknown as TransactionWithItems[])],
        pendingItems,
        'TRANSACTION',
      ) as unknown as Record<string, unknown>
    }

    return currentData
  }, [result.data, pendingItems, user])

  return { ...result, data, isOfflinePaused }
}

// Queries

export function useTransactions(filters: TransactionFilters = {}, page = 1, pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, filters, page, pageSize],
    queryFn: () => getTransactions(filters, page, pageSize),
    placeholderData: keepPreviousData,
  })

  return useInjectedTransactions(result, { data: [], nextPage: null })
}

export function useInfiniteTransactions(filters: TransactionFilters = {}, pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  const result = useInfiniteQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'infinite', filters, pageSize],
    queryFn: ({ pageParam = 1 }) => getTransactions(filters, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  })

  return useInjectedTransactions(result, { pages: [{ data: [], nextPage: null }], pageParams: [1] })
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
        totalSales: filters.type === 'expense' ? 0 : kpi.revenue,
        totalSalesTunai: filters.type === 'expense' ? 0 : (kpi.revenueCash ?? 0),
        totalSalesQris: filters.type === 'expense' ? 0 : (kpi.revenueQris ?? 0),
        totalPendingQris: filters.type === 'expense' ? 0 : (kpi.pendingQris ?? 0),
        totalExpenses: filters.type === 'sale' ? 0 : kpi.expense,
        totalProfit: filters.type === 'expense' ? 0 : kpi.profit,
      }
    },
  })

  const data = useMemo(() => {
    let currentData = result.data
    if (currentData) {
      let extraSales = 0
      let extraSalesTunai = 0
      let extraSalesQris = 0
      let extraPendingQris = 0
      let extraExpenses = 0
      let extraProfit = 0

      pendingItems.forEach((item) => {
        const payload = item.payload.payload || item.payload
        const amt =
          payload.items?.reduce((sum: number, i: any) => sum + i.selling_price * i.quantity, 0) ||
          payload.total_amount ||
          0

        const profit =
          payload.items?.reduce(
            (sum: number, i: any) => sum + (i.selling_price - (i.product_hpp || 0)) * i.quantity,
            0,
          ) || 0

        if (filters.type && filters.type !== 'all') {
          if (filters.type === 'sale') {
            extraSales += amt
            extraProfit += profit
            if (payload.payment_method === 'cash') extraSalesTunai += amt
            if (payload.payment_method === 'qris') {
              extraSalesQris += amt
              if (payload.status === 'pending') extraPendingQris += amt
            }
          } else if (filters.type === 'expense') {
            extraExpenses += amt
          }
        }
      })

      currentData = {
        totalSales: currentData.totalSales + extraSales,
        totalSalesTunai: currentData.totalSalesTunai + extraSalesTunai,
        totalSalesQris: currentData.totalSalesQris + extraSalesQris,
        totalPendingQris: currentData.totalPendingQris + extraPendingQris,
        totalExpenses: currentData.totalExpenses + extraExpenses,
        totalProfit: currentData.totalProfit + extraProfit,
      }
    }
    return currentData
  }, [result.data, pendingItems, filters.type])

  return {
    ...result,
    data,
    isOfflinePaused:
      (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data),
  }
}

export function useTodayTransactions(recordedBy?: string) {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.TRANSACTIONS, 'today', recordedBy],
    queryFn: () => getTodayTransactions(recordedBy),
    refetchInterval: 1000 * 60,
  })

  return useInjectedTransactions(result, [])
}

// Mutations

type CreateSaleArgs = { payload: Parameters<typeof createSaleTransaction>[0] }
export const useCreateSale = createOfflineMutation<CreateSaleArgs, unknown>(
  'CREATE_SALE',
  async ({ payload }) => {
    // Ensure timestamp is recorded exactly when created (if offline)
    if (payload.transaction_at === undefined) {
      payload.transaction_at = nowIso()
    }
    return createSaleTransaction(payload)
  },
  {
    successMessage: 'Transaksi penjualan berhasil disimpan!',
    successDescription: 'Data telah tersimpan ke Buku Kas.',
    errorAction: 'menyimpan transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient),
  },
)

type CreateExpenseArgs = { payload: Parameters<typeof createExpenseTransaction>[0] }
export const useCreateExpense = createOfflineMutation<CreateExpenseArgs, unknown>(
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
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient),
  },
)

type UpdateSaleArgs = { id: string; payload: Parameters<typeof updateSaleTransaction>[1] }
export const useUpdateSale = createOfflineMutation<UpdateSaleArgs, unknown>(
  'UPDATE_SALE',
  ({ id, payload }) => updateSaleTransaction(id, payload),
  {
    successMessage: 'Transaksi penjualan berhasil diperbarui!',
    errorAction: 'memperbarui transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient),
  },
)

type UpdateExpenseArgs = { id: string; payload: Parameters<typeof updateExpenseTransaction>[1] }
export const useUpdateExpense = createOfflineMutation<UpdateExpenseArgs, unknown>(
  'UPDATE_EXPENSE',
  ({ id, payload }) => updateExpenseTransaction(id, payload),
  {
    successMessage: 'Pengeluaran berhasil diperbarui!',
    errorAction: 'memperbarui pengeluaran',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient),
  },
)

type UpdateStatusArgs = { id: string; status: 'success' | 'pending' }
export const useUpdateTransactionStatus = createOfflineMutation<UpdateStatusArgs, unknown>(
  'UPDATE_STATUS',
  (payload) => updateTransactionStatus(payload.id, payload.status),
  {
    successMessage: 'Status transaksi berhasil diperbarui!',
    errorAction: 'memperbarui status transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient),
  },
)

type DeleteTransactionArgs = { id: string }
export const useDeleteTransaction = createOfflineMutation<DeleteTransactionArgs, unknown>(
  'DELETE_TRANSACTION',
  (payload) => deleteTransaction(payload.id),
  {
    successMessage: 'Transaksi berhasil dihapus!',
    errorAction: 'menghapus transaksi',
    onSuccess: (_data, _vars, queryClient) => invalidateTransactionQueries(queryClient),
  },
)
