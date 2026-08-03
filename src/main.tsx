import { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import React from 'react'
import ReactDOM from 'react-dom/client'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Local fonts for offline PWA support
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'

import './index.css'
import { createIndexedDBPersister } from './lib/offline-storage'

// Suppress harmless ResizeObserver errors from recharts/ResponsiveContainer
const originalError = console.error
console.error = (...args) => {
  if (
    import.meta.env.DEV &&
    (/defaultProps will be removed/.test(args[0]) ||
      /ResizeObserver loop limit exceeded/.test(args[0]) ||
      /A component is changing an uncontrolled input/.test(args[0]))
  ) {
    return
  }
  originalError.call(console, ...args)
}

window.addEventListener('error', (e) => {
  if (
    e.message === 'ResizeObserver loop limit exceeded' ||
    e.message === 'ResizeObserver loop completed with undelivered notifications.'
  ) {
    e.stopImmediatePropagation()
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div')
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay')
    if (resizeObserverErr) resizeObserverErr.setAttribute('style', 'display: none')
    if (resizeObserverErrDiv) resizeObserverErrDiv.setAttribute('style', 'display: none')
  }
})

// Prevent mouse wheel from changing values in number inputs globally
document.addEventListener(
  'wheel',
  () => {
    if (
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.type === 'number'
    ) {
      document.activeElement.blur()
    }
  },
  { passive: true },
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds default for real-time feel
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days garbage collection for offline access
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false
        if (error instanceof Error && error.message.includes('403')) return false
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('[main] Root element #root not found in DOM')
}

// Request persistent storage for PWA
if (navigator.storage && navigator.storage.persist) {
  navigator.storage
    .persist()
    .then((persistent) => {
      if (persistent) {
        console.log('[PWA] Storage will not be cleared except by explicit user action')
      } else {
        console.log('[PWA] Storage may be cleared by the UA under storage pressure.')
      }
    })
    .catch(console.error)
}

// Create IndexedDB persister instance
const persister = createIndexedDBPersister()

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // Persist for 7 days
      }}
    >
      <RouterProvider router={router} />

      {/* DevTools */}
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          <TanStackRouterDevtools router={router} position="bottom-right" />
        </>
      )}
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
