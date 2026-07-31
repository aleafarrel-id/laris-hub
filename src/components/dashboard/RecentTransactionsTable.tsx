import { Edit3, ShoppingBag, ShoppingCart, Trash2, Wallet } from 'lucide-react'
import { TransactionBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { TransactionItemsMobileDisplay } from '@/components/ui/TransactionItemsDisplay'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatRupiah, formatTime } from '@/lib/utils'
import type { Profile, TransactionWithProfile, TransactionWithItems } from '@/types'

interface RecentTransactionsTableProps {
  transactions: TransactionWithProfile[] | undefined
  isLoading: boolean
  isAdmin: boolean
  onEditTransaction: (tx: TransactionWithItems) => void
  onDeleteTransaction: (id: string) => void
  onSelectKasirProfile: (profile: Partial<Profile>) => void
}

export function RecentTransactionsTable({
  transactions,
  isLoading,
  isAdmin,
  onEditTransaction,
  onDeleteTransaction,
  onSelectKasirProfile,
}: RecentTransactionsTableProps) {
  if (isLoading) {
    return (
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
    )
  }

  if (!transactions?.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Belum ada transaksi"
        description="Transaksi terbaru akan muncul di sini"
      />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-3.5 bg-neutral-50/50 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors relative"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'penjualan' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              {tx.type === 'penjualan' ? <ShoppingCart size={18} /> : <Wallet size={18} />}
            </div>
            {isAdmin && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onEditTransaction(tx as TransactionWithItems)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit Transaksi"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTransaction(tx.id)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Hapus Transaksi"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-sm font-medium text-neutral-900 pr-12">
                <TransactionItemsMobileDisplay transaction={tx as unknown as TransactionWithItems} />
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
                    onClick={() => onSelectKasirProfile(tx.profiles as Partial<Profile>)}
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
              <th className="text-right py-2.5 px-4 font-semibold text-neutral-500 text-xs uppercase tracking-wide rounded-tr-lg w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {transactions.map((tx) => (
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
                              {EXPENSE_CATEGORY_LABELS[tx.expense_category as ExpenseCategory]}
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
                    onClick={() => onSelectKasirProfile(tx.profiles as Partial<Profile>)}
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
                      onClick={() => onEditTransaction(tx as TransactionWithItems)}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
