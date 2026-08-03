import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getKPISummaryForDate,
  getKPISummaryForRange,
  getMonthlyTrend,
  getMonthlyTrendByCashier,
  getTopProducts,
  getTopProductsByCashier,
} from '@/services/dashboard.service'
import { useAuthStore } from '@/store/auth.store'
import type { DateRange } from '@/types'

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
      monthAgo.setDate(1)
      return { from: monthAgo, to: now }
    }
    case 'custom':
      return customRange ?? { from: today, to: now }
    default:
      return { from: today, to: now }
  }
}

export function useKPISummary(
  period: DashboardPeriod = 'today',
  customRange?: DateRange,
  cashierId: string = 'all',
) {
  const range = getDateRange(period, customRange)
  const isToday = period === 'today'

  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.DASHBOARD, 'kpi', period, customRange, cashierId],
    queryFn: () => {
      if (cashierId !== 'all') {
        return getKPISummaryForRange(range.from, range.to, cashierId)
      }
      return isToday
        ? getKPISummaryForDate(new Date())
        : getKPISummaryForRange(range.from, range.to)
    },
  })

  return {
    ...result,
    isOfflinePaused:
      (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data),
  }
}

export function useMonthlyTrend(days = 30, cashierId: string = 'all') {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.DASHBOARD, 'trend', days, cashierId],
    queryFn: () => {
      if (cashierId !== 'all') {
        return getMonthlyTrendByCashier(days, cashierId)
      }
      return getMonthlyTrend(days)
    },
  })

  return {
    ...result,
    isOfflinePaused:
      (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data),
  }
}

export function useTopProducts(
  period: DashboardPeriod = 'month',
  customRange?: DateRange,
  limit = 5,
  cashierId = 'all',
) {
  const range = getDateRange(period, customRange)

  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.DASHBOARD, 'top-products', period, customRange, limit, cashierId],
    queryFn: () => {
      if (cashierId !== 'all') {
        return getTopProductsByCashier(range.from, range.to, cashierId, limit)
      }
      return getTopProducts(range.from, range.to, limit)
    },
  })

  return {
    ...result,
    isOfflinePaused:
      (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data),
  }
}
