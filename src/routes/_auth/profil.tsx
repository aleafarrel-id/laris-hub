import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LogOut, Phone, Shield, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useAuth, useAuthActions } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'

export const Route = createFileRoute('/_auth/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  const { profile } = useAuth()
  const { signOut } = useAuthActions()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
  })

  const handleLogout = async () => {
    setShowLogoutModal(false)
    await signOut()
    navigate({ to: '/login' })
    toast.success('Berhasil keluar dari akun')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(
      {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        avatar_url: profile?.avatar_url ?? null,
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      },
    )
  }

  return (
    <div className="page-container max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profil Saya</h1>

      <div className="app-card p-6 mb-4">
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
            <button
              type="button"
              onClick={() => {
                setForm({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
                setIsEditing(true)
              }}
              className="mt-4 w-full py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 active:scale-[0.96] transition-all"
            >
              Edit Profil
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="profil-name"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Nama Lengkap
              </label>
              <input
                id="profil-name"
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="profil-phone"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Nomor HP
              </label>
              <input
                id="profil-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                inputMode="numeric"
                placeholder="0812xxxxxxxx"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium active:scale-[0.96] transition-transform"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || !form.full_name.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-[0.96] transition-all disabled:opacity-50"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowLogoutModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-danger/10 text-danger rounded-xl text-sm font-medium hover:bg-danger/20 active:scale-[0.96] transition-all"
      >
        <LogOut size={16} />
        Keluar dari Akun
      </button>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Keluar dari Akun"
        variant="center"
      >
        <div className="p-6 text-center space-y-5">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
            <LogOut size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Yakin ingin keluar?</h3>
            <p className="text-sm text-neutral-500">
              Anda harus login kembali untuk masuk ke sistem.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl active:scale-[0.98] transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-3 bg-danger text-white font-bold rounded-xl shadow-lg shadow-danger/20 active:scale-[0.98] transition-all"
            >
              Keluar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
