import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getKPISummaryForDate,
  getKPISummaryForRange,
  getMonthlyTrend,
  getMonthlyTrendByKasir,
  getTopProducts,
  getTopProductsByKasir,
} from '@/services/dashboard.service'
import type { DateRange } from '@/types'

// ============================================================
// Period options for the dashboard filter
// ============================================================

export type DashboardPeriod = 'today' | 'week' | 'month' | 'custom'

function getDateRange(period: DashboardPeriod, customRange?: DateRange): { from: Date; to: Date } {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  switch (period) {
    case 'today':
      return { from: today, to: now }
    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 6)
      return { from: weekAgo, to: now }
    }
    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setDate(1) // First day of current month
      return { from: monthAgo, to: now }
    }
    case 'custom':
      return customRange ?? { from: today, to: now }
    default:
      return { from: today, to: now }
  }
}

// ============================================================
// useKPISummary — dashboard KPI cards
// ============================================================

export function useKPISummary(period: DashboardPeriod = 'today', customRange?: DateRange, kasirId: string = 'all') {
  const range = getDateRange(period, customRange)
  const isToday = period === 'today'

  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD, 'kpi', period, customRange, kasirId],
    queryFn: () => {
      if (kasirId !== 'all') {
        return getKPISummaryForRange(range.from, range.to, kasirId)
      }
      return isToday ? getKPISummaryForDate(new Date()) : getKPISummaryForRange(range.from, range.to)
    },
    staleTime: 1000 * 60, // 1 min
  })
}

// ============================================================
// useMonthlyTrend — line chart data (last 30 days)
// ============================================================

export function useMonthlyTrend(days = 30, kasirId: string = 'all') {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD, 'trend', days, kasirId],
    queryFn: () => {
      if (kasirId !== 'all') {
        return getMonthlyTrendByKasir(days, kasirId)
      }
      return getMonthlyTrend(days)
    },
    staleTime: 1000 * 60 * 5, // 5 min — chart doesn't need to be ultra-fresh
  })
}

// ============================================================
// useTopProducts — horizontal bar chart
// ============================================================

export function useTopProducts(
  period: DashboardPeriod = 'month',
  customRange?: DateRange,
  limit = 5,
  kasirId = 'all',
) {
  const range = getDateRange(period, customRange)

  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD, 'top-products', period, customRange, limit, kasirId],
    queryFn: () => {
      if (kasirId !== 'all') {
        return getTopProductsByKasir(range.from, range.to, kasirId, limit)
      }
      return getTopProducts(range.from, range.to, limit)
    },
    staleTime: 1000 * 60 * 5,
  })
}
