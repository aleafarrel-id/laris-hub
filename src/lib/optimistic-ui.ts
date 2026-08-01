import type { OfflineQueueItem } from './offline-queue'

type EntityType = 'PRODUCT' | 'KASIR' | 'TRANSACTION'

/**
 * Applies pending offline updates and deletes to a list of data objects.
 * This guarantees that even without an internet connection, edits and deletes
 * are reflected immediately in the UI.
 *
 * @param data The array of existing entities (e.g. from useQuery)
 * @param pendingItems The list of pending offline actions
 * @param entityType The entity type prefix used in action strings
 */
export function applyOptimisticUpdates<T extends { id: string }>(
  data: T[],
  pendingItems: OfflineQueueItem[],
  entityType: EntityType
): T[] {
  // 1. Identify items to be deleted
  const deletes = pendingItems.filter((i) => i.action === `DELETE_${entityType}`)
  const deleteIds = new Set(deletes.map((i) => (i.payload?.id || i.payload) as string))

  // 2. Identify updates and toggles
  const updates = pendingItems.filter(
    (i) => i.action.startsWith('UPDATE_') || i.action.startsWith('TOGGLE_')
  )

  // 3. Filter out deleted items
  let result = data.filter((item) => !deleteIds.has(item.id))

  // 4. Apply updates
  result = result.map((item) => {
    // Find all updates applied to this item
    const itemUpdates = updates.filter(
      (u) => u.payload?.id === item.id || u.payload === item.id
    )

    if (itemUpdates.length > 0) {
      let mutated: any = { ...item, isOfflinePending: true }
      
      for (const update of itemUpdates) {
        if (update.action === 'UPDATE_STATUS') {
          mutated.status = update.payload.status
        }
        if (update.action === 'TOGGLE_PRODUCT' || update.action === 'TOGGLE_KASIR') {
          mutated.is_active = update.payload.isActive
        }
        if (update.action === 'UPDATE_PRODUCT') {
          mutated = { ...mutated, ...update.payload.data }
        }
        if (update.action === 'UPDATE_KASIR') {
          mutated = { ...mutated, ...update.payload }
        }
        if (update.action === 'UPDATE_SALE' || update.action === 'UPDATE_EXPENSE') {
          mutated = { ...mutated, ...update.payload.payload }
        }
      }
      return mutated as T
    }

    return item
  })

  return result
}
