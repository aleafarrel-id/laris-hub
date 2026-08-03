import { CheckCircle2, ChevronRight, Phone, ShieldOff } from 'lucide-react'
import { motion } from 'motion/react'
import { forwardRef } from 'react'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'
import { CashierAvatar } from './CashierAvatar'

export const CashierCard = forwardRef<HTMLButtonElement, { cashier: Profile; onClick: () => void }>(
  ({ cashier, onClick }, ref) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        layout
        onClick={!cashier.isOfflinePending ? onClick : undefined}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`w-full group bg-white rounded-2xl border transition-all duration-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md text-left cursor-pointer active:scale-[0.96] ${cashier.is_active
          ? 'border-neutral-200 hover:border-primary/25'
          : 'border-neutral-100 opacity-70'
          } ${cashier.isOfflinePending ? 'opacity-60 grayscale-[0.5] border-dashed cursor-not-allowed hover:border-neutral-200' : ''}`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <CashierAvatar profile={cashier} />
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${cashier.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-sm font-bold text-neutral-900 leading-tight truncate">
            {cashier.full_name}
          </p>
          {cashier.phone && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone size={11} className="text-neutral-400 flex-shrink-0" />
              <span className="text-xs text-neutral-500 tabular-nums truncate block">
                {cashier.phone}
              </span>
            </div>
          )}
          <p className="text-[11px] text-neutral-400 mt-1 truncate">
            Sejak {formatDate(cashier.created_at as string)}
          </p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cashier.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
          >
            {cashier.is_active ? <CheckCircle2 size={10} /> : <ShieldOff size={10} />}
            {cashier.is_active ? 'Aktif' : 'Tangguhkan'}
          </span>
          {cashier.isOfflinePending ? (
            <span className="text-[10px] font-semibold text-neutral-400">
              Menunggu Sinkronisasi
            </span>
          ) : (
            <ChevronRight
              size={15}
              className="text-neutral-300 group-hover:text-primary transition-colors"
            />
          )}
        </div>
      </motion.button>
    )
  },
)

CashierCard.displayName = 'CashierCard'
