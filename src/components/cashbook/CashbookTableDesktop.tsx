import { CheckCircle2, Edit3, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PaymentMethodBadge, StatusBadge, TransactionBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionDetailModal } from '@/components/ui/TransactionDetailModal'
import { TransactionDetails } from '@/components/ui/TransactionItemsDisplay'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Profile, TransactionWithItems } from '@/types'

interface CashbookTableDesktopProps {
  transactions: TransactionWithItems[]
  isAdmin: boolean
  isLoading: boolean
  onEditTransaction: (tx: TransactionWithItems) => void
  onDeleteTransaction: (id: string) => void
  onSelectCashierProfile: (profile: Partial<Profile>) => void
  onUpdateStatus?: (id: string, status: 'success' | 'pending') => void
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
              // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton relies on index
              <tr key={k}>
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                {isAdmin && (
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                )}
                <td className="py-3 px-4">
                  <div className="flex justify-end">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </td>
                {isAdmin && (
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      <Skeleton className="h-4 w-20" />
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

export function CashbookTableDesktop({
  transactions,
  isAdmin,
  isLoading,
  onEditTransaction,
  onDeleteTransaction,
  onSelectCashierProfile,
  onUpdateStatus,
}: CashbookTableDesktopProps) {
  const [viewingTx, setViewingTx] = useState<TransactionWithItems | null>(null)

  if (isLoading) return <TableSkeleton isAdmin={isAdmin} />

  return (
    <>
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
                <tr
                  key={tx.id}
                  onClick={() => setViewingTx(tx)}
                  className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-neutral-500 whitespace-nowrap tabular-nums">
                    {formatDateTime(tx.transaction_at as string)}
                  </td>
                  <td className="py-3 px-4 max-w-xs align-top">
                    <TransactionDetails transaction={tx} />
                  </td>
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col items-start gap-1">
                      <TransactionBadge type={tx.type} />
                      {tx.type === 'sale' && (
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
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectCashierProfile(tx.profiles as Partial<Profile>)
                        }}
                        className="hover:text-primary transition-colors focus:outline-none"
                      >
                        {tx.profiles?.full_name ?? 'Sistem'}
                      </button>
                    </td>
                  )}
                  <td
                    className={`py-3 px-4 text-right font-semibold tabular-nums align-top ${
                      tx.type === 'sale' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {tx.type === 'sale' ? '+' : '−'}
                    {formatRupiah(tx.total_amount)}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right tabular-nums text-neutral-600 align-top">
                      {tx.type === 'sale' ? formatRupiah(tx.total_profit) : '-'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right align-top">
                    {!tx.isOfflinePending ? (
                      <div className="flex justify-end items-center gap-1">
                        {tx.type === 'sale' && tx.status === 'pending' && onUpdateStatus && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdateStatus(tx.id, 'success')
                            }}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center border border-transparent hover:border-emerald-200"
                            title="Tandai Selesai"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditTransaction(tx)
                              }}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteTransaction(tx.id)
                              }}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-neutral-400 block mt-1">
                        Menunggu Sinkronisasi
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionDetailModal
        isOpen={!!viewingTx}
        onClose={() => setViewingTx(null)}
        transaction={viewingTx}
      />
    </>
  )
}
