import { QrCode, Banknote, Clock, CheckCircle2 } from 'lucide-react'
import type { TransactionType } from '@/lib/constants'

interface BadgeProps {
  type: TransactionType | string
}

const BADGE_CONFIG = {
  penjualan: { label: 'Penjualan', className: 'bg-success/10 text-success' },
  pengeluaran: { label: 'Pengeluaran', className: 'bg-danger/10 text-danger' },
} as const

export function TransactionBadge({ type }: BadgeProps) {
  const config = BADGE_CONFIG[type as keyof typeof BADGE_CONFIG] ?? {
    label: type,
    className: 'bg-neutral-100 text-neutral-600',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export function StatusBadge({ status, forceShow }: { status: string | null, forceShow?: boolean }) {
  if (!status) return null
  if (status === 'sukses' && !forceShow) return null
  const config = {
    pending: { label: 'Tertunda', className: 'bg-amber-50 text-amber-600 border border-amber-200' },
    sukses: { label: 'Sukses', className: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  }[status] ?? { label: status, className: 'bg-neutral-50 text-neutral-600 border border-neutral-200' }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${config.className}`}>
      {status === 'pending' && <Clock size={12} />}
      {status === 'sukses' && <CheckCircle2 size={12} />}
      {config.label}
    </span>
  )
}

export function PaymentMethodBadge({ method, forceShow }: { method: string | null, forceShow?: boolean }) {
  if (!method) return null
  if (method === 'tunai' && !forceShow) return null
  const config = {
    tunai: { label: 'Tunai', className: 'bg-emerald-50 text-emerald-600 border border-emerald-200', icon: Banknote },
    qris: { label: 'QRIS', className: 'bg-blue-50 text-blue-600 border border-blue-200', icon: QrCode },
  }[method] ?? { label: method, className: 'bg-neutral-50 text-neutral-600 border border-neutral-200', icon: null }

  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${config.className}`}>
      {Icon && <Icon size={12} />}
      {config.label}
    </span>
  )
}
