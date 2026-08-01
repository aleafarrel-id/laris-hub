import { Wifi, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export function NetworkStatusBanner() {
  const { isOnline, justCameOnline, justWentOffline } = useNetworkStatus()
  const { pendingCount, isSyncing, triggerSync } = useOfflineSync(isOnline)

  // Banner is visible if offline, transitioning, syncing, or has pending transactions
  const isVisible = !isOnline || justCameOnline || justWentOffline || isSyncing || pendingCount > 0

  if (!isVisible) return null

  // Determine state
  const state = !isOnline ? 'offline' : 'online'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 pointer-events-none">
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-500 ease-out pointer-events-auto
          ${
            state === 'offline'
              ? 'bg-neutral-900/90 border-neutral-700/50 text-white translate-y-0 opacity-100'
              : pendingCount > 0
                ? 'bg-warning-dark/90 border-warning/50 text-white translate-y-0 opacity-100'
                : 'bg-emerald-600/90 border-emerald-500/50 text-white translate-y-0 opacity-100'
          }
        `}
        style={{
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex-shrink-0">
          {state === 'offline' ? (
            <div className="relative">
              <WifiOff className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
            </div>
          ) : (
            <Wifi className="w-4 h-4 animate-in fade-in zoom-in duration-300" />
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
            {state === 'offline' ? 'Koneksi Terputus' : 'Online'}
          </span>
          <span
            className={`text-xs font-medium border-l pl-2.5 transition-colors duration-300 flex items-center gap-2 whitespace-nowrap ${
              state === 'offline'
                ? 'text-neutral-400 border-neutral-700'
                : pendingCount > 0
                  ? 'text-warning-light border-warning/50'
                  : 'text-emerald-100 border-emerald-500/50'
            }`}
          >
            {state === 'offline' ? (
              pendingCount > 0 ? (
                `${pendingCount} transaksi tertunda`
              ) : (
                'Bekerja secara offline'
              )
            ) : isSyncing ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="animate-spin h-3 w-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Menyinkronkan data...
              </span>
            ) : pendingCount > 0 ? (
              <span className="flex items-center gap-2">
                <span>{pendingCount} transaksi tertunda</span>
                <button
                  onClick={triggerSync}
                  className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                >
                  Coba Lagi
                </button>
              </span>
            ) : (
              'Koneksi stabil'
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
