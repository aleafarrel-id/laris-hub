import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LogoutDialog } from '@/components/ui/LogoutDialog'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateOwnCredentials, useUpdateProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'

export const Route = createFileRoute('/_auth/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const { mutate: updateCredentials, isPending: isUpdatingCredentials } = useUpdateOwnCredentials()

  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Credentials state
  const [isEditingCredentials, setIsEditingCredentials] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [credentialsForm, setCredentialsForm] = useState({
    email: user?.email ?? '',
    password: '',
  })
  const [credentialsError, setCredentialsError] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(
      {
        id: profile!.id,
        updates: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          avatar_url: profile?.avatar_url ?? null,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      },
    )
  }

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (credentialsForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentialsForm.email)) {
      errs.email = 'Format email tidak valid'
    }
    if (credentialsForm.password && credentialsForm.password.length < 8) {
      errs.password = 'Password minimal 8 karakter'
    }

    if (Object.keys(errs).length > 0) {
      setCredentialsError(errs)
      return
    }

    const newEmail =
      credentialsForm.email.trim() !== user?.email ? credentialsForm.email.trim() : undefined
    const newPassword = credentialsForm.password || undefined

    if (!newEmail && !newPassword) {
      setIsEditingCredentials(false)
      return
    }

    updateCredentials(
      {
        email: newEmail,
        password: newPassword,
      },
      {
        onSuccess: () => {
          setIsEditingCredentials(false)
          setCredentialsForm((f) => ({ ...f, password: '' }))
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-24 md:pb-12">
      <header className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-[0.96] transition-all text-neutral-600 -ml-2"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-base font-bold text-neutral-900 absolute left-1/2 -translate-x-1/2">
          Profil Saya
        </h1>
        <div className="w-10" />
      </header>

      <div className="max-w-xl mx-auto md:py-8">
        <motion.div
          className="relative bg-white md:rounded-3xl border-b md:border border-neutral-100 shadow-sm shadow-neutral-200/20 mb-4 md:mb-6 overflow-hidden"
          layout
        >
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-80" />

          <div className="relative pt-12 pb-8 px-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="relative mb-4 group"
            >
              <div className="w-24 h-24 rounded-full bg-white shadow-lg shadow-primary/10 p-1.5 flex items-center justify-center z-10 relative">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-3xl font-bold">
                  {profile ? getInitials(profile.full_name) : '?'}
                </div>
              </div>
            </motion.div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-extrabold text-neutral-900 tracking-tight"
            >
              {profile?.full_name}
            </motion.h2>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-3"
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${profile?.role === 'admin'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}
              >
                <Shield size={12} strokeWidth={2.5} />
                {profile?.role === 'admin' ? 'Administrator' : 'Kasir'}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white md:rounded-3xl border-y md:border border-neutral-100 shadow-sm shadow-neutral-200/20 mb-4 md:mb-6"
          layout
        >
          <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-50">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <User size={16} className="text-primary" />
              Informasi Pribadi
            </h3>
            <AnimatePresence>
              {!isEditing && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => {
                    setForm({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
                    setIsEditing(true)
                  }}
                  className="text-primary text-sm font-semibold hover:bg-primary/5 active:bg-primary/10 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Pencil size={14} strokeWidth={2.5} /> Edit
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            {!isEditing ? (
              <motion.div
                key="view-info"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-2 space-y-0.5"
                layout
              >
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <User size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                      Nama Lengkap
                    </p>
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {profile?.full_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                    <Phone size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                      Nomor Telepon
                    </p>
                    <p className="text-sm font-semibold text-neutral-900 truncate tabular-nums">
                      {profile?.phone || (
                        <span className="text-neutral-400 italic">Belum diatur</span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="edit-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onSubmit={handleSave}
                className="p-6 space-y-5"
                layout
              >
                <Input
                  id="profil-name"
                  type="text"
                  label="Nama Lengkap"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                  autoFocus
                />
                <Input
                  id="profil-phone"
                  type="tel"
                  label="Nomor Telepon"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  inputMode="numeric"
                  placeholder="0812xxxxxxxx"
                />
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                    leftIcon={<X size={16} strokeWidth={2.5} />}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !form.full_name.trim()}
                    isLoading={isPending}
                    className="flex-1"
                    leftIcon={<Check size={16} strokeWidth={2.5} />}
                  >
                    Simpan
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {profile?.role === 'admin' && (
          <motion.div
            className="bg-white md:rounded-3xl border-y md:border border-neutral-100 shadow-sm shadow-neutral-200/20 mb-6"
            layout
          >
            <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Shield size={16} className="text-orange-500" />
                Keamanan Akun
              </h3>
              <AnimatePresence>
                {!isEditingCredentials && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => {
                      setCredentialsForm({ email: user?.email ?? '', password: '' })
                      setCredentialsError({})
                      setIsEditingCredentials(true)
                    }}
                    className="text-orange-500 text-sm font-semibold hover:bg-orange-50 active:bg-orange-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Pencil size={14} strokeWidth={2.5} /> Edit
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {!isEditingCredentials ? (
                <motion.div
                  key="view-security"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 space-y-0.5"
                  layout
                >
                  <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50/80 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                        Alamat Email
                      </p>
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {user?.email || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50/80 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                      <KeyRound size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                        Password
                      </p>
                      <p className="text-sm font-black text-neutral-700 tracking-[0.2em] translate-y-1">
                        ••••••••
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="edit-security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onSubmit={handleSaveCredentials}
                  className="p-6 space-y-5"
                  layout
                >
                  <Input
                    id="profil-email"
                    type="email"
                    label="Email Baru"
                    value={credentialsForm.email}
                    onChange={(e) => {
                      setCredentialsForm((f) => ({ ...f, email: e.target.value }))
                      if (credentialsError.email) setCredentialsError((e) => ({ ...e, email: '' }))
                    }}
                    leftDecorator={<Mail size={16} strokeWidth={2.5} />}
                    error={credentialsError.email}
                    autoFocus
                  />
                  <Input
                    id="profil-password"
                    type={showNewPassword ? 'text' : 'password'}
                    label="Password Baru"
                    placeholder="Kosongkan jika tidak diubah"
                    value={credentialsForm.password}
                    onChange={(e) => {
                      setCredentialsForm((f) => ({ ...f, password: e.target.value }))
                      if (credentialsError.password)
                        setCredentialsError((e) => ({ ...e, password: '' }))
                    }}
                    rightDecorator={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    error={credentialsError.password}
                  />
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingCredentials(false)}
                      className="flex-1"
                      leftIcon={<X size={16} strokeWidth={2.5} />}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdatingCredentials}
                      isLoading={isUpdatingCredentials}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500"
                      leftIcon={<Check size={16} strokeWidth={2.5} />}
                    >
                      Simpan
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.div layout className="flex justify-center mt-8 pb-4">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-xl transition-all duration-300 font-bold active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Keluar dari Akun
          </button>
        </motion.div>
      </div>

      <LogoutDialog isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </div>
  )
}
