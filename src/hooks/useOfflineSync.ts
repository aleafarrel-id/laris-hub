/**
 * useOfflineSync.ts
 *
 * Handles syncing of the offline transaction queue to Supabase.
 *
 * Workflow:
 * 1. Checks the `offline-queue` when connectivity is restored.
 * 2. Attempts to sync each item to Supabase.
 * 3. On success, removes the item from the queue.
 * 4. On failure, increments the retry count and retries on the next connection.
 *
 * Note: Acts as a safety net alongside React Query's built-in pause/resume mutations.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  clearOfflineQueue,
  dequeueOfflineSale,
  getOfflineQueue,
  incrementRetryCount,
} from '@/lib/offline-queue'
import { createSaleTransaction } from '@/services/sale.service'
import { QUERY_KEYS } from '@/lib/constants'
import type { OfflineSaleItem } from '@/lib/offline-queue'

const MAX_RETRIES = 3

export interface OfflineSyncStatus {
  /** Jumlah item yang sedang menunggu sinkronisasi */
  pendingCount: number
  /** Apakah sedang dalam proses sinkronisasi */
  isSyncing: boolean
  /** Fungsi untuk memicu sync secara manual */
  triggerSync: () => void
}

export function useOfflineSync(isOnline: boolean): OfflineSyncStatus {
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const isSyncingRef = useRef(false)

  // Update pendingCount from IndexedDB
  const refreshPendingCount = useCallback(async () => {
    const queue = await getOfflineQueue()
    setPendingCount(queue.length)
  }, [])

  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current) return
    const queue = await getOfflineQueue()
    if (queue.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)

    let successCount = 0
    const failedItems: OfflineSaleItem[] = []

    for (const item of queue) {
      if (item.retryCount >= MAX_RETRIES) {
        // Exceeded max retries, skip
        failedItems.push(item)
        continue
      }

      try {
        await createSaleTransaction(item.payload)
        await dequeueOfflineSale(item.localId)
        successCount++
      } catch {
        await incrementRetryCount(item.localId)
        failedItems.push(item)
      }
    }

    // Refresh all transaction queries
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })

      toast.success(
        `${successCount} transaksi offline berhasil disinkronkan!`,
        {
          description: 'Data penjualan telah tersimpan ke database.',
        },
      )
    }

    if (failedItems.length > 0) {
      toast.warning(`${failedItems.length} transaksi gagal disinkronkan`, {
        description: 'Akan dicoba kembali saat koneksi tersedia.',
      })
    }

    isSyncingRef.current = false
    setIsSyncing(false)
    await refreshPendingCount()
  }, [queryClient, refreshPendingCount])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncQueue()
    }
    refreshPendingCount()
  }, [isOnline, syncQueue, refreshPendingCount])

  // Check pending count on initial mount
  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  return {
    pendingCount,
    isSyncing,
    triggerSync: syncQueue,
  }
}

/** Clear all queues (used on logout) */
export async function clearSyncQueue(): Promise<void> {
  await clearOfflineQueue()
}
