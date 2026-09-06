import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface QueryErrorFallbackProps {
  /**
   * Callback to retry the failed query. Typically the `refetch` function
   * returned by useQuery / useInfiniteQuery.
   */
  onRetry?: () => void
  /**
   * Optional title override. Defaults to a generic Indonesian message.
   */
  title?: string
  /**
   * Optional description override.
   */
  description?: string
  /** Compact mode: less padding, smaller text — useful inside cards/sections. */
  compact?: boolean
}

/**
 * Displays a user-friendly error state when a React Query fetch fails.
 *
 * IMPORTANT: Never expose raw error objects or stack traces to the user.
 * Always show a friendly, action-oriented message in Bahasa Indonesia.
 */
export function QueryErrorFallback({
  onRetry,
  title = 'Gagal Memuat Data',
  description = 'Terjadi masalah saat mengambil data. Periksa koneksi internet Anda dan coba lagi.',
  compact = false,
}: QueryErrorFallbackProps) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center bg-white border border-neutral-200 rounded-2xl ${
        compact ? 'p-6 gap-3' : 'p-10 gap-4'
      }`}
    >
      <div
        className={`rounded-full bg-danger/10 text-danger flex items-center justify-center flex-shrink-0 ${
          compact ? 'w-10 h-10' : 'w-14 h-14'
        }`}
      >
        <AlertTriangle size={compact ? 18 : 24} strokeWidth={2} />
      </div>

      <div className="space-y-1">
        <p className={`font-semibold text-neutral-800 ${compact ? 'text-sm' : 'text-base'}`}>
          {title}
        </p>
        <p className={`text-neutral-500 max-w-xs mx-auto ${compact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className={`rounded-xl border-neutral-200 ${compact ? 'h-8 text-xs px-3' : 'h-10 px-4'}`}
        >
          <RefreshCw size={compact ? 12 : 14} className="mr-1.5" />
          Coba Lagi
        </Button>
      )}
    </div>
  )
}
