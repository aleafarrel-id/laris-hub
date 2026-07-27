import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

interface KPICardProps {
  label: string
  value: string | null
  sublabel?: string
  isLoading?: boolean
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string } // positive = up, negative = down
}

/**
 * KPI metric card — used in Dashboard.
 * Icon uses currentColor via iconColor class.
 * Trend shows % change vs previous period.
 */
export function KPICard({
  label,
  value,
  sublabel,
  isLoading = false,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  trend,
}: KPICardProps) {
  return (
    <div className="kpi-card group flex items-center gap-4 p-4">
      <div
        className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={24} className={iconColor} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide truncate pr-2">
            {label}
          </p>
          {trend !== undefined && !isLoading && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums flex-shrink-0 ${
                trend.value >= 0 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
              }`}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-1.5 mt-1">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            {sublabel && <Skeleton className="h-3 w-1/2 rounded" />}
          </div>
        ) : (
          <>
            <p className="text-lg sm:text-xl md:text-2xl font-bold tabular-nums text-neutral-900 leading-tight break-words">
              {value ?? 'Rp 0'}
            </p>
            {sublabel && <p className="text-xs text-neutral-400 mt-0.5">{sublabel}</p>}
          </>
        )}
      </div>
    </div>
  )
}
