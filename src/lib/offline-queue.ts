import { del, get, update } from 'idb-keyval'
import type { CreateExpensePayload } from '@/services/expense.service'
import type { CreateSalePayload } from '@/services/sale.service'
import type { ProductFormData } from '@/lib/validations/product.schema'
import type {
  CreateKasirPayload,
  UpdateKasirPayload as KasirUpdateType,
} from '@/services/kasir-management.service'
import type { Profile } from '@/types'

const QUEUE_KEY = 'laris-hub:offline-transaction-queue'

export type OfflineQueueAction =
  | 'CREATE_SALE'
  | 'CREATE_EXPENSE'
  | 'UPDATE_SALE'
  | 'UPDATE_EXPENSE'
  | 'UPDATE_STATUS'
  | 'DELETE_TRANSACTION'
  | 'CREATE_KASIR'
  | 'UPDATE_KASIR'
  | 'DELETE_KASIR'
  | 'TOGGLE_KASIR'
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'TOGGLE_PRODUCT'
  | 'UPDATE_PROFILE'
  | 'UPDATE_OWN_CREDENTIALS'

export interface OfflineQueueItem<T = unknown> {
  localId: string
  createdAt: string
  action: OfflineQueueAction
  payload: T
  retryCount: number
}

// Payload types
export type OfflineSalePayload = CreateSalePayload
export type OfflineExpensePayload = CreateExpensePayload
export type OfflineUpdateStatusPayload = { id: string; status: 'sukses' | 'pending' }
export type OfflineDeletePayload = { id: string }
export type OfflineCreateKasirPayload = CreateKasirPayload
export type OfflineUpdateKasirPayload = KasirUpdateType
export type OfflineToggleKasirPayload = { id: string; isActive: boolean }
export type OfflineCreateProductPayload = ProductFormData
export type OfflineUpdateProductPayload = { id: string; data: ProductFormData }
export type OfflineToggleProductPayload = { id: string; isActive: boolean }
export type OfflineUpdateProfilePayload = { id: string; updates: Partial<Profile> }

/** Retrieve all queued offline transactions. */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    return (await get<OfflineQueueItem[]>(QUEUE_KEY)) ?? []
  } catch {
    return []
  }
}

function dispatchUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('offline-queue-updated'))
  }
}

/** Add a new transaction action to the offline queue. */
export async function enqueueOfflineItem<T>(
  action: OfflineQueueAction,
  payload: T,
): Promise<OfflineQueueItem<T>> {
  const item: OfflineQueueItem<T> = {
    localId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    action,
    payload,
    retryCount: 0,
  }

  try {
    await update<OfflineQueueItem[]>(QUEUE_KEY, (val) => {
      const queue = val || []
      queue.push(item)
      return queue
    })
    dispatchUpdateEvent()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      throw new Error('Penyimpanan perangkat penuh. Tidak dapat menyimpan transaksi offline.')
    }
    throw new Error('Gagal menyimpan ke penyimpanan offline perangkat.')
  }

  return item
}

/** Remove an item from the queue after successful sync. */
export async function dequeueOfflineItem(localId: string): Promise<void> {
  await update<OfflineQueueItem[]>(QUEUE_KEY, (val) => {
    const queue = val || []
    return queue.filter((item) => item.localId !== localId)
  })
  dispatchUpdateEvent()
}

/** Increment retry count for an item. */
export async function incrementRetryCount(localId: string): Promise<void> {
  await update<OfflineQueueItem[]>(QUEUE_KEY, (val) => {
    const queue = val || []
    return queue.map((item) =>
      item.localId === localId ? { ...item, retryCount: item.retryCount + 1 } : item,
    )
  })
  dispatchUpdateEvent()
}

/** Clear the entire queue (e.g. on logout). */
export async function clearOfflineQueue(): Promise<void> {
  await del(QUEUE_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('offline-queue-updated'))
  }
}

/** Check if there are any pending items in the queue. */
export async function hasOfflinePendingItems(): Promise<boolean> {
  const queue = await getOfflineQueue()
  return (queue?.length ?? 0) > 0
}
