import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { translateError } from '@/lib/utils'
import type { ProductFormData } from '@/lib/validations/product.schema'
import {
  createProduct,
  deleteProduct,
  getProducts,
  toggleProductStatus,
  updateProduct,
} from '@/services/product.service'
import { useAuthStore } from '@/store/auth.store'

// ============================================================
// useProducts — list query
// ============================================================

export function useProducts(activeOnly = false) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, { activeOnly }],
    queryFn: () => getProducts(activeOnly),
    staleTime: 1000 * 60 * 5, // 5 min — product catalog changes rarely
  })
}

// ============================================================
// useCreateProduct — mutation
// ============================================================

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

// ============================================================
// useUpdateProduct — mutation
// ============================================================

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

// ============================================================
// useDeleteProduct — mutation
// ============================================================

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

// ============================================================
// useToggleProductStatus — mutation
// ============================================================

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
        [...QUERY_KEYS.PRODUCTS, { activeOnly: false }],
        (old: { id: string; is_active: boolean }[] | undefined) =>
          old?.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData([...QUERY_KEYS.PRODUCTS, { activeOnly: false }], ctx.prev)
      }
      toast.error('Gagal mengubah status produk')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
    },
  })
}
