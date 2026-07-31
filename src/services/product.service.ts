import { supabase } from '@/lib/supabase'
import type { ProductFormData } from '@/lib/validations/product.schema'
import type { Product } from '@/types'

/**
 * Extracts the storage object path (relative to the bucket root) from a
 * Supabase Storage public URL.
 *
 * Supabase public URL format:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * Returns null if the URL doesn't match the expected pattern.
 */
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl)
    const marker = `/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.pathname.slice(idx + marker.length))
  } catch {
    return null
  }
}

/**
 * Deletes a file from the product-images bucket by its public URL.
 * Errors do not throw so callers are never blocked.
 */
async function deleteStorageImage(imageUrl: string): Promise<void> {
  const path = extractStoragePath(imageUrl, 'product-images')
  if (!path) return
  await supabase.storage.from('product-images').remove([path])
}

/**
 * Get all products. Admin sees all; kasir sees only active (RLS).
 */
export async function getProducts(activeOnly = false): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(
      'id, name, sku, hpp, selling_price, description, image_url, is_active, created_by, created_at, updated_at',
    )
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
    .select(
      'id, name, sku, hpp, selling_price, description, image_url, is_active, created_by, created_at, updated_at',
      { count: 'exact' },
    )
    .order('name', { ascending: true })

  if (search.trim()) {
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
    .select(
      'id, name, sku, hpp, selling_price, description, image_url, is_active, created_by, created_at, updated_at',
    )
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
 * If the image was replaced or removed, the old image is deleted from storage.
 */
export async function updateProduct(id: string, payload: ProductFormData): Promise<Product> {
  // Fetch old image URL before updating so we can clean it up if needed
  const { data: oldProduct } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .single()

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

  // Delete old image from storage if it was replaced or removed
  const oldUrl = oldProduct?.image_url
  const newUrl = payload.image_url ?? null
  if (oldUrl && oldUrl !== newUrl) {
    await deleteStorageImage(oldUrl)
  }

  return data as Product
}

/**
 * Delete a product and permanently remove its image from storage.
 * Only admin can do this (enforced by RLS).
 */
export async function deleteProduct(id: string): Promise<void> {
  // Fetch image URL before deleting the record so we can clean up storage
  const { data: product } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error

  // Delete image from storage after the DB record is successfully removed
  if (product?.image_url) {
    await deleteStorageImage(product.image_url)
  }
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
 * Uses crypto.randomUUID() for a cryptographically secure, unpredictable filename.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}_${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
  return data.publicUrl
}

/**
 * Delete an orphaned image file directly from storage by its filename.
 * Used for admin cleanup of files not referenced by any product.
 */
export async function deleteOrphanedStorageImage(fileName: string): Promise<void> {
  await supabase.storage.from('product-images').remove([fileName])
}
