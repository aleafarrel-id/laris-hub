import { Edit3, Trash2, CheckCircle2 } from 'lucide-react'
import { TransactionBadge, PaymentMethodBadge, StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionDetails } from '@/components/ui/TransactionItemsDisplay'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Profile, TransactionWithProfile, TransactionWithItems } from '@/types'

interface BukuKasTableDesktopProps {
  transactions: TransactionWithProfile[]
  isAdmin: boolean
  isLoading: boolean
  onEditTransaction: (tx: TransactionWithItems) => void
  onDeleteTransaction: (id: string) => void
  onSelectKasirProfile: (profile: Partial<Profile>) => void
  onUpdateStatus?: (id: string, status: 'sukses' | 'pending') => void
}

const TABLE_SKELETON_ROWS = 5

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

export function BukuKasTableDesktop({
  transactions,
  isAdmin,
  isLoading,
  onEditTransaction,
  onDeleteTransaction,
  onSelectKasirProfile,
  onUpdateStatus,
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
              <th className="w-32" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-3 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                  {formatDateTime(tx.transaction_at)}
                </td>
                <td className="py-3 px-4 max-w-xs align-top">
                  <TransactionDetails transaction={tx as unknown as TransactionWithItems} />
                </td>
                <td className="py-3 px-4 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <TransactionBadge type={tx.type} />
                    {tx.type === 'penjualan' && (
                      <div className="flex items-center gap-1">
                        <PaymentMethodBadge method={tx.payment_method} />
                        <StatusBadge status={tx.status} />
                      </div>
                    )}
                  </div>
                </td>
                {isAdmin && (
                  <td className="py-3 px-4 text-neutral-600 truncate max-w-[120px] align-top">
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
                  className={`py-3 px-4 text-right font-semibold tabular-nums align-top ${
                    tx.type === 'penjualan' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'penjualan' ? '+' : '−'}
                  {formatRupiah(tx.total_amount)}
                </td>
                {isAdmin && (
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-600 align-top">
                    {tx.type === 'penjualan' ? formatRupiah(tx.total_profit) : '-'}
                  </td>
                )}
                <td className="py-3 px-4 text-right align-top">
                  <div className="flex justify-end items-center gap-1">
                    {tx.type === 'penjualan' && tx.status === 'pending' && onUpdateStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(tx.id, 'sukses')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-semibold cursor-pointer shadow-sm active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        Selesai
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx as unknown as TransactionWithItems)}
                          className="p-1.5 rounded-lg text-neutral-300 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title="Edit Transaksi"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-neutral-300 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
