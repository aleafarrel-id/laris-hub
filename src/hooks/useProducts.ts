import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { QUERY_KEYS } from '@/lib/constants'
import { applyOptimisticUpdates } from '@/lib/optimistic-ui'
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
import { createOfflineMutation } from './useOfflineMutation'
import { useOfflinePendingItems } from './useOfflinePendingItems'

function useInjectedProducts<T extends object>(
  result: T,
  emptyFallback: any,
): T & { isOfflinePaused: boolean } {
  const pendingItems = useOfflinePendingItems([
    'CREATE_PRODUCT',
    'UPDATE_PRODUCT',
    'DELETE_PRODUCT',
    'TOGGLE_PRODUCT',
  ])

  const res = result as any
  const isOfflinePaused =
    (res.isPending && res.fetchStatus === 'paused') || (res.isError && !res.data)

  const data = useMemo(() => {
    const createProducts = pendingItems.filter((item) => item.action === 'CREATE_PRODUCT')
    const offlineProducts = createProducts.map((item: any) => {
      const payload = item.payload.payload || item.payload
      return {
        id: `pending-${item.localId}`,
        name: payload.name,
        sku: payload.sku,
        hpp: payload.hpp,
        selling_price: payload.selling_price,
        description: payload.description,
        image_url: payload.image_url,
        is_active: payload.is_active,
        created_at: item.createdAt,
        updated_at: item.createdAt,
        isOfflinePending: true,
      } as any
    })

    let currentData = res.data || emptyFallback

    if (currentData.pages) {
      currentData = {
        ...currentData,
        pages: currentData.pages.map((page: any, index: number) => {
          let mergedPageData = index === 0 ? [...offlineProducts, ...page.data] : page.data
          mergedPageData = applyOptimisticUpdates(mergedPageData, pendingItems, 'PRODUCT')
          return { ...page, data: mergedPageData }
        }),
      }
    } else if (Array.isArray(currentData)) {
      currentData = applyOptimisticUpdates(
        [...offlineProducts, ...currentData],
        pendingItems,
        'PRODUCT',
      )
    }
    return currentData
  }, [res.data, pendingItems])

  return { ...result, data, isOfflinePaused }
}

export function useProducts(activeOnly = false) {
  const user = useAuthStore((state) => state.user)

  const selectFn = useCallback(
    (data: any[]) => (activeOnly ? data.filter((p) => p.is_active) : data),
    [activeOnly],
  )

  const result = useQuery({
    enabled: !!user,
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => getProducts(false),
    select: selectFn,
  })

  return useInjectedProducts(result, [])
}

export function useInfiniteProducts(search = '', pageSize = 20) {
  const user = useAuthStore((state) => state.user)

  const result = useInfiniteQuery({
    enabled: !!user,
    queryKey: [...QUERY_KEYS.PRODUCTS, 'infinite', search, pageSize],
    queryFn: ({ pageParam = 1 }) => getProductsPaginated(pageParam, pageSize, search),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  })

  return useInjectedProducts(result, { pages: [{ data: [], nextPage: null }], pageParams: [1] })
}

export function useCreateProduct() {
  const user = useAuthStore((s) => s.user)

  return createOfflineMutation<ProductFormData, any>(
    'CREATE_PRODUCT',
    (data) => {
      if (!user) throw new Error('Belum login')
      return createProduct(data)
    },
    {
      successMessage: 'Produk berhasil ditambahkan!',
      errorAction: 'menambah produk',
      onSuccess: (_data, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      },
    },
  )()
}

export function useUpdateProduct() {
  return createOfflineMutation<{ id: string; data: ProductFormData }, any>(
    'UPDATE_PRODUCT',
    ({ id, data }) => updateProduct(id, data),
    {
      successMessage: 'Produk berhasil diperbarui!',
      errorAction: 'memperbarui produk',
      onSuccess: (_data, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      },
    },
  )()
}

export function useDeleteProduct() {
  return createOfflineMutation<string, any>('DELETE_PRODUCT', (id) => deleteProduct(id), {
    successMessage: 'Produk berhasil dihapus!',
    errorAction: 'menghapus produk',
    onSuccess: (_data, _vars, queryClient) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
    },
  })()
}

export function useToggleProductStatus() {
  return createOfflineMutation<{ id: string; isActive: boolean }, any>(
    'TOGGLE_PRODUCT',
    ({ id, isActive }) => toggleProductStatus(id, isActive),
    {
      successMessage: 'Status produk berhasil diubah!',
      errorAction: 'mengubah status produk',
      onSuccess: (_data, _vars, queryClient) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
      },
    },
  )()
}
