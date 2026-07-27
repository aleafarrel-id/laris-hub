import type { TransactionType } from '@/lib/constants'

interface BadgeProps {
  type: TransactionType | string
}

const BADGE_CONFIG = {
  penjualan: { label: 'Penjualan', className: 'bg-success/10 text-success' },
  pengeluaran: { label: 'Pengeluaran', className: 'bg-danger/10 text-danger' },
} as const

/**
 * Badge for transaction type — consistent across all pages.
 */
export function TransactionBadge({ type }: BadgeProps) {
  const config = BADGE_CONFIG[type as keyof typeof BADGE_CONFIG] ?? {
    label: type,
    className: 'bg-neutral-100 text-neutral-600',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
