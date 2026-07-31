import { useMemo } from 'react'
import { Route } from '@/routes/_auth/buku-kas'
import type { QuickRange } from '@/components/buku-kas/BukuKasFilters'
import type { TransactionFilters } from '@/types'

export type BukuKasSearch = {
  quickRange?: QuickRange
  customFrom?: string
  customTo?: string
  typeFilter?: TransactionFilters['type']
  kasirFilter?: string
  paymentMethodFilter?: TransactionFilters['paymentMethod']
}

export const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function getDateRange(range: QuickRange): { from: Date; to: Date } {
  const to = new Date()
  to.setHours(23, 59, 59, 999)

  if (range === 'week') {
    const from = new Date()
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)
    return { from, to }
  }
  if (range === 'month') {
    const from = new Date()
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)
    return { from, to }
  }
  // Default to today
  return { from: todayStart(), to }
}

export function useBukuKasFilters() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const quickRange: QuickRange = search.quickRange || 'today'
  const customFrom = search.customFrom || todayStart().toISOString().split('T')[0]
  const customTo = search.customTo || new Date().toISOString().split('T')[0]
  const typeFilter = search.typeFilter || 'all'
  const kasirFilter = search.kasirFilter || 'all'
  const paymentMethodFilter = search.paymentMethodFilter || 'all'

  const updateSearch = (updates: Partial<BukuKasSearch>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates }) })
  }

  const filters: TransactionFilters = useMemo(() => {
    const dateRange =
      quickRange === 'custom'
        ? {
            from: new Date(customFrom),
            to: new Date(`${customTo}T23:59:59.999`),
          }
        : getDateRange(quickRange)

    return {
      dateRange,
      type: typeFilter,
      recordedBy: kasirFilter !== 'all' ? kasirFilter : undefined,
      paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
    }
  }, [quickRange, customFrom, customTo, typeFilter, kasirFilter, paymentMethodFilter])

  return {
    quickRange,
    customFrom,
    customTo,
    typeFilter,
    kasirFilter,
    paymentMethodFilter,
    filters,
    updateSearch,
  }
}
