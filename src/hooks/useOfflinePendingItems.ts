import { useEffect, useMemo, useState } from 'react'
import type { OfflineQueueAction, OfflineQueueItem } from '@/lib/offline-queue'
import { getOfflineQueue } from '@/lib/offline-queue'

export function useOfflinePendingItems<T = any>(actions: OfflineQueueAction[]) {
  const [pendingItems, setPendingItems] = useState<OfflineQueueItem<T>[]>([])
  const actionsKey = useMemo(() => [...actions].sort().join(','), [actions])

  useEffect(() => {
    let mounted = true

    const fetchQueue = async () => {
      const queue = await getOfflineQueue()
      if (!mounted) return

      const filtered = queue.filter((item) => actionsKey.split(',').includes(item.action))
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
  }, [actionsKey])

  return pendingItems
}
