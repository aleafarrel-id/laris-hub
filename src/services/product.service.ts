import { supabase } from '@/lib/supabase'
import type { ProductFormData } from '@/lib/validations/product.schema'
import type { Product } from '@/types'

/**
 * Get all products. Admin sees all; kasir sees only active (RLS).
 */
export async function getProducts(activeOnly = false): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('id, name, sku, hpp, selling_price, description, image_url, is_active, created_by, created_at, updated_at')
    .order('name', { ascending: true })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Product[]
}

/**
 * Get paginated products for the admin table.
 */
export async function getProductsPaginated(
  page = 1,
  pageSize = 20,
  search = '',
): Promise<{ data: Product[]; nextPage: number | null; total: number }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select('id, name, sku, hpp, selling_price, description, image_url, is_active, created_by, created_at, updated_at', { count: 'exact' })
    .order('name', { ascending: true })

  if (search.trim()) {
    // Search by name or sku using ilike
    query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) throw error

  const hasNext = count !== null && from + pageSize < count
  return {
    data: (data ?? []) as Product[],
    nextPage: hasNext ? page + 1 : null,
    total: count ?? 0,
  }
}

/**
 * Get a single product by ID.
 */
export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, hpp, selling_price, description, image_url, is_active, created_by, created_at, updated_at')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Product
}

/**
 * Create a new product. Only admin can do this (enforced by RLS).
 */
export async function createProduct(payload: ProductFormData): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: payload.name,
        sku: payload.sku ?? null,
        hpp: payload.hpp,
        selling_price: payload.selling_price,
        description: payload.description ?? null,
        image_url: payload.image_url ?? null,
        is_active: payload.is_active,
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data as Product
}

/**
 * Update a product. Only admin can do this (enforced by RLS).
 */
export async function updateProduct(id: string, payload: ProductFormData): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      sku: payload.sku ?? null,
      hpp: payload.hpp,
      selling_price: payload.selling_price,
      description: payload.description ?? null,
      image_url: payload.image_url ?? null,
      is_active: payload.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

/**
 * Delete a product. Only admin can do this (enforced by RLS).
 */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

/**
 * Toggle product active status. Only admin can do this (enforced by RLS).
 */
export async function toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

/**
 * Upload product image to Supabase Storage.
 * Uses crypto.randomUUID() instead of Math.random() for a secure, unpredictable filename.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  // Security: use crypto.randomUUID() (cryptographically secure) instead of Math.random()
  const fileName = `${crypto.randomUUID()}_${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
  return data.publicUrl
}
