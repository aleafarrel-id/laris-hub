import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { useAuthActions } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { LoginFormData } from '@/lib/validations/auth.schema'
import { loginSchema } from '@/lib/validations/auth.schema'

// ============================================================
// /login — Public, redirect to home if already authenticated
// ============================================================

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async ({ search }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return // Not logged in, show login page

    // Already logged in — redirect to appropriate page
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
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    setErrors({})

    // Client-side validation
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
      const dest =
        (search as { redirect?: string }).redirect ??
        (profile.role === 'admin' ? '/dashboard' : '/kasir')
      navigate({ to: dest })
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Login gagal. Periksa kembali email dan password Anda.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Stagger animation helpers
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' as const, delay },
  })

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-neutral-50/50">
      <div className="w-full max-w-[400px]">
        {/* Logo Section */}
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

        {/* Card Form */}
        <motion.div
          className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-xl shadow-neutral-200/40"
          {...fadeUp(0.08)}
        >
          {serverError && (
            <motion.div
              className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger font-medium flex items-start gap-3"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{serverError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email field */}
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

            {/* Password field */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-sm font-semibold text-neutral-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  onClick={() => setShowForgotModal(true)}
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`flex h-12 w-full rounded-xl border bg-neutral-50/50 px-4 py-2 pr-11 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                    errors.password
                      ? 'border-danger focus:border-danger focus:ring-danger/20'
                      : 'border-neutral-200 focus:border-primary focus:ring-primary/30 hover:border-neutral-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-danger mt-1.5">{errors.password}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
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
                'Masuk ke Dasbor'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="text-center text-xs text-neutral-400 mt-8 font-medium"
          {...fadeUp(0.16)}
        >
          &copy; {new Date().getFullYear()} Laris Hub. All rights reserved.
        </motion.p>

        {/* Forgot Password Modal */}
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
              className="w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
