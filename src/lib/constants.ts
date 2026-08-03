import pkg from '../../package.json'

// App metadata
export const APP_NAME = 'Laris Hub'
export const APP_VERSION = pkg.version

// User roles
export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

// Transaction types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  EXPENSE: 'expense',
} as const

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES]

// Expense categories
export const EXPENSE_CATEGORIES = {
  OPERATIONAL: 'operational',
  RAW_MATERIAL: 'raw_material',
  OTHER: 'other',
} as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES]

// Labels for display
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operational: 'Operasional',
  raw_material: 'Bahan Baku',
  other: 'Lainnya',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Penjualan',
  expense: 'Pengeluaran',
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
  LAST_CASHIER_TAB: 'laris-hub:last-cashier-tab',
  THEME: 'laris-hub:theme',
} as const

// Supabase table names
export const TABLES = {
  PROFILES: 'profiles',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  TRANSACTION_ITEMS: 'transaction_items',
} as const
