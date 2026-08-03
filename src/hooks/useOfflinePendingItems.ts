import { useEffect, useState } from 'react'
import type { OfflineQueueAction, OfflineQueueItem } from '@/lib/offline-queue'
import { getOfflineQueue } from '@/lib/offline-queue'

export function useOfflinePendingItems<T = any>(actions: OfflineQueueAction[]) {
  const [pendingItems, setPendingItems] = useState<OfflineQueueItem<T>[]>([])

  useEffect(() => {
    let mounted = true

    const fetchQueue = async () => {
      const queue = await getOfflineQueue()
      if (!mounted) return

      const filtered = queue.filter((item) => actions.includes(item.action))
      setPendingItems(filtered as OfflineQueueItem<T>[])
    }

    // Initial fetch
    fetchQueue()

    // Listen to global queue updates
    const handleUpdate = () => fetchQueue()
    window.addEventListener('offline-queue-updated', handleUpdate)

    return () => {
      mounted = false
      window.removeEventListener('offline-queue-updated', handleUpdate)
    }
  }, [actions.join(',')])

  return pendingItems
}
