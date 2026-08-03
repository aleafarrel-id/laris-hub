import { motion } from 'motion/react'
import type { Profile } from '@/types'

interface CashierStatsProps {
  cashierList: Profile[]
}

export function CashierStats({ cashierList }: CashierStatsProps) {
  const activeCount = cashierList?.filter((k) => k.is_active)?.length ?? 0
  const suspendedCount = (cashierList?.length ?? 0) - activeCount

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      {[
        {
          label: 'Total',
          value: cashierList?.length ?? 0,
          color: 'text-neutral-900',
          bg: 'bg-white',
        },
        {
          label: 'Aktif',
          value: activeCount,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
        },
        {
          label: 'Tangguhkan',
          value: suspendedCount,
          color: suspendedCount > 0 ? 'text-amber-700' : 'text-neutral-400',
          bg: suspendedCount > 0 ? 'bg-amber-50' : 'bg-neutral-50',
        },
      ].map(({ label, value, color, bg }) => (
        <div
          key={label}
          className={`${bg} rounded-2xl border border-neutral-200 p-3 text-center shadow-sm`}
        >
          <p className={`text-xl font-black tabular-nums ${color}`}>{value}</p>
          <p className="text-[10px] text-neutral-500 font-semibold mt-0.5 leading-tight">{label}</p>
        </div>
      ))}
    </motion.div>
  )
}
