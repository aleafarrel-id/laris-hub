/**
 * useNetworkStatus.ts
 *
 * Monitors real-time network connectivity.
 *
 * Integrates with React Query's `onlineManager`:
 * - Automatically pauses pending mutations when offline.
 * - Automatically resumes and retries mutations when online.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { onlineManager } from '@tanstack/react-query'

export interface NetworkStatus {
  isOnline: boolean
  justCameOnline: boolean
  justWentOffline: boolean
  lastChanged: Date | null
}

/**
 * Synchronizes navigator.onLine with React Query's onlineManager.
 * When offline, React Query pauses all pending mutations automatically.
 * When back online, React Query resumes and retries them.
 */
function syncOnlineManager(isOnline: boolean) {
  onlineManager.setOnline(isOnline)
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [justCameOnline, setJustCameOnline] = useState(false)
  const [justWentOffline, setJustWentOffline] = useState(false)
  const [lastChanged, setLastChanged] = useState<Date | null>(null)

  const cameOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wentOfflineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setLastChanged(new Date())
    syncOnlineManager(true)

    // Flash "just came online" state for 4 seconds
    setJustCameOnline(true)
    if (cameOnlineTimer.current) clearTimeout(cameOnlineTimer.current)
    cameOnlineTimer.current = setTimeout(() => setJustCameOnline(false), 4000)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setLastChanged(new Date())
    syncOnlineManager(false)

    setJustWentOffline(true)
    if (wentOfflineTimer.current) clearTimeout(wentOfflineTimer.current)
    wentOfflineTimer.current = setTimeout(() => setJustWentOffline(false), 500)
  }, [])

  useEffect(() => {
    // Sync initial state with React Query
    syncOnlineManager(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (cameOnlineTimer.current) clearTimeout(cameOnlineTimer.current)
      if (wentOfflineTimer.current) clearTimeout(wentOfflineTimer.current)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, justCameOnline, justWentOffline, lastChanged }
}
