import { Filter } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import type { TransactionFilters } from '@/types'

export type QuickRange = 'today' | 'week' | 'month' | 'custom'

export const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: '7 Hari' },
  { key: 'month', label: '30 Hari' },
  { key: 'custom', label: 'Custom' },
]

interface CashierOption {
  id: string
  full_name: string
}

interface BukuKasFiltersProps {
  isAdmin: boolean
  quickRange: QuickRange
  customFrom: string
  customTo: string
  typeFilter: TransactionFilters['type']
  kasirFilter: string
  paymentMethodFilter: TransactionFilters['paymentMethod']
  cashiers?: CashierOption[]
  onQuickRangeChange: (range: QuickRange) => void
  onCustomFromChange: (val: string) => void
  onCustomToChange: (val: string) => void
  onTypeFilterChange: (val: TransactionFilters['type']) => void
  onKasirFilterChange: (val: string) => void
  onPaymentMethodFilterChange: (val: TransactionFilters['paymentMethod']) => void
}

export function BukuKasFilters({
  isAdmin,
  quickRange,
  customFrom,
  customTo,
  typeFilter,
  kasirFilter,
  paymentMethodFilter,
  cashiers,
  onQuickRangeChange,
  onCustomFromChange,
  onCustomToChange,
  onTypeFilterChange,
  onKasirFilterChange,
  onPaymentMethodFilterChange,
}: BukuKasFiltersProps) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-neutral-400 flex-shrink-0" />

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {QUICK_RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onQuickRangeChange(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.96] whitespace-nowrap flex-shrink-0 ${
                quickRange === key
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-neutral-200 flex-shrink-0 hidden sm:block" />

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <CustomSelect
              value={kasirFilter}
              onChange={(val) => onKasirFilterChange(val)}
              options={[
                { value: 'all', label: 'Semua Kasir' },
                ...(cashiers?.map((c) => ({ value: c.id, label: c.full_name })) || []),
              ]}
              className="min-w-[120px]"
            />
          )}
          <CustomSelect
            value={paymentMethodFilter as string}
            onChange={(val) => onPaymentMethodFilterChange(val as TransactionFilters['paymentMethod'])}
            options={[
              { value: 'all', label: 'Semua Metode' },
              { value: 'tunai', label: 'Tunai' },
              { value: 'qris', label: 'QRIS' },
            ]}
            className="min-w-[120px]"
          />
          <CustomSelect
            value={typeFilter as string}
            onChange={(val) => onTypeFilterChange(val as TransactionFilters['type'])}
            options={[
              { value: 'all', label: 'Semua Tipe' },
              { value: 'penjualan', label: 'Penjualan' },
              { value: 'pengeluaran', label: 'Pengeluaran' },
            ]}
            className="min-w-[120px]"
          />
        </div>
      </div>

      {quickRange === 'custom' && (
        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl p-1.5 shadow-sm w-fit">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          />
          <span className="text-neutral-400 text-xs font-semibold px-1">s/d</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-3 py-2 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          />
        </div>
      )}
    </div>
  )
}
