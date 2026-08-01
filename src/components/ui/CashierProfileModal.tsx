import { MapPin, Phone, ShoppingCart, TrendingUp, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTransactions } from '@/hooks/useTransactions'
import { formatRupiah } from '@/lib/utils'
import type { Profile } from '@/types'

interface CashierProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Partial<Profile> | null
}

export function CashierProfileModal({ isOpen, onClose, profile }: CashierProfileModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [cachedProfile, setCachedProfile] = useState<Partial<Profile> | null>(profile)

  useEffect(() => {
    if (profile) {
      setCachedProfile(profile)
    }
  }, [profile])

  const { data: transactions, isLoading } = useTransactions({
    recordedBy: cachedProfile?.id,
  })

  const stats = useMemo(() => {
    if (!transactions?.data) return { omzet: 0, count: 0, profit: 0 }

    let omzet = 0
    let count = 0
    let profit = 0

    for (const tx of transactions.data) {
      if (tx.type === 'penjualan') {
        omzet += tx.total_amount
        profit += Number((tx as any).total_profit) || 0
        count++
      }
    }

    return { omzet, count, profit }
  }, [transactions])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Akun Kasir"
      variant={isDesktop ? 'center' : 'bottom'}
    >
      {cachedProfile && (
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-sm ring-1 ring-neutral-100">
            {cachedProfile.avatar_url ? (
              <img
                src={cachedProfile.avatar_url}
                alt={cachedProfile.full_name || 'Kasir'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={40} className="text-primary" strokeWidth={1.5} />
            )}
          </div>

          <h3 className="text-xl font-bold text-neutral-900 mb-1">
            {cachedProfile.full_name || 'Sistem'}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-6 bg-neutral-100 px-3 py-1 rounded-full">
            <MapPin size={14} />
            <span className="font-medium">Akun Lapak (Kasir)</span>
          </div>

          {cachedProfile.phone && (
            <div className="w-full flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-neutral-100 text-neutral-500">
                <Phone size={18} />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs text-neutral-400 font-medium">Nomor Telepon</p>
                <p className="text-sm font-semibold text-neutral-700">{cachedProfile.phone}</p>
              </div>
            </div>
          )}

          <div className="w-full grid grid-cols-2 gap-3">
            <div className="bg-success/5 border border-success/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mb-2">
                <TrendingUp size={20} />
              </div>
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Total Omzet
              </p>
              {isLoading ? (
                <Skeleton className="w-20 h-6" />
              ) : (
                <p className="text-lg font-bold text-success tabular-nums">
                  {formatRupiah(stats.omzet)}
                </p>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <ShoppingCart size={20} />
              </div>
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Total Transaksi
              </p>
              {isLoading ? (
                <Skeleton className="w-12 h-6" />
              ) : (
                <p className="text-lg font-bold text-primary tabular-nums">{stats.count}x</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
