/**
 * useOfflineSync.ts
 *
 * Handles syncing of the offline transaction queue to Supabase.
 *
 * Workflow:
 * - Checks the `offline-queue` when connectivity is restored.
 * - Attempts to sync each item to Supabase based on its action type.
 * - On success, removes the item from the queue.
 * - On failure, increments the retry count and retries on the next connection.
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
import { updateAdminCredentials, updateProfile } from '@/services/auth.service'
import {
  createCashier,
  deleteCashier,
  toggleCashierStatus,
  updateCashier,
} from '@/services/cashier-management.service'
import {
  createProduct,
  deleteProduct,
  deleteStorageImage,
  toggleProductStatus,
  updateProduct,
  uploadProductImage,
} from '@/services/product.service'
import {
  createExpenseTransaction,
  createSaleTransaction,
  deleteTransaction,
  updateExpenseTransaction,
  updateSaleTransaction,
  updateTransactionStatus,
} from '@/services/transaction.service'

const MAX_RETRIES = 3
const SYNC_LOCK_KEY = 'laris-hub:sync-lock'
const SYNC_LOCK_TTL_MS = 30_000 // 30s timeout prevents stale locks

export interface OfflineSyncStatus {
  pendingCount: number
  isSyncing: boolean
  triggerSync: () => void
}

export function useOfflineSync(isOnline: boolean): OfflineSyncStatus {
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const isSyncingRef = useRef(false)

  const refreshPendingCount = useCallback(async () => {
    const queue = await getOfflineQueue()
    setPendingCount(queue?.length ?? 0)
  }, [])

  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current) return

    const existingLock = localStorage.getItem(SYNC_LOCK_KEY)
    if (existingLock && Date.now() - parseInt(existingLock, 10) < SYNC_LOCK_TTL_MS) return
    localStorage.setItem(SYNC_LOCK_KEY, Date.now().toString())

    const queue = await getOfflineQueue()
    if ((queue?.length ?? 0) === 0) {
      localStorage.removeItem(SYNC_LOCK_KEY)
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

    let successCount = 0
    const failedItems: OfflineQueueItem[] = []

    try {
      for (const item of queue) {
        if (item.retryCount >= MAX_RETRIES) {
          console.error('[OfflineSync] Max retries reached for item:', item)
          await dequeueOfflineItem(item.localId)
          failedItems.push(item)
          // Notify the user so they know this specific action was not saved —
          // without exposing any internal action name or technical details.
          toast.warning('Satu tindakan tidak dapat disimpan', {
            description:
              'Gagal menyinkronkan setelah beberapa kali percobaan. Tindakan ini telah dibatalkan.',
            duration: 6000,
          })
          continue
        }

        try {
          switch (item.action) {
            case 'CREATE_SALE':
              await createSaleTransaction(
                (item.payload as { payload: Parameters<typeof createSaleTransaction>[0] }).payload,
              )
              break
            case 'CREATE_EXPENSE':
              await createExpenseTransaction(
                (item.payload as { payload: Parameters<typeof createExpenseTransaction>[0] }).payload,
              )
              break
            case 'UPDATE_SALE':
              await updateSaleTransaction(
                (item.payload as { id: string; payload: Parameters<typeof updateSaleTransaction>[1] })
                  .id,
                (item.payload as { payload: Parameters<typeof updateSaleTransaction>[1] }).payload,
              )
              break
            case 'UPDATE_EXPENSE':
              await updateExpenseTransaction(
                (
                  item.payload as {
                    id: string
                    payload: Parameters<typeof updateExpenseTransaction>[1]
                  }
                ).id,
                (item.payload as { payload: Parameters<typeof updateExpenseTransaction>[1] }).payload,
              )
              break
            case 'UPDATE_STATUS':
              await updateTransactionStatus(
                (item.payload as { id: string }).id,
                (item.payload as { status: 'success' | 'pending' }).status,
              )
              break
            case 'DELETE_TRANSACTION':
              await deleteTransaction((item.payload as { id: string }).id)
              break
            case 'CREATE_CASHIER':
              await createCashier(item.payload as Parameters<typeof createCashier>[0])
              break
            case 'UPDATE_CASHIER':
              await updateCashier(item.payload as Parameters<typeof updateCashier>[0])
              break
            case 'DELETE_CASHIER':
              await deleteCashier(item.payload as string)
              break
            case 'TOGGLE_CASHIER':
              await toggleCashierStatus(
                (item.payload as { id: string }).id,
                (item.payload as { isActive: boolean }).isActive,
              )
              break
            case 'CREATE_PRODUCT': {
              const p = item.payload as Parameters<typeof createProduct>[0]
              let uploadedUrl: string | null = null
              if (p?.image_url?.startsWith('data:image')) {
                const file = dataUrlToFile(p.image_url, `offline-sync-${Date.now()}.jpg`)
                uploadedUrl = await uploadProductImage(file)
                p.image_url = uploadedUrl
              }
              try {
                await createProduct(p)
              } catch (err) {
                if (uploadedUrl) {
                  await deleteStorageImage(uploadedUrl).catch(console.error)
                }
                throw err
              }
              break
            }
            case 'UPDATE_PRODUCT': {
              const p = item.payload as { id: string; data: Parameters<typeof updateProduct>[1] }
              let uploadedUrl: string | null = null
              if (p?.data?.image_url?.startsWith('data:image')) {
                const file = dataUrlToFile(p.data.image_url, `offline-sync-${Date.now()}.jpg`)
                uploadedUrl = await uploadProductImage(file)
                p.data.image_url = uploadedUrl
              }
              try {
                await updateProduct(p.id, p.data)
              } catch (err) {
                if (uploadedUrl) {
                  await deleteStorageImage(uploadedUrl).catch(console.error)
                }
                throw err
              }
              break
            }
            case 'DELETE_PRODUCT':
              await deleteProduct(item.payload as string)
              break
            case 'TOGGLE_PRODUCT':
              await toggleProductStatus(
                (item.payload as { id: string }).id,
                (item.payload as { isActive: boolean }).isActive,
              )
              break
            case 'UPDATE_PROFILE':
              await updateProfile(
                (item.payload as { id: string }).id,
                (item.payload as { updates: Parameters<typeof updateProfile>[1] }).updates,
              )
              break
            case 'UPDATE_OWN_CREDENTIALS':
              await updateAdminCredentials(
                item.payload as Parameters<typeof updateAdminCredentials>[0],
              )
              break
            default:
              console.warn('[OfflineSync] Unknown action:', item.action)
          }
          await dequeueOfflineItem(item.localId)
          successCount++
        } catch (err: any) {
          const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine
          const isPgError = err?.code?.startsWith('22')
          const errMessage = (err?.message || '').toLowerCase()
          const isNetworkError =
            isBrowserOffline ||
            err instanceof TypeError ||
            err?.name === 'AbortError' ||
            err?.name === 'TimeoutError' ||
            errMessage.includes('fetch') ||
            errMessage.includes('network') ||
            errMessage.includes('failed to fetch') ||
            errMessage.includes('load failed') ||
            errMessage.includes('timeout')

          const isDefinitiveRejection =
            isPgError || (errMessage && !isNetworkError && err?.status >= 400 && err?.status < 500)

          if (isDefinitiveRejection) {
            console.error('[OfflineSync] Permanent error for item:', item, err)
            await dequeueOfflineItem(item.localId)
            failedItems.push(item)
            // Notify the user that this action was permanently rejected by the
            // server (e.g. validation failure, 4xx). It cannot be retried.
            toast.warning('Satu tindakan tidak dapat disimpan', {
              description:
                'Tindakan ditolak oleh server dan tidak dapat diulang. Data ini telah dihapus dari antrean.',
              duration: 6000,
            })
          } else if (isNetworkError) {
            console.log('[OfflineSync] Network error, keeping in queue:', item.localId)
          } else {
            console.warn('[OfflineSync] Transient error for item, will retry:', item.localId, err)
            await incrementRetryCount(item.localId)
          }
        }
      }

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

      // Per-item failure toasts are shown individually inside the loop above
      // when an item reaches MAX_RETRIES, so no duplicate summary is needed here.
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
      localStorage.removeItem(SYNC_LOCK_KEY)
      await refreshPendingCount()
    }
  }, [queryClient, refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()
    if (isOnline) {
      syncQueue()
    }
  }, [isOnline, syncQueue, refreshPendingCount])

  return {
    pendingCount,
    isSyncing,
    triggerSync: syncQueue,
  }
}

export async function clearSyncQueue(): Promise<void> {
  await clearOfflineQueue()
}
