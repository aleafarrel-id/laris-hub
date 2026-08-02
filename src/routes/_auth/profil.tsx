import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff, KeyRound, LogOut, Mail, Phone, Shield, User } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LogoutDialog } from '@/components/ui/LogoutDialog'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateOwnCredentials, useUpdateProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'

export const Route = createFileRoute('/_auth/profil')({
  component: ProfilPage,
})

function ProfilPage() {
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
    <>
      {/* Mobile-only sticky header with back button */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-100 active:scale-[0.96] transition-all text-neutral-600"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-neutral-900">Profil Saya</h1>
      </header>

      <div className="page-container max-w-lg mx-auto">
        <motion.h1
          className="text-2xl font-bold mb-6 hidden md:block"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Profil Saya
        </motion.h1>

        <motion.div
          className="app-card p-6 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {profile ? getInitials(profile.full_name) : '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{profile?.full_name}</h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile?.role === 'admin'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Shield size={10} />
                {profile?.role === 'admin' ? 'Admin' : 'Kasir'}
              </span>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-neutral-400" />
                <span className="text-neutral-700">{profile?.full_name}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-neutral-400" />
                  <span className="text-neutral-700">{profile.phone}</span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
                  setIsEditing(true)
                }}
                className="mt-4 w-full"
              >
                Edit Profil
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                id="profil-name"
                type="text"
                label="Nama Lengkap"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
              <Input
                id="profil-phone"
                type="tel"
                label="Nomor HP"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                inputMode="numeric"
                placeholder="0812xxxxxxxx"
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !form.full_name.trim()}
                  isLoading={isPending}
                  className="flex-1"
                >
                  Simpan
                </Button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Security Section (Admin Only) */}
        {profile?.role === 'admin' && (
          <motion.div
            className="app-card p-6 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h3 className="text-sm font-bold text-neutral-900 mb-4">Keamanan Akun</h3>

            {!isEditingCredentials ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-neutral-400" />
                  <span className="text-neutral-700">{user?.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <KeyRound size={16} className="text-neutral-400" />
                  <span className="text-neutral-700">••••••••</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCredentialsForm({ email: user?.email ?? '', password: '' })
                    setCredentialsError({})
                    setIsEditingCredentials(true)
                  }}
                  className="mt-4 w-full"
                >
                  Edit Email & Password
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <Input
                  id="profil-email"
                  type="email"
                  label="Email Baru"
                  value={credentialsForm.email}
                  onChange={(e) => {
                    setCredentialsForm((f) => ({ ...f, email: e.target.value }))
                    if (credentialsError.email) setCredentialsError((e) => ({ ...e, email: '' }))
                  }}
                  leftDecorator={<Mail size={15} />}
                  error={credentialsError.email}
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
                      className="p-1 hover:text-neutral-700 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  error={credentialsError.password}
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingCredentials(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingCredentials}
                    isLoading={isUpdatingCredentials}
                    className="flex-1"
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-danger/10 text-danger hover:bg-danger/20 hover:text-danger mt-4"
            leftIcon={<LogOut size={16} />}
          >
            Keluar dari Akun
          </Button>
        </motion.div>
      </div>

      <LogoutDialog isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </>
  )
}
