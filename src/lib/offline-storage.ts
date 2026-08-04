/**
 * offline-storage.ts
 *
 * IndexedDB-backed persister for React Query using `idb-keyval`.
 *
 * Why IndexedDB over localStorage?
 * - Larger storage capacity
 * - Asynchronous (non-blocking)
 */

import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'

const IDB_KEY = 'laris-hub:react-query-cache'

/**
 * Creates an IndexedDB-backed persister for React Query.
 */
export function createIndexedDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(IDB_KEY, client)
      } catch (err) {
        console.warn('[offline-storage] Failed to persist cache:', err)
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(IDB_KEY)
      } catch {
        return undefined
      }
    },
    removeClient: async () => {
      try {
        await del(IDB_KEY)
      } catch (err) {
        console.warn('[offline-storage] Failed to remove cache:', err)
      }
    },
  }
}

/**
 * Clears the IndexedDB offline cache explicitly.
 */
export async function clearOfflineCache() {
  try {
    await del(IDB_KEY)
  } catch (err) {
    console.warn('[offline-storage] Failed to remove cache explicitly:', err)
  }
}
