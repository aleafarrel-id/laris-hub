import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'

/**
 * PWAPrompt
 * Handles Service Worker registration and auto-updates.
 * Since vite.config.ts uses registerType: 'autoUpdate',
 * this component just needs to call useRegisterSW() to activate it.
 */
export function PWAPrompt() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r)
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error)
    },
  })

  useEffect(() => {
    if (offlineReady) {
      console.log('[PWA] App is ready to work offline.')
    }
  }, [offlineReady])

  useEffect(() => {
    if (needRefresh) {
      console.log('[PWA] New content available, updating...')
      updateServiceWorker(true)
    }
  }, [needRefresh, updateServiceWorker])

  return null
}
