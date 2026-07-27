/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { KPISummary } from '@/types'

// Note: `as any` casts bypass strict Supabase SDK type inference for views and RPC.
// Replace database.types.ts with auto-generated types for full type safety.

const db = supabase as any

interface DailySummaryRow {
  date: string
  total_sales_count: number
  total_revenue: number
  total_gross_profit: number
  total_expense: number
  net_cashflow: number
}

/**
 * Get KPI summary for a specific date (defaults to today).
 * Uses the daily_summary view.
 */
export async function getKPISummaryForDate(date: Date = new Date()): Promise<KPISummary> {
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await db
    .from('daily_summary')
    .select('*')
    .eq('date', dateStr)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return { omset: 0, pengeluaran: 0, profit: 0, transactionCount: 0 }
  }

  const row = data as DailySummaryRow
  return {
    omset: Number(row.total_revenue),
    pengeluaran: Number(row.total_expense),
    profit: Number(row.total_gross_profit),
    transactionCount: Number(row.total_sales_count),
  }
}

/**
 * Get KPI summary for a custom date range.
 * Aggregates directly from transactions table.
 */
export async function getKPISummaryForRange(from: Date, to: Date): Promise<KPISummary> {
  const endOfDay = new Date(to)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await db
    .from('transactions')
    .select('type, total_amount, total_profit')
    .gte('transaction_at', from.toISOString())
    .lte('transaction_at', endOfDay.toISOString())

  if (error) throw error

  type Row = { type: string; total_amount: number; total_profit: number }
  return ((data ?? []) as Row[]).reduce(
    (acc, tx) => {
      if (tx.type === 'penjualan') {
        acc.omset += Number(tx.total_amount)
        acc.profit += Number(tx.total_profit)
        acc.transactionCount += 1
      } else {
        acc.pengeluaran += Number(tx.total_amount)
      }
      return acc
    },
    { omset: 0, pengeluaran: 0, profit: 0, transactionCount: 0 },
  )
}

export interface DailyTrendPoint {
  date: string
  omset: number
  profit: number
  pengeluaran: number
}

/**
 * Get daily trend data for the last N days (default 30).
 * Uses the daily_summary view.
 */
export async function getMonthlyTrend(days = 30): Promise<DailyTrendPoint[]> {
  const from = new Date()
  from.setDate(from.getDate() - days + 1)
  from.setHours(0, 0, 0, 0)
  const fromStr = from.toISOString().split('T')[0]

  const { data, error } = await db
    .from('daily_summary')
    .select('date, total_revenue, total_gross_profit, total_expense')
    .gte('date', fromStr)
    .order('date', { ascending: true })

  if (error) throw error

  type TrendRow = Pick<
    DailySummaryRow,
    'date' | 'total_revenue' | 'total_gross_profit' | 'total_expense'
  >
  return ((data ?? []) as TrendRow[]).map((row) => ({
    date: row.date,
    omset: Number(row.total_revenue),
    profit: Number(row.total_gross_profit),
    pengeluaran: Number(row.total_expense),
  }))
}

export interface TopProduct {
  product_id: string
  product_name: string
  total_qty: number
  total_revenue: number
  total_profit: number
}

/**
 * Get top N selling products for a date range.
 * Calls the `get_top_products` Postgres function via RPC.
 */
export async function getTopProducts(from: Date, to: Date, limit = 5): Promise<TopProduct[]> {
  const startDate = from.toISOString().split('T')[0]
  const endDate = to.toISOString().split('T')[0]

  const { data, error } = await db.rpc('get_top_products', {
    start_date: startDate,
    end_date: endDate,
    limit_n: limit,
  })

  if (error) throw error
  return (data ?? []) as TopProduct[]
}
