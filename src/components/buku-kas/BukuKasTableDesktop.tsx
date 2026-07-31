import { Edit3, Trash2 } from 'lucide-react'
import { TransactionBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionItemsDisplay } from '@/components/ui/TransactionItemsDisplay'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Profile, TransactionWithItems } from '@/types'

interface BukuKasTableDesktopProps {
  transactions: TransactionWithItems[]
  isAdmin: boolean
  isLoading: boolean
  onEditTransaction: (tx: TransactionWithItems) => void
  onDeleteTransaction: (id: string) => void
  onSelectKasirProfile: (profile: Partial<Profile>) => void
}

const TABLE_SKELETON_ROWS = 5

/** Desktop table skeleton while transactions are loading. */
function TableSkeleton({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="app-card overflow-hidden hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <TableHeader>Waktu</TableHeader>
              <TableHeader>Keterangan</TableHeader>
              <TableHeader>Tipe</TableHeader>
              {isAdmin && <TableHeader>Kasir</TableHeader>}
              <TableHeader align="right">Jumlah</TableHeader>
              {isAdmin && <TableHeader align="right">Profit</TableHeader>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: TABLE_SKELETON_ROWS }, (_, k) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <tr key={k}>
                <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-48" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                {isAdmin && <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>}
                <td className="py-3 px-4"><div className="flex justify-end"><Skeleton className="h-4 w-24" /></div></td>
                {isAdmin && <td className="py-3 px-4"><div className="flex justify-end"><Skeleton className="h-4 w-20" /></div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableHeader({
  children,
  align = 'left',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`text-${align} py-3 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide`}
    >
      {children}
    </th>
  )
}

/**
 * Desktop-only table view of Buku Kas transactions.
 * Rendered only on `md:` breakpoints and above.
 */
export function BukuKasTableDesktop({
  transactions,
  isAdmin,
  isLoading,
  onEditTransaction,
  onDeleteTransaction,
  onSelectKasirProfile,
}: BukuKasTableDesktopProps) {
  if (isLoading) return <TableSkeleton isAdmin={isAdmin} />

  return (
    <div className="app-card overflow-hidden hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <TableHeader>Waktu</TableHeader>
              <TableHeader>Keterangan</TableHeader>
              <TableHeader>Tipe</TableHeader>
              {isAdmin && <TableHeader>Kasir</TableHeader>}
              <TableHeader align="right">Jumlah</TableHeader>
              {isAdmin && <TableHeader align="right">Profit</TableHeader>}
              {isAdmin && <th className="w-20" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-3 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                  {formatDateTime(tx.transaction_at)}
                </td>
                <td className="py-3 px-4 max-w-xs">
                  <div className="flex items-start gap-2 mb-0.5">
                    <div className="text-sm font-medium text-neutral-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TransactionItemsDisplay transaction={tx} />
                        {tx.type === 'pengeluaran' && tx.expense_category && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex-shrink-0">
                            {EXPENSE_CATEGORY_LABELS[tx.expense_category as ExpenseCategory]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {tx.notes && (
                    <p className="text-xs text-neutral-500 truncate italic mt-1">"{tx.notes}"</p>
                  )}
                </td>
                <td className="py-3 px-4">
                  <TransactionBadge type={tx.type} />
                </td>
                {isAdmin && (
                  <td className="py-3 px-4 text-neutral-600 truncate max-w-[120px]">
                    <button
                      type="button"
                      onClick={() => onSelectKasirProfile(tx.profiles as Partial<Profile>)}
                      className="hover:text-primary transition-colors focus:outline-none"
                    >
                      {tx.profiles?.full_name ?? 'Sistem'}
                    </button>
                  </td>
                )}
                <td
                  className={`py-3 px-4 text-right font-semibold tabular-nums ${
                    tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'penjualan' ? '+' : '−'}
                  {formatRupiah(tx.total_amount)}
                </td>
                {isAdmin && (
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-600">
                    {tx.type === 'penjualan' ? formatRupiah(tx.total_profit) : '-'}
                  </td>
                )}
                {isAdmin && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit Transaksi"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
