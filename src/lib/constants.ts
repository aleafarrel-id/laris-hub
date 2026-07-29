// App metadata
export const APP_NAME = 'Laris Hub'
export const APP_VERSION = '1.0.0'

// User roles
export const ROLES = {
  ADMIN: 'admin',
  KASIR: 'kasir',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

// Transaction types
export const TRANSACTION_TYPES = {
  PENJUALAN: 'penjualan',
  PENGELUARAN: 'pengeluaran',
} as const

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES]

// Expense categories
export const EXPENSE_CATEGORIES = {
  OPERASIONAL: 'operasional',
  BAHAN_BAKU: 'bahan_baku',
  LAINNYA: 'lainnya',
} as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES]

// Labels untuk display
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operasional: 'Operasional',
  bahan_baku: 'Bahan Baku',
  lainnya: 'Lainnya',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  penjualan: 'Penjualan',
  pengeluaran: 'Pengeluaran',
}

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// UI thresholds
export const MARGIN_WARNING_THRESHOLD = 15 // % below this → warning
export const MARGIN_GOOD_THRESHOLD = 30 // % above this → good

// Date formats for filtering
export const DATE_FORMAT_API = "yyyy-MM-dd'T'HH:mm:ssXXX"
export const DATE_FORMAT_DISPLAY = 'dd MMMM yyyy'

// Tanstack Query keys (centralized)
export const QUERY_KEYS = {
  PROFILE: ['profile'] as const,
  CASHIERS: ['cashiers'] as const,
  PRODUCTS: ['products'] as const,
  TRANSACTIONS: ['transactions'] as const,
  DASHBOARD: ['dashboard'] as const,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'laris-hub:sidebar-collapsed',
  LAST_KASIR_TAB: 'laris-hub:last-kasir-tab',
  THEME: 'laris-hub:theme',
} as const

// Supabase table names
export const TABLES = {
  PROFILES: 'profiles',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  TRANSACTION_ITEMS: 'transaction_items',
} as const
