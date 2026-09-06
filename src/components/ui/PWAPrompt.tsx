import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * PWAPrompt
 * Handles Service Worker registration and auto-updates.
 * Since vite.config.ts uses registerType: 'autoUpdate',
 * this component just needs to call useRegisterSW() to activate it.
 */
export function PWAPrompt() {
  const swErrorToastShown = useRef(false)

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

      // Only notify in development — production users shouldn't see
      // technical PWA error details. The app still works without a SW.
      if (import.meta.env.DEV && !swErrorToastShown.current) {
        swErrorToastShown.current = true
        toast.warning('Mode offline tidak aktif', {
          description:
            'Service Worker gagal terdaftar. Fitur offline tidak tersedia dalam sesi ini.',
          duration: 8000,
        })
      }
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
