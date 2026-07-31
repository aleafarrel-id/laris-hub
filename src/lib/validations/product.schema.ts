import { z } from 'zod'

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
    .coerce
    .number({
      required_error: 'HPP tidak boleh kosong',
      invalid_type_error: 'HPP harus berupa angka',
    })
    .refine((val) => !isNaN(val), { message: 'HPP tidak boleh kosong' })
    .refine((val) => val >= 0, { message: 'HPP tidak boleh negatif' })
    .refine((val) => val <= 999_999_999, { message: 'HPP terlalu besar' }),
  selling_price: z
    .coerce
    .number({
      required_error: 'Harga jual tidak boleh kosong',
      invalid_type_error: 'Harga jual harus berupa angka',
    })
    .refine((val) => !isNaN(val), { message: 'Harga jual tidak boleh kosong' })
    .refine((val) => val >= 0, { message: 'Harga jual tidak boleh negatif' })
    .refine((val) => val <= 999_999_999, { message: 'Harga jual terlalu besar' }),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
    .nullable()
    .transform((val) => val || null),
  image_url: z
    .string()
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
