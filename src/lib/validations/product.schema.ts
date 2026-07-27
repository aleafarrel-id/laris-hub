import { z } from 'zod'

// ============================================================
// Product Schemas
// ============================================================

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama produk tidak boleh kosong')
    .max(100, 'Nama produk maksimal 100 karakter')
    .trim(),
  sku: z
    .string()
    .max(50, 'SKU maksimal 50 karakter')
    .optional()
    .nullable()
    .transform((val) => val || null),
  hpp: z
    .number({
      required_error: 'HPP tidak boleh kosong',
      invalid_type_error: 'HPP harus berupa angka',
    })
    .min(0, 'HPP tidak boleh negatif')
    .max(999_999_999, 'HPP terlalu besar'),
  selling_price: z
    .number({
      required_error: 'Harga jual tidak boleh kosong',
      invalid_type_error: 'Harga jual harus berupa angka',
    })
    .min(0, 'Harga jual tidak boleh negatif')
    .max(999_999_999, 'Harga jual terlalu besar'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
    .nullable()
    .transform((val) => val || null),
  image_url: z
    .string()
    .url('URL gambar tidak valid')
    .optional()
    .nullable()
    .transform((val) => val || null),
  is_active: z.boolean().default(true),
})

// Validate selling_price >= hpp
export const productSchemaWithValidation = productSchema.refine(
  (data) => data.selling_price >= data.hpp,
  {
    message: 'Harga jual tidak boleh lebih rendah dari HPP (modal)',
    path: ['selling_price'],
  },
)

export type ProductFormData = z.infer<typeof productSchema>
