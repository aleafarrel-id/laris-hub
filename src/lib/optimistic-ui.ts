import type { OfflineQueueItem } from './offline-queue'

type EntityType = 'PRODUCT' | 'CASHIER' | 'TRANSACTION'

/**
 * Applies pending offline updates and deletes to a list of data objects.
 * This guarantees that even without an internet connection, edits and deletes
 * are reflected immediately in the UI.
 */
export function applyOptimisticUpdates<T extends { id: string }>(
  data: T[],
  pendingItems: OfflineQueueItem[],
  entityType: EntityType,
): T[] {
  // Identify items to be deleted
  const deletes = pendingItems.filter((i) => i.action === `DELETE_${entityType}`)
  const deleteIds = new Set(
    deletes.map((i) => {
      if (typeof i.payload === 'string') return i.payload
      return (i.payload as { id?: string })?.id || ''
    }),
  )

  // Identify updates and toggles
  const VALID_UPDATE_ACTIONS = [
    'UPDATE_STATUS',
    'TOGGLE_PRODUCT',
    'TOGGLE_CASHIER',
    'UPDATE_PRODUCT',
    'UPDATE_CASHIER',
    'UPDATE_SALE',
    'UPDATE_EXPENSE',
  ]
  const updates = pendingItems.filter((i) => VALID_UPDATE_ACTIONS.includes(i.action))

  // Filter out deleted items
  let result = data.filter((item) => !deleteIds.has(item.id))

  result = result.map((item) => {
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
        if (update.action === 'TOGGLE_PRODUCT' || update.action === 'TOGGLE_CASHIER') {
          mutated.is_active = p.isActive
        }
        if (update.action === 'UPDATE_PRODUCT') {
          mutated = { ...mutated, ...(p.data as object) }
        }
        if (update.action === 'UPDATE_CASHIER') {
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
