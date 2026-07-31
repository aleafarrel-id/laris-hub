import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  Calendar,
  DollarSign,
  Edit3,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TransactionBadge } from '@/components/ui/Badge'
import { CashierProfileModal } from '@/components/ui/CashierProfileModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { EditTransactionModal } from '@/components/ui/EditTransactionModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import type { DashboardPeriod } from '@/hooks/useDashboard'
import { useKPISummary, useMonthlyTrend, useTopProducts } from '@/hooks/useDashboard'
import { useCashiers } from '@/hooks/useProfile'
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTime } from '@/lib/utils'
import type { Profile, TransactionWithItems } from '@/types'

type DashboardSearch = {
  period?: DashboardPeriod
  kasir?: string
  customFrom?: string
  customTo?: string
}

export const Route = createFileRoute('/_auth/dashboard')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    return {
      period: (search.period as DashboardPeriod) || 'today',
      kasir: (search.kasir as string) || 'all',
      customFrom: search.customFrom as string | undefined,
      customTo: search.customTo as string | undefined,
    }
  },
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

const DISPLAY_PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'custom']

function DashboardPage() {
  const { profile } = useAuth()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const period = search.period || 'today'
  const kasirFilter = search.kasir || 'all'

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const customFrom = search.customFrom || todayStart.toISOString().split('T')[0]
  const customTo = search.customTo || new Date().toISOString().split('T')[0]

  const setPeriod = (p: DashboardPeriod) => navigate({ search: (prev) => ({ ...prev, period: p }) })
  const setKasirFilter = (k: string) => navigate({ search: (prev) => ({ ...prev, kasir: k }) })
  const setCustomFrom = (date: string) =>
    navigate({ search: (prev) => ({ ...prev, customFrom: date }) })
  const setCustomTo = (date: string) =>
    navigate({ search: (prev) => ({ ...prev, customTo: date }) })

  const [selectedKasirProfile, setSelectedKasirProfile] = useState<Partial<Profile> | null>(null)
  const { data: cashiers } = useCashiers()

  const isAdmin = profile?.role === 'admin'

  const customRange =
    period === 'custom'
      ? { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) }
      : undefined

  const { data: kpi, isLoading: kpiLoading } = useKPISummary(period, customRange, kasirFilter)
  const { data: trend, isLoading: trendLoading } = useMonthlyTrend(30, kasirFilter)
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts(
    period,
    customRange,
    5,
    kasirFilter,
  )
  const { data: recentTransactions, isLoading: recentLoading } = useTransactions({
    limit: 10,
    recordedBy: kasirFilter !== 'all' ? kasirFilter : undefined,
  })

  const deleteTxMutation = useDeleteTransaction()
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<TransactionWithItems | null>(null)

  const netCashflow = (kpi?.omzet ?? 0) - (kpi?.pengeluaran ?? 0)

  return (
    <div className="page-container">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between min-w-0 gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Selamat datang, {profile?.full_name ?? '-'}
              </p>
            </div>
            <Link
              to="/profil"
              className="md:hidden flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-[0.96] transition-all"
              aria-label="Profil Admin"
            >
              <User size={18} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {period === 'custom' && (
              <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl p-1.5 shadow-sm">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none transition-all cursor-pointer"
                />
                <span className="text-neutral-400 text-xs font-semibold px-1">s/d</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none transition-all cursor-pointer"
                />
              </div>
            )}

            <CustomSelect
              value={kasirFilter}
              onChange={setKasirFilter}
              options={[
                { value: 'all', label: 'Semua Kasir' },
                ...(cashiers?.map((c) => ({ value: c.id, label: c.full_name })) ?? []),
              ]}
            />
            <CustomSelect
              value={period}
              onChange={(val) => setPeriod(val as DashboardPeriod)}
              options={DISPLAY_PERIODS.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Total Omzet"
            value={kpi ? formatRupiah(kpi.omzet) : null}
            isLoading={kpiLoading}
            icon={TrendingUp}
            iconColor="text-primary"
            iconBg="bg-primary/10"
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
            label="Profit Kotor"
            value={kpi ? formatRupiah(kpi.profit) : null}
            isLoading={kpiLoading}
            icon={ArrowLeftRight}
            iconColor="text-success"
            iconBg="bg-success/10"
          />
          <KPICard
            label="Profit Bersih"
            value={kpi ? formatRupiah(netCashflow) : null}
            isLoading={kpiLoading}
            icon={DollarSign}
            iconColor={netCashflow >= 0 ? 'text-success' : 'text-danger'}
            iconBg={netCashflow >= 0 ? 'bg-success/10' : 'bg-danger/10'}
            sublabel={`${kpi?.transactionCount ?? 0} transaksi`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="app-card p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-1">Produk Terlaris</h2>
          <p className="text-xs text-neutral-400 mb-4">
            Distribusi penjualan {PERIOD_LABELS[period].toLowerCase()}
          </p>
          {topProductsLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-40 h-40 rounded-full" />
              <div className="w-full space-y-2">
                {[1, 2, 3, 4, 5].map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-sm flex-shrink-0" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-3 w-10 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : topProducts?.length ? (
            <TopProductsDonutChart products={topProducts} />
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="Belum ada data"
              description={`Produk terlaris ${PERIOD_LABELS[period].toLowerCase()} akan muncul di sini`}
            />
          )}
        </div>
      </div>

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
            <div className="flex flex-col gap-3 md:hidden">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3.5 bg-neutral-50/50 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors relative"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'penjualan'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    {tx.type === 'penjualan' ? <ShoppingCart size={18} /> : <Wallet size={18} />}
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setEditingTx(tx as TransactionWithItems)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit Transaksi"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTxId(tx.id)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-sm font-medium text-neutral-900 pr-12">
                      {tx.type === 'penjualan' ? (
                        <div className="flex flex-col gap-0.5">
                          {tx.transaction_items && tx.transaction_items.length > 1 ? (
                            tx.transaction_items.map((i, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 min-w-0">
                                <span className="text-neutral-400 flex-shrink-0">•</span>
                                <span className="truncate">
                                  {i.product_name}{' '}
                                  <span className="text-neutral-400 font-normal tabular-nums text-xs">
                                    x{i.quantity}
                                  </span>
                                </span>
                              </div>
                            ))
                          ) : tx.transaction_items?.length === 1 ? (
                            <p className="truncate">
                              {tx.transaction_items[0].product_name}{' '}
                              <span className="text-neutral-400 font-normal tabular-nums text-xs">
                                x{tx.transaction_items[0].quantity}
                              </span>
                            </p>
                          ) : (
                            <p className="truncate">Penjualan</p>
                          )}
                        </div>
                      ) : (
                        <p className="truncate">{tx.description}</p>
                      )}
                    </div>

                    {(tx.expense_category || tx.notes) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {tx.type === 'pengeluaran' && tx.expense_category && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex-shrink-0">
                            {EXPENSE_CATEGORY_LABELS[tx.expense_category as ExpenseCategory]}
                          </span>
                        )}
                        {tx.notes && (
                          <p className="text-xs text-neutral-500 truncate italic">"{tx.notes}"</p>
                        )}
                      </div>
                    )}

                    {tx.profiles && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedKasirProfile(tx.profiles as Partial<Profile>)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold"
                        >
                          <span className="truncate max-w-[120px]">{tx.profiles.full_name}</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-1.5 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400 tabular-nums pb-0.5">
                          {formatTime(tx.transaction_at)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end leading-tight">
                        <span
                          className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                            tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {tx.type === 'penjualan' ? '+' : '−'}
                          {formatRupiah(tx.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
                    <th className="text-left py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Kasir
                    </th>
                    <th className="text-right py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide">
                      Jumlah
                    </th>
                    <th className="text-right py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide rounded-tr-lg w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                        {formatTime(tx.transaction_at)}
                      </td>
                      <td className="py-2.5 px-4 max-w-[200px]">
                        <div className="flex items-start gap-2 mb-0.5">
                          <div className="text-sm font-medium text-neutral-900">
                            {tx.type === 'penjualan' ? (
                              <div className="flex flex-col gap-0.5">
                                {tx.transaction_items && tx.transaction_items.length > 1 ? (
                                  tx.transaction_items.map((i, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className="text-neutral-400">•</span>
                                      <span>
                                        {i.product_name}{' '}
                                        <span className="text-neutral-400 tabular-nums">
                                          x{i.quantity}
                                        </span>
                                      </span>
                                    </div>
                                  ))
                                ) : tx.transaction_items?.length === 1 ? (
                                  <span>
                                    {tx.transaction_items[0].product_name}{' '}
                                    <span className="text-neutral-400 tabular-nums">
                                      x{tx.transaction_items[0].quantity}
                                    </span>
                                  </span>
                                ) : (
                                  <span>Penjualan</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{tx.description}</span>
                                {tx.type === 'pengeluaran' && tx.expense_category && (
                                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex-shrink-0">
                                    {
                                      EXPENSE_CATEGORY_LABELS[
                                        tx.expense_category as ExpenseCategory
                                      ]
                                    }
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {tx.notes && (
                          <p className="text-xs text-neutral-500 truncate italic">"{tx.notes}"</p>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <TransactionBadge type={tx.type} />
                      </td>
                      <td className="py-2.5 px-4 text-neutral-600 truncate max-w-[120px]">
                        <button
                          type="button"
                          onClick={() => setSelectedKasirProfile(tx.profiles as Partial<Profile>)}
                          className="hover:text-primary transition-colors focus:outline-none"
                        >
                          {tx.profiles?.full_name ?? 'Sistem'}
                        </button>
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                          tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {tx.type === 'penjualan' ? '+' : '−'}
                        {formatRupiah(tx.total_amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingTx(tx as TransactionWithItems)}
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Edit Transaksi"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTxId(tx.id)}
                            className="p-1.5 rounded-lg text-neutral-300 hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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

      <CashierProfileModal
        isOpen={!!selectedKasirProfile}
        onClose={() => setSelectedKasirProfile(null)}
        profile={selectedKasirProfile}
      />

      <ConfirmDialog
        isOpen={!!deletingTxId}
        title="Hapus Transaksi?"
        description="Data transaksi ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan dan akan mempengaruhi laporan keuangan."
        confirmText={deleteTxMutation.isPending ? 'Menghapus...' : 'Hapus'}
        onConfirm={() => {
          if (deletingTxId) {
            deleteTxMutation.mutate(deletingTxId, {
              onSuccess: () => setDeletingTxId(null),
            })
          }
        }}
        onCancel={() => setDeletingTxId(null)}
      />

      <EditTransactionModal
        transaction={editingTx}
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
      />
    </div>
  )
}

// ─── Donut Chart: Top Products ────────────────────────────────────────────────

/** Harmonious 5-color palette aligned to the Laris Hub brand */
const CHART_COLORS = ['#0F766E', '#285EAF', '#6366F1', '#10B981', '#F59E0B']

function TopProductsDonutChart({
  products,
}: {
  products: Array<{
    product_id: string
    product_name: string
    total_qty: number
    total_revenue: number
  }>
}) {
  const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0)
  const totalQty = products.reduce((sum, p) => sum + p.total_qty, 0)

  const chartData = products.map((p, idx) => ({
    ...p,
    color: CHART_COLORS[idx % CHART_COLORS.length],
    percentage: totalRevenue > 0 ? Math.round((p.total_revenue / totalRevenue) * 100) : 0,
  }))

  return (
    <div className="flex flex-col gap-4">
      {/* Donut chart */}
      <div className="relative flex items-center justify-center">
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <span className="text-xl font-bold text-neutral-900 tabular-nums leading-none">
            {totalQty}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium mt-0.5">total terjual</span>
        </div>

        <ResponsiveContainer width="100%" height={180} className="z-10">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={3}
              dataKey="total_revenue"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={700}
            >
              {chartData.map((entry) => (
                <Cell key={entry.product_id} fill={entry.color} style={{ outline: 'none' }} />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-white border border-neutral-100 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-semibold text-neutral-900 truncate">
                        {d.product_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-500">
                      <span>Terjual</span>
                      <span className="font-semibold tabular-nums text-neutral-900">
                        {d.total_qty}x
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-500 mt-0.5">
                      <span>Revenue</span>
                      <span className="font-semibold tabular-nums text-success">
                        {formatRupiah(d.total_revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-500 mt-0.5">
                      <span>Porsi</span>
                      <span className="font-bold tabular-nums text-primary">{d.percentage}%</span>
                    </div>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {chartData.map((p) => (
          <div key={p.product_id} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-xs text-neutral-700 flex-1 truncate font-medium">
              {p.product_name}
            </span>
            <span className="text-[10px] text-neutral-400 tabular-nums flex-shrink-0">
              {p.total_qty}x
            </span>
            <span className="text-xs font-semibold text-success tabular-nums flex-shrink-0">
              {formatRupiah(p.total_revenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bar Chart: 30-Day Trend ──────────────────────────────────────────────────

function TrendBars({
  data,
}: {
  data: Array<{ date: string; omzet: number; profit: number; pengeluaran: number }>
}) {
  const last7 = data.slice(-7).map((d) => ({
    ...d,
    shortDate: new Date(d.date).getDate().toString(),
  }))

  return (
    <div className="space-y-3 h-full flex flex-col justify-end pt-4">
      <div className="flex-1 min-h-[14rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="shortDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#A3A3A3' }}
              dy={10}
            />
            <YAxis
              width={50}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#A3A3A3' }}
              tickFormatter={(val) => {
                if (val >= 1000000) return `Rp${(val / 1000000).toFixed(1)}M`
                if (val >= 1000) return `Rp${(val / 1000).toFixed(0)}K`
                return val
              }}
            />
            <Tooltip
              cursor={{ fill: '#f5f5f5' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-neutral-100 text-sm">
                      <p className="font-bold text-neutral-900 mb-2">{label}</p>
                      {payload.map((entry) => (
                        <div
                          key={entry.dataKey}
                          className="flex items-center justify-between gap-4 py-1"
                        >
                          <span className="flex items-center gap-1.5 text-neutral-500">
                            <span
                              className="w-2.5 h-2.5 rounded-sm inline-block"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}
                          </span>
                          <span className="font-semibold tabular-nums text-neutral-900">
                            {formatRupiah(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={0} stroke="#E5E5E5" />
            <Bar dataKey="omzet" name="Omzet" fill="rgba(40, 94, 175, 0.2)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="Profit" fill="#285EAF" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 text-xs text-neutral-500 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary/20 inline-block" />
          Omzet
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
