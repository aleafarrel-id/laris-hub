/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { ProductFormData } from '@/lib/validations/product.schema'
import type { Product } from '@/types'

const db = supabase as any

/**
 * Get all products. Admin sees all; kasir sees only active (RLS).
 */
export async function getProducts(activeOnly = false): Promise<Product[]> {
  let query = db.from('products').select('*').order('name', { ascending: true })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Product[]
}

/**
 * Get a single product by ID.
 */
export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await db.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data as Product
}

/**
 * Create a new product. Only admin can do this (enforced by RLS).
 */
export async function createProduct(payload: ProductFormData): Promise<Product> {
  const { data, error } = await db
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
  const { data, error } = await db
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
  const { error } = await db.from('products').delete().eq('id', id)
  if (error) throw error
}

/**
 * Toggle product active status.
 */
export async function toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
  const { data, error } = await db
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
 */
export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await db.storage.from('product-images').upload(filePath, file)
  if (uploadError) throw uploadError

  const { data } = db.storage.from('product-images').getPublicUrl(filePath)
  return data.publicUrl
}
