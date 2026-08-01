import { Wifi, WifiOff, Loader2 } from 'lucide-react'
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
      className={`sticky top-0 w-full z-[9999] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] grid ${
        isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div
          className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 ${bgColor} text-white shadow-sm transition-colors duration-500`}
        >
          <Icon className={`w-4 h-4 ${Icon === Loader2 ? 'animate-spin' : ''} ${state === 'offline' ? 'opacity-80' : ''}`} />
          
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold tracking-widest uppercase text-[10px] opacity-90 mt-px">
              {title}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-medium opacity-95">
              {subtitle}
            </span>
          </div>

          {state === 'online' && pendingCount > 0 && !isSyncing && (
            <button
              onClick={triggerSync}
              className="ml-3 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
