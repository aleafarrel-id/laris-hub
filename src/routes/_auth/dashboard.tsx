import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { RecentTransactionsTable } from '@/components/dashboard/RecentTransactionsTable'
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
import {
  useDeleteTransaction,
  useTransactions,
  useUpdateTransactionStatus,
} from '@/hooks/useTransactions'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import type { Profile, TransactionWithItems } from '@/types'

const DashboardCharts = lazy(() =>
  import('@/components/dashboard/DashboardCharts').then((mod) => ({
    default: mod.TopProductsDonutChart,
  })),
)
const DashboardTrendChart = lazy(() =>
  import('@/components/dashboard/DashboardCharts').then((mod) => ({
    default: mod.TrendBarsChart,
  })),
)

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

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const customFrom = search.customFrom || getLocalDateString(new Date())
  const customTo = search.customTo || getLocalDateString(new Date())

  const setPeriod = (p: DashboardPeriod) => navigate({ search: (prev) => ({ ...prev, period: p }) })
  const setKasirFilter = (k: string) => navigate({ search: (prev) => ({ ...prev, kasir: k }) })
  const setCustomFrom = (date: string) =>
    navigate({ search: (prev) => ({ ...prev, customFrom: date }) })
  const setCustomTo = (date: string) =>
    navigate({ search: (prev) => ({ ...prev, customTo: date }) })

  const { data: cashiers } = useCashiers()
  const [selectedKasirProfile, setSelectedKasirProfile] = useState<Partial<Profile> | null>(null)

  const customRange = useMemo(() => {
    return period === 'custom'
      ? { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) }
      : undefined
  }, [period, customFrom, customTo])

  const { data: kpi, isLoading: kpiLoading } = useKPISummary(period, customRange, kasirFilter)
  const { data: trend, isLoading: trendLoading } = useMonthlyTrend(30, kasirFilter)
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts(
    period,
    customRange,
    5,
    kasirFilter,
  )
  const { data: recentTransactionsResult, isLoading: recentLoading } = useTransactions({
    limit: 10,
    recordedBy: kasirFilter !== 'all' ? kasirFilter : undefined,
  })

  const recentTransactions = recentTransactionsResult?.data

  const deleteTxMutation = useDeleteTransaction()
  const updateStatusMutation = useUpdateTransactionStatus()
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<TransactionWithItems | null>(null)

  const isAdmin = profile?.role === 'admin'
  const netProfit = (kpi?.profit ?? 0) - (kpi?.pengeluaran ?? 0)

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

        {period === 'custom' && (
          <div className="flex items-center justify-between gap-1 sm:gap-2 bg-white border border-neutral-200 rounded-xl p-1.5 shadow-sm w-full sm:w-fit mt-1">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full flex-1 min-w-0 text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-2 sm:px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none transition-all cursor-pointer"
            />
            <span className="text-neutral-400 text-xs font-semibold px-1 flex-shrink-0">s/d</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full flex-1 min-w-0 text-xs font-medium bg-neutral-50 border border-transparent rounded-lg px-2 sm:px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 focus:bg-white focus:border-primary focus:outline-none transition-all cursor-pointer"
            />
          </div>
        )}

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
            value={kpi ? formatRupiah(netProfit) : null}
            isLoading={kpiLoading}
            icon={DollarSign}
            iconColor={netProfit >= 0 ? 'text-success' : 'text-danger'}
            iconBg={netProfit >= 0 ? 'bg-success/10' : 'bg-danger/10'}
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
              <Suspense
                fallback={
                  <div className="flex items-end gap-1 flex-1 min-h-[9rem]">
                    {[
                      'h-[40%]',
                      'h-[60%]',
                      'h-[30%]',
                      'h-[80%]',
                      'h-[50%]',
                      'h-[70%]',
                      'h-[40%]',
                    ].map((h, i) => (
                      <div
                        key={`bar-${i}`}
                        className="flex-1 flex flex-col items-center gap-1 group h-full"
                      >
                        <div className="relative w-full flex flex-col-reverse h-full">
                          <Skeleton className={`w-full ${h} rounded-t-sm rounded-b-none`} />
                        </div>
                        <Skeleton className="h-2.5 w-4 rounded-sm" />
                      </div>
                    ))}
                  </div>
                }
              >
                <DashboardTrendChart data={trend} />
              </Suspense>
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
            <Suspense
              fallback={
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
              }
            >
              <DashboardCharts products={topProducts} />
            </Suspense>
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

        <RecentTransactionsTable
          transactions={recentTransactions}
          isLoading={recentLoading}
          isAdmin={isAdmin}
          onEditTransaction={setEditingTx}
          onDeleteTransaction={setDeletingTxId}
          onSelectKasirProfile={setSelectedKasirProfile}
          onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
        />
      </div>

      <CashierProfileModal
        isOpen={!!selectedKasirProfile}
        onClose={() => setSelectedKasirProfile(null)}
        profile={selectedKasirProfile}
      />

      <ConfirmDialog
        isOpen={!!deletingTxId}
        title="Hapus Transaksi?"
        description={
          <>
            <p className="text-sm text-neutral-600 leading-relaxed mb-1">
              Data transaksi ini akan dihapus permanen.
            </p>
            <p className="text-sm text-neutral-500">
              Aksi ini tidak dapat dibatalkan dan akan mempengaruhi laporan keuangan.
            </p>
          </>
        }
        confirmText={deleteTxMutation.isPending ? 'Menghapus...' : 'Hapus'}
        onConfirm={() => {
          if (deletingTxId) {
            deleteTxMutation.mutate({ id: deletingTxId }, {
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
