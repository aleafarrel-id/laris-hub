import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
export type TransactionItemInsert = Database['public']['Tables']['transaction_items']['Insert']

export interface TransactionWithItems extends Transaction {
  transaction_items: TransactionItem[]
  profiles?: Pick<Profile, 'full_name'>
}

export interface ProductWithMargin extends Product {
  margin: number // calculated: (selling_price - hpp) / selling_price * 100
}

export interface DateRange {
  from: Date
  to: Date
}

export type SortOrder = 'asc' | 'desc'

export interface PaginationState {
  page: number
  pageSize: number
}

export interface TransactionFilters {
  type?: 'penjualan' | 'pengeluaran' | 'all'
  dateRange?: DateRange
  recordedBy?: string
  search?: string
  limit?: number
}

export interface DailySummary {
  date: string
  total_omset: number
  total_pengeluaran: number
  total_profit: number
  transaction_count: number
}

export interface KPISummary {
  omset: number
  pengeluaran: number
  profit: number
  transactionCount: number
}

export type UserRole = 'admin' | 'kasir'

export interface AuthUser {
  id: string
  email: string
  profile: Profile
}
