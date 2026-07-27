import { createFileRoute, redirect } from '@tanstack/react-router'
import { Calendar, DollarSign, ShoppingBag, ShoppingCart, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionBadge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import type { DashboardPeriod } from '@/hooks/useDashboard'
import { useKPISummary, useMonthlyTrend, useTopProducts } from '@/hooks/useDashboard'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTime } from '@/lib/utils'
import { useTransactions } from '@/hooks/useTransactions'

// ============================================================
// /dashboard — Admin only
// ============================================================

export const Route = createFileRoute('/_auth/dashboard')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profileData = profile as { role: 'admin' | 'kasir' } | null
    if (profileData?.role !== 'admin') {
      throw redirect({ to: '/kasir' })
    }
  },
  component: DashboardPage,
})

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: 'Hari Ini',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
  custom: 'Custom',
}

const DISPLAY_PERIODS: DashboardPeriod[] = ['today', 'week', 'month']

function DashboardPage() {
  const { profile } = useAuth()
  const [period, setPeriod] = useState<DashboardPeriod>('today')

  const { data: kpi, isLoading: kpiLoading } = useKPISummary(period)
  const { data: trend, isLoading: trendLoading } = useMonthlyTrend()
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts('month')
  const { data: recentTransactions, isLoading: recentLoading } = useTransactions({ limit: 10 })

  const netCashflow = (kpi?.omset ?? 0) - (kpi?.pengeluaran ?? 0)

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Selamat datang, {profile?.full_name ?? '—'}
          </p>
        </div>

        {/* Period Selector */}
        <div>
          <CustomSelect
            value={period}
            onChange={(val) => setPeriod(val as DashboardPeriod)}
            options={DISPLAY_PERIODS.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Total Omset"
          value={kpi ? formatRupiah(kpi.omset) : null}
          isLoading={kpiLoading}
          icon={TrendingUp}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <KPICard
          label="Profit Kotor"
          value={kpi ? formatRupiah(kpi.profit) : null}
          isLoading={kpiLoading}
          icon={DollarSign}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <KPICard
          label="Total Pengeluaran"
          value={kpi ? formatRupiah(kpi.pengeluaran) : null}
          isLoading={kpiLoading}
          icon={TrendingDown}
          iconColor="text-danger"
          iconBg="bg-danger/10"
        />
        <KPICard
          label="Profit Bersih"
          value={kpi ? formatRupiah(netCashflow) : null}
          isLoading={kpiLoading}
          icon={ShoppingBag}
          iconColor={netCashflow >= 0 ? 'text-success' : 'text-danger'}
          iconBg={netCashflow >= 0 ? 'bg-success/10' : 'bg-danger/10'}
          sublabel={`${kpi?.transactionCount ?? 0} transaksi`}
        />
      </div>

      {/* Charts + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 app-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-neutral-900">Tren 30 Hari Terakhir</h2>
            <Calendar size={16} className="text-neutral-400" />
          </div>
          <div className="flex-1 flex flex-col justify-end">
            {trendLoading ? (
              <div className="flex items-end gap-1 flex-1 min-h-[9rem]">
                {['h-[40%]', 'h-[60%]', 'h-[30%]', 'h-[80%]', 'h-[50%]', 'h-[70%]', 'h-[40%]'].map(
                  (h, i) => (
                    <div
                      key={`bar-${i}`}
                      className="flex-1 flex flex-col items-center gap-1 group h-full"
                    >
                      <div className="relative w-full flex flex-col-reverse h-full">
                        <Skeleton className={`w-full ${h} rounded-t-sm rounded-b-none`} />
                      </div>
                      <Skeleton className="h-2.5 w-4 rounded-sm" />
                    </div>
                  ),
                )}
              </div>
            ) : trend?.length ? (
              <TrendBars data={trend} />
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Belum ada data tren"
                description="Data tren akan muncul setelah ada transaksi"
              />
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="app-card p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-5">Produk Terlaris</h2>
          {topProductsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : topProducts?.length ? (
            <ul className="space-y-3">
              {topProducts.map((p, idx) => (
                <li key={p.product_id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500 flex items-center justify-center flex-shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 font-medium truncate">
                      {p.product_name}
                    </p>
                    <p className="text-xs text-neutral-400 tabular-nums">{p.total_qty}x terjual</p>
                  </div>
                  <span className="text-xs font-semibold text-success tabular-nums flex-shrink-0">
                    {formatRupiah(p.total_revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="Belum ada data"
              description={`Produk terlaris ${PERIOD_LABELS[period].toLowerCase()} akan muncul di sini`}
            />
          )}
        </div>
      </div>

      {/* Recent Transactions Widget */}
      <div className="mt-6 app-card p-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-5">10 Transaksi Terbaru</h2>

        {recentLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-5 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : recentTransactions?.length ? (
          <>
            {/* Mobile View: Card List */}
            <div className="flex flex-col gap-3 md:hidden">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 bg-neutral-50/50 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'penjualan' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {tx.type === 'penjualan' ? <ShoppingCart size={18} /> : <Wallet size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {tx.type === 'penjualan'
                          ? tx.transaction_items?.map((i) => i.product_name).join(', ') || 'Penjualan'
                          : tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span className="tabular-nums font-medium">{formatTime(tx.transaction_at)}</span>
                        <span>•</span>
                        <span className="truncate">{tx.profiles?.full_name ?? 'Sistem'}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums ml-3 flex-shrink-0 ${
                      tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {tx.type === 'penjualan' ? '+' : '−'}
                    {formatRupiah(tx.total_amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop View: Compact Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50/80 border-b border-neutral-200">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide rounded-tl-lg">
                      Waktu
                    </th>
                    <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Keterangan
                    </th>
                    <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Tipe
                    </th>
                    <th className="text-right py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide rounded-tr-lg">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                        {formatTime(tx.transaction_at)}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-900 font-medium max-w-[200px] truncate">
                        {tx.type === 'penjualan'
                          ? tx.transaction_items?.map((i) => i.product_name).join(', ') || 'Penjualan'
                          : tx.description}
                      </td>
                      <td className="py-2.5 px-4">
                        <TransactionBadge type={tx.type} />
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                          tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {tx.type === 'penjualan' ? '+' : '−'}
                        {formatRupiah(tx.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="Belum ada transaksi"
            description="Transaksi terbaru akan muncul di sini"
          />
        )}
      </div>
    </div>
  )
}

// ============================================================
// Simple bar sparkline — no external chart lib needed
// ============================================================
function TrendBars({
  data,
}: {
  data: Array<{ date: string; omset: number; profit: number; pengeluaran: number }>
}) {
  const maxVal = Math.max(...data.map((d) => d.omset), 1)
  const last7 = data.slice(-7)

  return (
    <div className="space-y-3 h-full flex flex-col justify-end">
      {/* Bar chart */}
      <div className="flex items-end gap-1 flex-1 min-h-[9rem]">
        {last7.map((d) => {
          const heightPct = Math.round((d.omset / maxVal) * 100)
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex flex-col-reverse" style={{ height: '100%' }}>
                {/* Omset bar */}
                <div
                  className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary/40 transition-colors relative"
                  style={{ height: `${heightPct}%` }}
                  title={`${d.date}: ${formatRupiah(d.omset)}`}
                >
                  {/* Profit overlay */}
                  <div
                    className="absolute bottom-0 inset-x-0 bg-primary rounded-t-sm"
                    style={{
                      height: `${Math.round((d.profit / (d.omset || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-[9px] text-neutral-400 tabular-nums">
                {new Date(d.date).getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary/20 inline-block" />
          Omset
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
          Profit
        </span>
        <span className="text-neutral-400 ml-auto">{data.length} hari data</span>
      </div>
    </div>
  )
}
