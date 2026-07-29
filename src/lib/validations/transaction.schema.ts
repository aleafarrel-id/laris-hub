import { z } from 'zod'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

// Single item in a sale transaction
const saleItemSchema = z.object({
  product_id: z.string().uuid('ID produk tidak valid'),
  product_name: z.string().min(1),
  product_hpp: z.number().min(0),
  selling_price: z.number().min(0),
  quantity: z
    .number()
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(9999, 'Jumlah terlalu besar'),
})

// Single line item in an expense (optional detail breakdown)
export const expenseItemSchema = z.object({
  name: z.string().min(1, 'Nama item tidak boleh kosong').max(100),
  qty: z.number().min(1).optional().default(1),
  unit_price: z.number().min(0),
})

// Sale transaction schema
export const saleTransactionSchema = z.object({
  type: z.literal('penjualan'),
  items: z.array(saleItemSchema).min(1, 'Pilih minimal 1 produk untuk transaksi penjualan'),
  notes: z
    .string()
    .max(200, 'Catatan maksimal 200 karakter')
    .optional()
    .nullable()
    .transform((val) => val || null),
  transaction_at: z.string().optional(),
})

// Expense transaction schema — with optional detail items
export const expenseTransactionSchema = z.object({
  type: z.literal('pengeluaran'),
  description: z
    .string()
    .min(1, 'Deskripsi pengeluaran tidak boleh kosong')
    .max(200, 'Deskripsi maksimal 200 karakter')
    .trim(),
  total_amount: z
    .number({
      required_error: 'Jumlah pengeluaran tidak boleh kosong',
      invalid_type_error: 'Jumlah harus berupa angka',
    })
    .min(1, 'Jumlah pengeluaran minimal Rp 1')
    .max(999_999_999, 'Jumlah terlalu besar'),
  expense_category: z.enum(
    [EXPENSE_CATEGORIES.OPERASIONAL, EXPENSE_CATEGORIES.BAHAN_BAKU, EXPENSE_CATEGORIES.LAINNYA],
    {
      errorMap: () => ({ message: 'Pilih kategori pengeluaran yang valid' }),
    },
  ),
  // Optional breakdown detail (stored as JSONB in DB)
  expense_items: z.array(expenseItemSchema).optional().default([]),
  notes: z
    .string()
    .max(200, 'Catatan maksimal 200 karakter')
    .optional()
    .nullable()
    .transform((val) => val || null),
  transaction_at: z.string().optional(),
})

export type SaleTransactionFormData = z.infer<typeof saleTransactionSchema>
export type ExpenseTransactionFormData = z.infer<typeof expenseTransactionSchema>
export type SaleItemFormData = z.infer<typeof saleItemSchema>
export type ExpenseItemFormData = z.infer<typeof expenseItemSchema>
