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
import { formatRupiah } from '@/lib/utils'
import type { TopProduct } from '@/services/dashboard.service'

// ─── Donut Chart: Top Products ────────────────────────────────────────────────

/** Harmonious 5-color palette aligned to the Laris Hub brand */
const CHART_COLORS = ['#0F766E', '#285EAF', '#6366F1', '#10B981', '#F59E0B']

export function TopProductsDonutChart({ products }: { products: TopProduct[] }) {
  const totalRevenue = products.reduce((sum, product) => sum + product.total_revenue, 0)
  const totalQty = products.reduce((sum, product) => sum + product.total_qty, 0)

  const chartData = products.map((product, index) => ({
    ...product,
    color: CHART_COLORS[index % CHART_COLORS.length],
    percentage: totalRevenue > 0 ? Math.round((product.total_revenue / totalRevenue) * 100) : 0,
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
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.product_id}-${index}`}
                  fill={entry.color}
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const dataPoint = payload[0].payload
                return (
                  <div className="bg-white border border-neutral-100 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: dataPoint.color }}
                      />
                      <span className="font-semibold text-neutral-900 truncate">
                        {dataPoint.product_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-500">
                      <span>Terjual</span>
                      <span className="font-semibold tabular-nums text-neutral-900">
                        {dataPoint.total_qty}x
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-500 mt-0.5">
                      <span>Revenue</span>
                      <span className="font-semibold tabular-nums text-success">
                        {formatRupiah(dataPoint.total_revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-500 mt-0.5">
                      <span>Porsi</span>
                      <span className="font-bold tabular-nums text-primary">
                        {dataPoint.percentage}%
                      </span>
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
        {chartData.map((product, index) => (
          <div key={`${product.product_id}-${index}`} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: product.color }}
            />
            <span className="text-xs text-neutral-700 flex-1 truncate font-medium">
              {product.product_name}
            </span>
            <span className="text-[10px] text-neutral-400 tabular-nums flex-shrink-0">
              {product.total_qty}x
            </span>
            <span className="text-xs font-semibold text-success tabular-nums flex-shrink-0">
              {formatRupiah(product.total_revenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bar Chart: 30-Day Trend ──────────────────────────────────────────────────

interface TrendDataPoint {
  date: string
  omzet: number
  profit: number
  pengeluaran: number
}

export function TrendBarsChart({ data }: { data: TrendDataPoint[] }) {
  const last7 = data.slice(-7).map((dataPoint) => ({
    ...dataPoint,
    shortDate: new Date(dataPoint.date).getDate().toString(),
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
