import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export function NetworkStatusBanner() {
  const { isOnline, justCameOnline, justWentOffline } = useNetworkStatus()
  const { pendingCount, isSyncing, triggerSync } = useOfflineSync(isOnline)

  const isVisible = !isOnline || justCameOnline || justWentOffline || isSyncing || pendingCount > 0
  const state = !isOnline ? 'offline' : 'online'

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
      className={`sticky top-0 w-full z-40 transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] grid ${
        isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div
          className={`w-full flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 ${bgColor} text-white shadow-sm transition-colors duration-500 min-h-[36px]`}
        >
          <div
            className={`flex items-center gap-2 overflow-hidden flex-1 ${
              !(state === 'online' && pendingCount > 0 && !isSyncing) ? 'justify-center' : ''
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                Icon === Loader2 ? 'animate-spin' : ''
              } ${state === 'offline' ? 'opacity-80' : ''}`}
            />
            
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden text-[10px] sm:text-[11px] leading-none">
              <span className="font-bold tracking-wider uppercase opacity-90 whitespace-nowrap flex-shrink-0">
                {title}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
              <span className="font-medium opacity-95 truncate">
                {subtitle}
              </span>
            </div>
          </div>

          {state === 'online' && pendingCount > 0 && !isSyncing && (
            <button
              onClick={triggerSync}
              className="flex-shrink-0 ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 active:scale-95 rounded-md text-[9px] sm:text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
