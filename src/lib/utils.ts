import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 * Handles conditional classes and resolves conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format number to Indonesian Rupiah currency string.
 * @example formatRupiah(150000) → "Rp 150.000"
 * @example formatRupiah(1500000) → "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount)
}

/**
 * Format number to short Rupiah for charts.
 * @example formatRupiahShort(1500000) → "1,5jt"
 * @example formatRupiahShort(500000) → "500rb"
 */
export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}jt`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}rb`
  }
  return `Rp ${amount}`
}

/**
 * Parse Rupiah string to number.
 * @example parseRupiah("Rp 150.000") → 150000
 */
export function parseRupiah(value: string): number {
  const cleaned = value.replace(/[Rp\s.]/g, '').replace(',', '.')
  return Number.parseFloat(cleaned) || 0
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * Format date to Indonesian long format.
 * @example formatDate(new Date()) → "26 Juli 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFormatter.format(d)
}

/**
 * Format date to short format.
 * @example formatDateShort(new Date()) → "26 Jul"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return shortDateFormatter.format(d)
}

/**
 * Format time only.
 * @example formatTime(new Date()) → "14:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return timeFormatter.format(d)
}

/**
 * Format date + time.
 * @example formatDateTime(new Date()) → "26 Jul 2026, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDateShort(d)}, ${formatTime(d)}`
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/**
 * Translate Supabase/generic errors to user-friendly Bahasa Indonesia messages.
 */
export function translateError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Terjadi kesalahan tidak diketahui. Silakan coba lagi.'
  }

  const message = error.message.toLowerCase()
  const rawMessage = error.message

  // Suspended account - specific actionable message
  if (rawMessage === 'ACCOUNT_SUSPENDED') {
    return 'ACCOUNT_SUSPENDED'
  }

  // Auth errors
  if (message.includes('invalid login credentials')) {
    return 'Email atau password salah.'
  }
  if (message.includes('email not confirmed')) {
    return 'Email Anda belum dikonfirmasi. Periksa inbox email Anda.'
  }
  if (message.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Gunakan email lain atau login.'
  }
  if (message.includes('password should be')) {
    return 'Password terlalu lemah. Gunakan minimal 8 karakter.'
  }
  if (message.includes('email rate limit exceeded')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.'
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch')
  ) {
    return 'Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.'
  }
  if (message.includes('timeout')) {
    return 'Koneksi terputus (timeout). Coba lagi dalam beberapa saat.'
  }

  // Permission errors
  if (
    message.includes('row-level security') ||
    message.includes('403') ||
    message.includes('permission denied')
  ) {
    return 'Anda tidak memiliki akses untuk melakukan tindakan ini.'
  }

  // Data errors
  if (message.includes('duplicate') || message.includes('unique')) {
    return 'Data ini sudah ada. Gunakan nama atau kode yang berbeda.'
  }
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Data tidak dapat disimpan karena referensi tidak valid.'
  }

  // Fallback to the original error message ONLY if explicitly marked as safe for the user.
  // This prevents raw Postgres errors or unexpected JSON from leaking into the UI.
  if ((error as any).isUserFacing === true && typeof rawMessage === 'string') {
    return rawMessage
  }
  
  return 'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi administrator.'
}

/**
 * Get initials from full name.
 * @example getInitials("Andi Pratama") → "AP"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Generate a simple random ID.
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

/**
 * Calculate margin percentage.
 * @example calcMargin(100000, 80000) → 25 (25%)
 */
export function calcMargin(sellingPrice: number, hpp: number): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - hpp) / sellingPrice) * 100
}

/**
 * Calculate profit from selling price, hpp, and quantity.
 */
export function calcProfit(sellingPrice: number, hpp: number, quantity: number): number {
  return (sellingPrice - hpp) * quantity
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
