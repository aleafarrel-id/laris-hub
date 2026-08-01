import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthProvider>
      <NetworkStatusBanner />
      <Outlet />
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast:
              'group font-sans text-sm rounded-xl shadow-lg border border-neutral-200/80 bg-white/95 backdrop-blur-sm',
            title: 'font-semibold text-neutral-900',
            description: 'text-neutral-500 text-xs mt-0.5',
            actionButton: 'bg-primary text-white text-xs font-medium rounded-lg px-3 py-1.5',
            cancelButton:
              'bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg px-3 py-1.5',
            closeButton:
              'bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-600 rounded-lg',
            error: 'border-danger/20 bg-danger/5',
            success: 'border-success/20 bg-success/5',
            warning: 'border-amber-500/20 bg-amber-500/5',
            info: 'border-primary/20 bg-primary/5',
          },
        }}
      />
    </AuthProvider>
  )
}
