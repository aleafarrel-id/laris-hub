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
  entityType: EntityType,
): T[] {
  // 1. Identify items to be deleted
  const deletes = pendingItems.filter((i) => i.action === `DELETE_${entityType}`)
  const deleteIds = new Set(
    deletes.map((i) => {
      if (typeof i.payload === 'string') return i.payload
      return (i.payload as { id?: string })?.id || ''
    }),
  )

  // 2. Identify updates and toggles
  const VALID_UPDATE_ACTIONS = [
    'UPDATE_STATUS',
    'TOGGLE_PRODUCT',
    'TOGGLE_KASIR',
    'UPDATE_PRODUCT',
    'UPDATE_KASIR',
    'UPDATE_SALE',
    'UPDATE_EXPENSE',
  ]
  const updates = pendingItems.filter((i) => VALID_UPDATE_ACTIONS.includes(i.action))

  // 3. Filter out deleted items
  let result = data.filter((item) => !deleteIds.has(item.id))

  // 4. Apply updates
  result = result.map((item) => {
    // Find all updates applied to this item
    const itemUpdates = updates.filter((u) => {
      if (typeof u.payload === 'string') return u.payload === item.id
      return (u.payload as { id?: string })?.id === item.id
    })

    if (itemUpdates.length > 0) {
      let mutated: Record<string, unknown> = { ...item, isOfflinePending: true }

      for (const update of itemUpdates) {
        const p = update.payload as Record<string, unknown>
        if (update.action === 'UPDATE_STATUS') {
          mutated.status = p.status
        }
        if (update.action === 'TOGGLE_PRODUCT' || update.action === 'TOGGLE_KASIR') {
          mutated.is_active = p.isActive
        }
        if (update.action === 'UPDATE_PRODUCT') {
          mutated = { ...mutated, ...(p.data as object) }
        }
        if (update.action === 'UPDATE_KASIR') {
          mutated = { ...mutated, ...((p.data as object) || p) }
        }
        if (update.action === 'UPDATE_SALE' || update.action === 'UPDATE_EXPENSE') {
          mutated = { ...mutated, ...(p.payload as object) }
        }
      }
      return mutated as T
    }

    return item
  })

  return result
}
