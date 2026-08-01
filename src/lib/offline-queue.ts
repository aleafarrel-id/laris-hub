import { del, get, set } from 'idb-keyval'
import type { CreateSalePayload } from '@/services/sale.service'

const QUEUE_KEY = 'laris-hub:offline-sale-queue'

export interface OfflineSaleItem {
  localId: string
  createdAt: string
  payload: CreateSalePayload
  retryCount: number
}

/** Retrieve all queued offline transactions. */
export async function getOfflineQueue(): Promise<OfflineSaleItem[]> {
  try {
    return (await get<OfflineSaleItem[]>(QUEUE_KEY)) ?? []
  } catch {
    return []
  }
}

/** Add a new transaction to the offline queue. */
export async function enqueueOfflineSale(
  payload: OfflineSaleItem['payload'],
): Promise<OfflineSaleItem> {
  const item: OfflineSaleItem = {
    localId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    payload,
    retryCount: 0,
  }

  const queue = await getOfflineQueue()
  queue.push(item)

  try {
    await set(QUEUE_KEY, queue)
  } catch (err: any) {
    if (err.name === 'QuotaExceededError') {
      throw new Error('Penyimpanan perangkat penuh. Tidak dapat menyimpan transaksi offline.')
    }
    throw new Error('Gagal menyimpan ke penyimpanan offline perangkat.')
  }

  return item
}

/** Remove an item from the queue after successful sync. */
export async function dequeueOfflineSale(localId: string): Promise<void> {
  const queue = await getOfflineQueue()
  const filtered = queue.filter((item) => item.localId !== localId)
  await set(QUEUE_KEY, filtered)
}

/** Increment retry count for an item. */
export async function incrementRetryCount(localId: string): Promise<void> {
  const queue = await getOfflineQueue()
  const updated = queue.map((item) =>
    item.localId === localId ? { ...item, retryCount: item.retryCount + 1 } : item,
  )
  await set(QUEUE_KEY, updated)
}

/** Clear the entire queue (e.g. on logout). */
export async function clearOfflineQueue(): Promise<void> {
  await del(QUEUE_KEY)
}

/** Check if there are any pending items in the queue. */
export async function hasOfflinePendingItems(): Promise<boolean> {
  const queue = await getOfflineQueue()
  return queue.length > 0
}
