import { supabase } from '@/lib/supabase'
import type { KPISummary } from '@/types'

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

  const { data, error } = await supabase
    .from('daily_summary')
    .select('total_sales_count, total_revenue, total_gross_profit, total_expense')
    .eq('date', dateStr)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return { omzet: 0, pengeluaran: 0, profit: 0, transactionCount: 0 }
  }

  const row = data as DailySummaryRow
  return {
    omzet: Number(row.total_revenue),
    pengeluaran: Number(row.total_expense),
    profit: Number(row.total_gross_profit),
    transactionCount: Number(row.total_sales_count),
  }
}

/**
 * Get KPI summary for a custom date range.
 * Aggregates directly from transactions table.
 */
export async function getKPISummaryForRange(
  from: Date,
  to: Date,
  kasirId?: string,
): Promise<KPISummary> {
  const endOfDay = new Date(to)
  endOfDay.setHours(23, 59, 59, 999)

  let query = supabase
    .from('transactions')
    .select('type, total_amount, total_profit')
    .gte('transaction_at', from.toISOString())
    .lte('transaction_at', endOfDay.toISOString())

  if (kasirId && kasirId !== 'all') {
    query = query.eq('recorded_by', kasirId)
  }

  const { data, error } = await query

  if (error) throw error

  type Row = { type: string; total_amount: number; total_profit: number }
  return ((data ?? []) as Row[]).reduce(
    (acc, tx) => {
      if (tx.type === 'penjualan') {
        acc.omzet += Number(tx.total_amount)
        acc.profit += Number(tx.total_profit)
        acc.transactionCount += 1
      } else {
        acc.pengeluaran += Number(tx.total_amount)
      }
      return acc
    },
    { omzet: 0, pengeluaran: 0, profit: 0, transactionCount: 0 },
  )
}

export interface DailyTrendPoint {
  date: string
  omzet: number
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

  const { data, error } = await supabase
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
    omzet: Number(row.total_revenue),
    profit: Number(row.total_gross_profit),
    pengeluaran: Number(row.total_expense),
  }))
}

export async function getMonthlyTrendByKasir(
  days = 30,
  kasirId: string,
): Promise<DailyTrendPoint[]> {
  const from = new Date()
  from.setDate(from.getDate() - days + 1)
  from.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_at, type, total_amount, total_profit')
    .gte('transaction_at', from.toISOString())
    .eq('recorded_by', kasirId)

  if (error) throw error

  // Initialize days map
  const trendMap = new Map<string, DailyTrendPoint>()
  for (let i = 0; i < days; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    trendMap.set(dateStr, { date: dateStr, omzet: 0, profit: 0, pengeluaran: 0 })
  }

  // Aggregate
  for (const tx of data ?? []) {
    const d = new Date(tx.transaction_at)
    // shift to local date string equivalent
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const point = trendMap.get(dateStr)
    if (point) {
      if (tx.type === 'penjualan') {
        point.omzet += Number(tx.total_amount)
        point.profit += Number(tx.total_profit)
      } else {
        point.pengeluaran += Number(tx.total_amount)
      }
    }
  }

  return Array.from(trendMap.values())
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

  const { data, error } = await supabase.rpc('get_top_products', {
    start_date: startDate,
    end_date: endDate,
    limit_n: limit,
  })

  if (error) throw error
  return (data ?? []) as TopProduct[]
}

export async function getTopProductsByKasir(
  from: Date,
  to: Date,
  kasirId: string,
  limit = 5,
): Promise<TopProduct[]> {
  const endOfDay = new Date(to)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('transaction_items')
    .select(`
      quantity, selling_price, product_hpp, product_name, product_id,
      transactions!inner ( transaction_at, recorded_by, type )
    `)
    .eq('transactions.type', 'penjualan')
    .eq('transactions.recorded_by', kasirId)
    .gte('transactions.transaction_at', from.toISOString())
    .lte('transactions.transaction_at', endOfDay.toISOString())

  if (error) throw error

  const productMap = new Map<string, TopProduct>()

  for (const item of data ?? []) {
    const id = item.product_id
    if (!id) continue
    if (!productMap.has(id)) {
      productMap.set(id, {
        product_id: id,
        product_name: item.product_name,
        total_qty: 0,
        total_revenue: 0,
        total_profit: 0,
      })
    }
    const p = productMap.get(id)!
    p.total_qty += Number(item.quantity)
    const rev = Number(item.quantity) * Number(item.selling_price)
    const cost = Number(item.quantity) * Number(item.product_hpp)
    p.total_revenue += rev
    p.total_profit += rev - cost
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, limit)
}
