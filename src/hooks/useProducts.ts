import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import type { ProductFormData } from '@/lib/validations/product.schema'
import {
  createProduct,
  deleteProduct,
  getProducts,
  getProductsPaginated,
  toggleProductStatus,
  updateProduct,
} from '@/services/product.service'
import { useAuthStore } from '@/store/auth.store'

export function useProducts(activeOnly = false) {
  const user = useAuthStore((state) => state.user)

  const result = useQuery({
    enabled: !!user,
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => getProducts(false), // Always fetch all to populate cache for both views
    select: (data) => (activeOnly ? data.filter((p) => p.is_active) : data),
    staleTime: 1000 * 60 * 5, // 5 min - product catalog changes rarely
  })

  return { ...result, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useInfiniteProducts(search = '', pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  const result = useInfiniteQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.PRODUCTS, 'infinite', search, pageSize],
    queryFn: ({ pageParam = 1 }) => getProductsPaginated(pageParam, pageSize, search),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  })

  return { ...result, isOfflinePaused: (result.isPending && result.fetchStatus === 'paused') || (result.isError && !result.data) }
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: (data: ProductFormData) => {
      if (!user) throw new Error('Belum login')
      return createProduct(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      toast.success('Produk berhasil ditambahkan!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      toast.success('Produk berhasil diperbarui!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      toast.success('Produk berhasil dihapus!')
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleProductStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      const prev = queryClient.getQueryData(QUERY_KEYS.PRODUCTS)
      queryClient.setQueryData(
        QUERY_KEYS.PRODUCTS,
        (old: { id: string; is_active: boolean }[] | undefined) =>
          old?.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEYS.PRODUCTS, ctx.prev)
      }
      toast.error('Gagal mengubah status produk')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
    },
  })
}
