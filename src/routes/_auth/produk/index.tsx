import { useAutoAnimate } from '@formkit/auto-animate/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Image as ImageIcon,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  WifiOff,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { ProductForm } from '@/components/produk/ProductForm'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useDeleteProduct, useInfiniteProducts, useToggleProductStatus } from '@/hooks/useProducts'
import { MARGIN_GOOD_THRESHOLD, MARGIN_WARNING_THRESHOLD } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { calcMargin, formatRupiah } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Product } from '@/types'

export const Route = createFileRoute('/_auth/produk/')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })

    const profile = useAuthStore.getState().profile
    if (profile?.role !== 'admin') throw redirect({ to: '/kasir' })
  },
  component: ProdukPage,
})

function ProdukPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const {
    data: paginatedData,
    isLoading: isQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isOfflinePaused,
  } = useInfiniteProducts(debouncedSearch, 12) // Show 12 items per page for better grid

  // If we're offline and don't have data, we'll consider it loading but it's actually offline
  const isLoading = isQueryLoading && !isOfflinePaused

  const products = useMemo(() => {
    return paginatedData?.pages.flatMap((page) => page.data) ?? []
  }, [paginatedData])

  const totalCount = paginatedData?.pages[0]?.total ?? 0

  const { mutate: deleteProduct } = useDeleteProduct()
  const { mutate: toggleStatus } = useToggleProductStatus()

  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('laris-hub-view-mode', 'grid')
  const [listRef] = useAutoAnimate<HTMLDivElement>()

  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  })

  // activeCount is not possible to accurately calculate for the entire database without a dedicated query
  // We'll show the totalCount instead for the dashboard label.

  const handleDelete = useCallback((id: string, name: string) => {
    setConfirmState({ isOpen: true, id, name })
  }, [])

  const executeDelete = useCallback(() => {
    if (confirmState.id) {
      deleteProduct(confirmState.id)
    }
    setConfirmState({ isOpen: false, id: '', name: '' })
  }, [confirmState.id, deleteProduct])

  const openCreate = useCallback(() => {
    setEditProduct(null)
    setShowForm(true)
  }, [])

  const openEdit = useCallback((p: Product) => {
    setEditProduct(p)
    setShowForm(true)
  }, [])

  return (
    <div className="page-container">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Package size={20} className="text-primary" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Katalog Produk</h1>
            <p className="text-sm text-neutral-500 tabular-nums">Total {totalCount} produk</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftDecorator={<Search size={16} className="text-neutral-400" />}
            className="bg-white"
          />
        </div>
        <div className="flex gap-2 items-center justify-between sm:justify-start pt-1 sm:pt-0">
          <div className="flex bg-neutral-100 p-1 rounded-xl flex-shrink-0 h-[44px] items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          <Button
            type="button"
            onClick={openCreate}
            className="flex-shrink-0 h-[44px]"
            leftIcon={<Plus size={16} strokeWidth={2.5} />}
          >
            <span className="hidden sm:inline">Tambah Produk</span>
            <span className="inline sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div
          className={`grid gap-5 sm:gap-6 pb-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-2'}`}
        >
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              className={`bg-white rounded-2xl border border-neutral-100 overflow-hidden ${viewMode === 'list' ? 'flex flex-row h-[140px]' : 'flex flex-col'}`}
            >
              <Skeleton
                className={`${viewMode === 'list' ? 'w-32 h-full rounded-none flex-shrink-0' : 'w-full aspect-square rounded-none'}`}
              />
              <div
                className={`p-4 flex flex-col flex-1 ${viewMode === 'list' ? 'justify-between' : 'gap-3'}`}
              >
                <div>
                  <Skeleton className="h-5 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div
                  className={`flex items-end justify-between ${viewMode === 'list' ? '' : 'mt-auto pt-3 border-t border-dashed border-neutral-100'}`}
                >
                  <div>
                    <Skeleton className="h-2.5 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isOfflinePaused && !products.length && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <EmptyState
            icon={Package}
            title={search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            description={
              search
                ? 'Coba kata kunci pencarian yang berbeda'
                : 'Mulailah dengan menambahkan produk pertama Anda'
            }
            action={!search ? { label: 'Tambah Produk', onClick: openCreate } : undefined}
          />
        </div>
      )}

      {isOfflinePaused && !products.length && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <EmptyState
            icon={WifiOff}
            title="Katalog Tidak Tersedia"
            description="Anda sedang offline dan data katalog belum tersimpan."
            action={{ label: 'Coba Lagi', onClick: () => window.location.reload() }}
          />
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              ref={listRef}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 },
                },
                exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
              }}
              className={`grid gap-5 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-2'}`}
            >
              {products.map((product) => {
                const margin = calcMargin(product.selling_price, product.hpp)
                const marginColor =
                  margin >= MARGIN_GOOD_THRESHOLD
                    ? 'text-success bg-success/10'
                    : margin >= MARGIN_WARNING_THRESHOLD
                      ? 'text-warning bg-warning/10'
                      : 'text-danger bg-danger/10'

                return (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { type: 'spring', duration: 0.5, bounce: 0 },
                      },
                    }}
                    className={`group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 ${!product.is_active || product.isOfflinePending ? 'opacity-60 grayscale-[0.5]' : ''} ${product.isOfflinePending ? 'cursor-not-allowed border-dashed' : ''} ${viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'}`}
                  >
                    <div
                      className={`relative bg-neutral-50 overflow-hidden ${viewMode === 'list' ? 'w-36 h-full min-h-[160px] flex-shrink-0 border-r border-neutral-100' : 'w-full aspect-[4/3] border-b border-neutral-100'}`}
                    >
                      {product.image_url ? (
                        <>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="hidden w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-2 fallback-icon">
                            <ImageIcon size={32} strokeWidth={1.5} />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-2">
                          <ImageIcon size={32} strokeWidth={1.5} />
                        </div>
                      )}

                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleStatus({ id: product.id, isActive: !product.is_active })
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all ${
                            product.is_active
                              ? 'bg-white/80 text-success shadow-sm'
                              : 'bg-neutral-800/80 text-white shadow-sm'
                          }`}
                          title={
                            product.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'
                          }
                        >
                          {product.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1 gap-3 sm:gap-4 min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <h3
                          className="font-bold text-neutral-900 leading-snug line-clamp-2"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                          {product.sku ? (
                            <>
                              <Tag size={12} className="text-neutral-400 flex-shrink-0" />
                              <span className="truncate">{product.sku}</span>
                            </>
                          ) : (
                            <span className="text-neutral-400 italic">Tanpa SKU</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 mt-auto">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">
                              Harga Jual
                            </p>
                            <div
                              className={`px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ${marginColor}`}
                            >
                              <TrendingUp size={10} />
                              <span className="text-[9px] font-bold tabular-nums leading-none">
                                {margin.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <p className="font-extrabold text-neutral-900 tabular-nums leading-none text-base">
                            {formatRupiah(product.selling_price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-dashed border-neutral-200 mt-1 min-w-0">
                        {!product.isOfflinePending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="flex-1 py-2 bg-neutral-100 text-neutral-700 hover:bg-primary hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id, product.name)}
                              className="w-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 text-neutral-500 hover:bg-danger hover:text-white rounded-xl transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="flex-1 py-2 bg-neutral-100 text-neutral-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                            Menunggu Sinkronisasi
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <ProductForm product={editProduct} onSuccess={() => setShowForm(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title="Hapus Produk"
        description={
          <>
            <span>
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong className="text-neutral-900">{confirmState.name}</strong>?
            </span>
            <span className="text-sm text-neutral-500">
              Data transaksi lama yang menggunakan produk ini akan tetap tersimpan dengan aman.
            </span>
          </>
        }
        confirmText="Hapus"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: '', name: '' })}
      />
    </div>
  )
}
