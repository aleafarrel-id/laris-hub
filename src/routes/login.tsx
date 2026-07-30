import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { useAuthActions } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { LoginFormData } from '@/lib/validations/auth.schema'
import { loginSchema } from '@/lib/validations/auth.schema'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async ({ search }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profileData = profile as { role: 'admin' | 'kasir' } | null
    const dest =
      (search as { redirect?: string }).redirect ??
      (profileData?.role === 'admin' ? '/dashboard' : '/kasir')
    throw redirect({ to: dest })
  },
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const search = Route.useSearch()

  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [serverError, setServerError] = useState('')
  const [isSuspended, setIsSuspended] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Brute force protection state (persisted to prevent refresh bypass)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window === 'undefined') return 0
    const saved = localStorage.getItem('laris_hub_failed_attempts')
    return saved ? parseInt(saved, 10) : 0
  })
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('laris_hub_lockout_until')
    return saved ? parseInt(saved, 10) : null
  })
  const [lockoutSeconds, setLockoutSeconds] = useState(0)

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('laris_hub_failed_attempts', failedAttempts.toString())
  }, [failedAttempts])

  useEffect(() => {
    if (lockoutUntil) {
      localStorage.setItem('laris_hub_lockout_until', lockoutUntil.toString())
    } else {
      localStorage.removeItem('laris_hub_lockout_until')
    }
  }, [lockoutUntil])

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockoutUntil(null)
        setLockoutSeconds(0)
        clearInterval(interval)
      } else {
        setLockoutSeconds(remaining)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil

  // Auto-hide errors and warnings after 5 seconds
  useEffect(() => {
    if (!serverError && !isSuspended) return
    const timer = setTimeout(() => {
      setServerError('')
      setIsSuspended(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [serverError, isSuspended])

  // Security: only allow internal paths as post-login redirect destination
  const safeRedirectDest = (redirectParam: string | undefined, fallback: string): string => {
    if (!redirectParam) return fallback
    return redirectParam.startsWith('/') ? redirectParam : fallback
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    setIsSuspended(false)
    setErrors({})

    if (isLockedOut) return

    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<LoginFormData> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const profile = await signIn(form.email, form.password)
      setFailedAttempts(0)
      setLockoutUntil(null)

      const fallback = profile.role === 'admin' ? '/dashboard' : '/kasir'
      const dest = safeRedirectDest((search as { redirect?: string }).redirect, fallback)
      navigate({ to: dest })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : ''

      // Suspended account: don't count as brute-force attempt
      if (errMsg === 'ACCOUNT_SUSPENDED') {
        setIsSuspended(true)
        return
      }

      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      if (newAttempts >= 3) {
        const lockSeconds = Math.min(30 * 2 ** (newAttempts - 3), 300)
        const until = Date.now() + lockSeconds * 1000
        setLockoutUntil(until)
        setLockoutSeconds(lockSeconds)
      }

      setServerError(
        errMsg || 'Email atau password salah.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' as const, delay },
  })

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-neutral-50/50">
      <div className="w-full max-w-[400px]">
        <motion.div className="text-center mb-8 flex flex-col items-center" {...fadeUp(0)}>
          <motion.div
            className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-5"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
          >
            <img
              src="/favicon.svg"
              alt="Laris Hub Logo"
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Laris Hub</h1>
          <p className="text-sm text-neutral-500 mt-2">Masuk ke akun Anda untuk melanjutkan</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-xl shadow-neutral-200/40"
          {...fadeUp(0.08)}
        >
          {/* Suspended account banner — shown when is_active = false */}
          {isSuspended && (
            <motion.div
              className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-medium text-center leading-snug">
                Akun ditangguhkan. Hubungi Admin.
              </p>
            </motion.div>
          )}

          {/* Generic error — wrong credentials etc */}
          {serverError && !isSuspended && (
            <motion.div
              className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-danger shrink-0" />
              <p className="text-sm text-danger font-medium text-center leading-snug">
                {serverError}
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="contoh@email.com"
                className={`flex h-12 w-full rounded-xl border bg-neutral-50/50 px-4 py-2 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                  errors.email
                    ? 'border-danger focus:border-danger focus:ring-danger/20'
                    : 'border-neutral-200 focus:border-primary focus:ring-primary/30 hover:border-neutral-300'
                }`}
              />
              {errors.email && (
                <p className="text-xs font-medium text-danger mt-1.5">{errors.email}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative mb-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`flex h-12 w-full rounded-xl border bg-neutral-50/50 px-4 py-2 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 pr-12 transition-all ${
                    errors.password
                      ? 'border-danger focus:border-danger focus:ring-danger/20'
                      : 'border-neutral-200 focus:border-primary focus:ring-primary/30 hover:border-neutral-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-between items-start">
                {errors.password ? (
                  <p className="text-xs font-medium text-danger mt-1">{errors.password}</p>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
                  onClick={() => setShowForgotModal(true)}
                >
                  Lupa password?
                </button>
              </div>
            </div>

            {isLockedOut && (
              <motion.div
                className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 font-medium text-center leading-snug">
                  Coba lagi dalam {lockoutSeconds}s.
                </p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || isLockedOut}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:pointer-events-none disabled:opacity-50"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', duration: 0.2, bounce: 0 }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </motion.button>
</form>
        </motion.div>

        <motion.p
          className="text-center text-xs text-neutral-400 mt-8 font-medium"
          {...fadeUp(0.16)}
        >
          &copy; {new Date().getFullYear()} Laris Hub. All rights reserved.
        </motion.p>

        <Modal
          isOpen={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          title="Lupa Password?"
          variant="center"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Hubungi Admin</h3>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Demi keamanan akun, reset password hanya dapat dilakukan oleh Pemilik Usaha atau Admin
              sistem. Silakan hubungi admin Anda untuk mendapatkan password baru.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 active:scale-[0.96] transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
