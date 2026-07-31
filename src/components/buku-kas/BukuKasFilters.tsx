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
  cashiers?: CashierOption[]
  onQuickRangeChange: (range: QuickRange) => void
  onCustomFromChange: (val: string) => void
  onCustomToChange: (val: string) => void
  onTypeFilterChange: (val: TransactionFilters['type']) => void
  onKasirFilterChange: (val: string) => void
}

export function BukuKasFilters({
  isAdmin,
  quickRange,
  customFrom,
  customTo,
  typeFilter,
  kasirFilter,
  cashiers,
  onQuickRangeChange,
  onCustomFromChange,
  onCustomToChange,
  onTypeFilterChange,
  onKasirFilterChange,
}: BukuKasFiltersProps) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full min-w-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full min-w-0">
          <Filter size={14} className="text-neutral-400 flex-shrink-0" />
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

        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
          {isAdmin && (
            <CustomSelect
              value={kasirFilter}
              onChange={(val) => onKasirFilterChange(val)}
              options={[
                { value: 'all', label: 'Semua Kasir' },
                ...(cashiers?.map((c) => ({ value: c.id, label: c.full_name })) || []),
              ]}
              className="min-w-[130px]"
            />
          )}
          <CustomSelect
            value={typeFilter as string}
            onChange={(val) => onTypeFilterChange(val as TransactionFilters['type'])}
            options={[
              { value: 'all', label: 'Semua Tipe' },
              { value: 'penjualan', label: 'Penjualan' },
              { value: 'pengeluaran', label: 'Pengeluaran' },
            ]}
          />
        </div>
      </div>

      {quickRange === 'custom' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white border border-neutral-200 rounded-xl p-2 sm:p-1.5 shadow-sm w-full sm:max-w-fit">
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
