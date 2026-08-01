import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export function NetworkStatusBanner() {
  const { isOnline, justCameOnline, justWentOffline } = useNetworkStatus()
  const { pendingCount, isSyncing, triggerSync } = useOfflineSync(isOnline)

  // Banner is visible if offline, transitioning, syncing, or has pending transactions
  const isVisible = !isOnline || justCameOnline || justWentOffline || isSyncing || pendingCount > 0
  const state = !isOnline ? 'offline' : 'online'

  // Determine styles and content based on state
  let bgColor = 'bg-neutral-900'
  let Icon = WifiOff
  let title = 'Koneksi Terputus'
  let subtitle = 'Perangkat offline'

  if (state === 'online') {
    if (isSyncing) {
      bgColor = 'bg-blue-600'
      Icon = Loader2
      title = 'Menyinkronkan'
      subtitle = 'Menyimpan data...'
    } else if (pendingCount > 0) {
      bgColor = 'bg-amber-600'
      Icon = Wifi
      title = 'Sinkronisasi Tertunda'
      subtitle = `${pendingCount} transaksi belum tersimpan`
    } else {
      bgColor = 'bg-emerald-500'
      Icon = Wifi
      title = 'Terhubung'
      subtitle = 'Koneksi stabil'
    }
  }

  return (
    <div
      className={`sticky top-0 w-full z-40 transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] grid ${isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
    >
      <div className="overflow-hidden">
        <div
          className={`w-full flex items-center justify-between px-4 py-2.5 ${bgColor} text-white shadow-sm transition-colors duration-500`}
        >
          <div
            className={`flex items-center gap-3 overflow-hidden flex-1 ${!(state === 'online' && pendingCount > 0 && !isSyncing) ? 'justify-center pr-6' : ''}`}
          >
            <Icon
              className={`w-4 h-4 flex-shrink-0 ${Icon === Loader2 ? 'animate-spin' : ''} ${state === 'offline' ? 'opacity-80' : ''}`}
            />

            {state === 'online' && pendingCount > 0 && !isSyncing ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 overflow-hidden leading-tight">
                <span className="font-semibold tracking-widest uppercase text-[10px] opacity-90 truncate">
                  {title}
                </span>
                <span className="hidden sm:block w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                <span className="font-medium opacity-95 truncate text-[11px] sm:text-[13px] mt-0.5 sm:mt-0">
                  {subtitle}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-hidden text-[13px]">
                <span className="font-semibold tracking-widest uppercase text-[10px] opacity-90 mt-px whitespace-nowrap">
                  {title}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                <span className="font-medium opacity-95 truncate">{subtitle}</span>
              </div>
            )}
          </div>

          {state === 'online' && pendingCount > 0 && !isSyncing && (
            <button
              onClick={triggerSync}
              className="flex-shrink-0 ml-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
