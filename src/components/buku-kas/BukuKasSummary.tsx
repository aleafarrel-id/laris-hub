import { ArrowLeftRight, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRupiah } from '@/lib/utils'

interface SummaryCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bg: string
  isLoading: boolean
}

function SummaryCard({ label, value, icon: Icon, color, bg, isLoading }: SummaryCardProps) {
  return (
    <motion.div
      className="app-card p-4 flex items-center gap-4"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 280 } },
      }}
    >
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} className={color} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 break-words">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-6 w-3/4 rounded-md" />
        ) : (
          <p className={`text-lg sm:text-xl md:text-2xl font-bold tabular-nums break-words ${color}`}>
            {value}
          </p>
        )}
      </div>
    </motion.div>
  )
}

interface BukuKasSummaryProps {
  omzet: number
  pengeluaran: number
  profit: number
  net: number
  isLoading: boolean
}

/**
 * 4 summary cards for Buku Kas: Omzet, Pengeluaran, Profit Kotor, Profit Bersih.
 * Stagger animation via parent motion variants.
 */
export function BukuKasSummary({ omzet, pengeluaran, profit, net, isLoading }: BukuKasSummaryProps) {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      <SummaryCard
        label="Omzet"
        value={formatRupiah(omzet)}
        icon={TrendingUp}
        color="text-primary"
        bg="bg-primary/10"
        isLoading={isLoading}
      />
      <SummaryCard
        label="Total Pengeluaran"
        value={formatRupiah(pengeluaran)}
        icon={TrendingDown}
        color="text-danger"
        bg="bg-danger/10"
        isLoading={isLoading}
      />
      <SummaryCard
        label="Profit Kotor"
        value={formatRupiah(profit)}
        icon={ArrowLeftRight}
        color="text-success"
        bg="bg-success/10"
        isLoading={isLoading}
      />
      <SummaryCard
        label="Profit Bersih"
        value={formatRupiah(net)}
        icon={DollarSign}
        color={net >= 0 ? 'text-success' : 'text-danger'}
        bg={net >= 0 ? 'bg-success/10' : 'bg-danger/10'}
        isLoading={isLoading}
      />
    </motion.div>
  )
}
