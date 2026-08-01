/**
 * useOfflineSync.ts
 *
 * Handles syncing of the offline transaction queue to Supabase.
 *
 * Workflow:
 * 1. Checks the `offline-queue` when connectivity is restored.
 * 2. Attempts to sync each item to Supabase based on its action type.
 * 3. On success, removes the item from the queue.
 * 4. On failure, increments the retry count and retries on the next connection.
 *
 * Note: Acts as a safety net alongside React Query's built-in pause/resume mutations.
 */

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import type { OfflineQueueItem } from '@/lib/offline-queue'
import {
  clearOfflineQueue,
  dequeueOfflineItem,
  getOfflineQueue,
  incrementRetryCount,
} from '@/lib/offline-queue'
import { dataUrlToFile } from '@/lib/utils'
import {
  createExpenseTransaction,
  createSaleTransaction,
  deleteTransaction,
  updateExpenseTransaction,
  updateSaleTransaction,
  updateTransactionStatus,
} from '@/services/transaction.service'
import {
  createKasir,
  updateKasir,
  deleteKasir,
  toggleKasirStatus
} from '@/services/kasir-management.service'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  uploadProductImage,
} from '@/services/product.service'
import { updateProfile } from '@/services/auth.service'

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
    const failedItems: OfflineQueueItem[] = []

    for (const item of queue) {
      if (item.retryCount >= MAX_RETRIES) {
        // Exceeded max retries, dequeue permanently
        console.error('[OfflineSync] Max retries reached for item:', item)
        await dequeueOfflineItem(item.localId)
        failedItems.push(item)
        continue
      }

      try {
        switch (item.action) {
          case 'CREATE_SALE':
            await createSaleTransaction(item.payload.payload)
            break
          case 'CREATE_EXPENSE':
            await createExpenseTransaction(item.payload.payload)
            break
          case 'UPDATE_SALE':
            await updateSaleTransaction(item.payload.id, item.payload.payload)
            break
          case 'UPDATE_EXPENSE':
            await updateExpenseTransaction(item.payload.id, item.payload.payload)
            break
          case 'UPDATE_STATUS':
            await updateTransactionStatus(item.payload.id, item.payload.status)
            break
          case 'DELETE_TRANSACTION':
            await deleteTransaction(item.payload.id)
            break
          case 'CREATE_KASIR':
            await createKasir(item.payload)
            break
          case 'UPDATE_KASIR':
            await updateKasir(item.payload)
            break
          case 'DELETE_KASIR':
            await deleteKasir(item.payload)
            break
          case 'TOGGLE_KASIR':
            await toggleKasirStatus(item.payload.id, item.payload.isActive)
            break
          case 'CREATE_PRODUCT':
            if (item.payload?.image_url?.startsWith('data:image')) {
              const file = dataUrlToFile(item.payload.image_url, `offline-sync-${Date.now()}.jpg`)
              item.payload.image_url = await uploadProductImage(file)
            }
            await createProduct(item.payload)
            break
          case 'UPDATE_PRODUCT':
            if (item.payload?.data?.image_url?.startsWith('data:image')) {
              const file = dataUrlToFile(item.payload.data.image_url, `offline-sync-${Date.now()}.jpg`)
              item.payload.data.image_url = await uploadProductImage(file)
            }
            await updateProduct(item.payload.id, item.payload.data)
            break
          case 'DELETE_PRODUCT':
            await deleteProduct(item.payload)
            break
          case 'TOGGLE_PRODUCT':
            await toggleProductStatus(item.payload.id, item.payload.isActive)
            break
          case 'UPDATE_PROFILE':
            await updateProfile(item.payload.id, item.payload.updates)
            break
          default:
            console.warn('[OfflineSync] Unknown action:', item.action)
        }
        await dequeueOfflineItem(item.localId)
        successCount++
      } catch (err: any) {
        // Detect permanent backend errors (PostgreSQL exceptions OR explicit error messages from Edge Functions/RPCs)
        const isPgError = err?.code && err.code.startsWith('22')
        const isBackendRejection = err?.message && !err.message.includes('fetch') && !err.message.includes('network')

        if (isPgError || isBackendRejection) {
          console.error('[OfflineSync] Permanent error for item:', item, err)
          await dequeueOfflineItem(item.localId)
          failedItems.push(item) // Track it so we can notify the user that it was dropped
        } else {
          await incrementRetryCount(item.localId)
          // Don't add to failedItems immediately if we are still retrying, 
          // wait until it exhausts retries to notify user.
          // Wait, actually, if it's a network error during sync, we can just say "pending".
        }
      }
    }

    // Refresh queries
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASHIERS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE })

      toast.success(`${successCount} tindakan offline berhasil disinkronkan!`, {
        description: 'Data telah tersimpan ke database.',
      })
    }

    if (failedItems.length > 0) {
      toast.error(`${failedItems.length} tindakan batal disinkronkan`, {
        description: 'Tindakan ditolak oleh server atau melebihi batas percobaan. Data tersebut telah dihapus dari antrean.',
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
