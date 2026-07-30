import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  PlusCircle,
  ShieldOff,
  Trash2,
  UserCheck,
  Users,
  User,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import {
  useKasirList,
  useCreateKasir,
  useUpdateKasir,
  useToggleKasirStatus,
  useKasirAuthDetails,
  useDeleteKasir,
} from '@/hooks/useKasirManagement'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

export const Route = createFileRoute('/_auth/manajemen-kasir')({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    if (session.user.app_metadata?.role !== 'admin') throw redirect({ to: '/kasir' })
  },
  component: ManajemenKasirPage,
})

// ─── Avatar ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
]

function KasirAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const colorClass = AVATAR_COLORS[profile.full_name.charCodeAt(0) % AVATAR_COLORS.length]
  const sizeClass =
    size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs'
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name}
        className={`${sizeClass} rounded-xl object-cover ring-2 ring-white shadow-sm`}
      />
    )
  }
  return (
    <div className={`${sizeClass} rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white flex-shrink-0`}>
      {getInitials(profile.full_name)}
    </div>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, isLoading }: { icon: React.ElementType; label: string; value?: string | null; isLoading?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
        {isLoading ? (
          <Skeleton className="h-4 w-40 mt-1" />
        ) : (
          <p className="text-sm font-medium text-neutral-900 mt-0.5 break-all">{value || '—'}</p>
        )}
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  kasir,
  onConfirm,
  onCancel,
  isPending,
}: {
  kasir: Profile
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', duration: 0.25, bounce: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">Hapus Akun Kasir?</h3>
        </div>
        <p className="text-sm text-neutral-600 leading-relaxed mb-1">
          Akun <strong className="text-neutral-900">{kasir.full_name}</strong> akan dihapus permanen dari sistem.
        </p>
        <p className="text-sm text-neutral-500 mb-5">
          Jika kasir ini memiliki data transaksi, penghapusan akan ditolak secara otomatis — gunakan <strong>Tangguhkan</strong> saja.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 active:scale-[0.96] transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-3 bg-danger text-white rounded-xl text-sm font-semibold hover:bg-danger/90 active:scale-[0.96] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-danger/20"
          >
            {isPending ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Trash2 size={14} />}
            Hapus Akun
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────
function KasirDetailDrawer({
  kasir,
  onClose,
  onToggle,
  isToggling,
  adminId,
}: {
  kasir: Profile
  onClose: () => void
  onToggle: (id: string, isActive: boolean) => void
  isToggling: boolean
  adminId?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: kasir.full_name,
    phone: kasir.phone ?? '',
    email: '',
    password: '',
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const { data: authDetails, isLoading: isLoadingEmail } = useKasirAuthDetails(kasir.id)
  const { mutate: updateKasir, isPending: isUpdating } = useUpdateKasir(() => {
    setIsEditing(false)
    setEditForm((f) => ({ ...f, password: '', email: '' }))
  })
  const { mutate: deleteKasir, isPending: isDeleting } = useDeleteKasir(onClose)

  const validateEdit = (): boolean => {
    const errs: Record<string, string> = {}
    if (!editForm.full_name.trim()) errs.full_name = 'Nama wajib diisi'
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) errs.email = 'Format email tidak valid'
    if (editForm.password && editForm.password.length < 8) errs.password = 'Password minimal 8 karakter'
    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validateEdit()) return
    updateKasir({
      id: kasir.id,
      full_name: editForm.full_name.trim(),
      phone: editForm.phone.trim() || null,
      email: editForm.email.trim() || undefined,
      password: editForm.password || undefined,
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({ full_name: kasir.full_name, phone: kasir.phone ?? '', email: '', password: '' })
    setEditErrors({})
  }

  const isOwnAccount = kasir.id === adminId

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="ml-auto w-full max-w-sm bg-white h-full overflow-y-auto flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors" aria-label="Tutup">
              <ArrowLeft size={18} className="text-neutral-600" />
            </button>
            <h2 className="text-base font-bold text-neutral-900 flex-1">Detail Kasir</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors" aria-label="Tutup panel">
              <X size={16} className="text-neutral-400" />
            </button>
          </div>

          {/* Profile hero */}
          <div className={`px-5 py-5 border-b border-neutral-100 ${kasir.is_active ? 'bg-neutral-50/30' : 'bg-blue-50/40'}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <KasirAvatar profile={kasir} size="lg" />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${kasir.is_active ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-neutral-900 leading-tight truncate">{kasir.full_name}</p>
                {isLoadingEmail ? (
                  <Skeleton className="h-3.5 w-36 mt-1" />
                ) : (
                  <p className="text-sm text-neutral-500 mt-0.5 truncate">{authDetails?.email || '—'}</p>
                )}
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full mt-2 ${kasir.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {kasir.is_active ? <CheckCircle2 size={11} /> : <ShieldOff size={11} />}
                  {kasir.is_active ? 'Aktif' : 'Ditangguhkan'}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-5 py-4">
            {!isEditing ? (
              <>
                <div className="mb-5">
                  <InfoRow icon={Mail} label="Email" value={authDetails?.email} isLoading={isLoadingEmail} />
                  <InfoRow icon={Phone} label="No. HP" value={kasir.phone} />
                  <InfoRow icon={Calendar} label="Bergabung Sejak" value={formatDate(kasir.created_at)} />
                  <InfoRow
                    icon={Clock}
                    label="Login Terakhir"
                    value={authDetails?.last_sign_in_at ? formatDateTime(authDetails.last_sign_in_at) : 'Belum pernah login'}
                    isLoading={isLoadingEmail}
                  />
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({ full_name: kasir.full_name, phone: kasir.phone ?? '', email: '', password: '' })
                      setEditErrors({})
                      setIsEditing(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.96] transition-all shadow-sm shadow-primary/20"
                  >
                    <Edit2 size={15} />
                    Edit Profil &amp; Akun
                  </button>

                  {!isOwnAccount && (
                    <button
                      type="button"
                      onClick={() => onToggle(kasir.id, !kasir.is_active)}
                      disabled={isToggling}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm active:scale-[0.96] transition-all disabled:opacity-50 border ${kasir.is_active
                          ? 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100'
                          : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                    >
                      {kasir.is_active ? <ShieldOff size={15} /> : <UserCheck size={15} />}
                      {kasir.is_active ? 'Tangguhkan Akun' : 'Aktifkan Kembali'}
                    </button>
                  )}

                  {!isOwnAccount && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10 active:scale-[0.96] transition-all"
                    >
                      <Trash2 size={15} />
                      Hapus Akun
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Edit form */
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 bg-neutral-50 rounded-xl p-3 border border-neutral-100 leading-relaxed">
                  Kosongkan Email atau Password jika tidak ingin mengubahnya.
                </p>

                {/* Nama */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => { setEditForm((f) => ({ ...f, full_name: e.target.value })); if (editErrors.full_name) setEditErrors((e) => ({ ...e, full_name: '' })) }}
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${editErrors.full_name ? 'border-danger focus:ring-danger/20' : 'border-neutral-200 focus:border-primary focus:ring-primary/20'}`}
                  />
                  {editErrors.full_name && <p className="text-xs text-danger mt-1">{editErrors.full_name}</p>}
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">No. HP</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Email baru */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Email Baru
                    <span className="ml-1.5 text-[10px] font-medium text-neutral-400 normal-case">(kosongkan jika tidak diubah)</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      autoComplete="off"
                      value={editForm.email}
                      onChange={(e) => { setEditForm((f) => ({ ...f, email: e.target.value })); if (editErrors.email) setEditErrors((e) => ({ ...e, email: '' })) }}
                      placeholder={isLoadingEmail ? 'Memuat...' : (authDetails?.email ?? 'Email saat ini')}
                      className={`w-full border rounded-xl pl-9 pr-4 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${editErrors.email ? 'border-danger focus:ring-danger/20' : 'border-neutral-200 focus:border-primary focus:ring-primary/20'}`}
                    />
                  </div>
                  {editErrors.email && <p className="text-xs text-danger mt-1">{editErrors.email}</p>}
                </div>

                {/* Password baru */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={13} className="text-neutral-500" />
                      Password Baru
                      <span className="text-[10px] font-medium text-neutral-400 normal-case">(kosongkan jika tidak diubah)</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={editForm.password}
                      onChange={(e) => { setEditForm((f) => ({ ...f, password: e.target.value })); if (editErrors.password) setEditErrors((e) => ({ ...e, password: '' })) }}
                      placeholder="Min. 8 karakter"
                      className={`w-full border rounded-xl px-4 pr-11 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${editErrors.password ? 'border-danger focus:ring-danger/20' : 'border-neutral-200 focus:border-primary focus:ring-primary/20'}`}
                    />
                    <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {editErrors.password && <p className="text-xs text-danger mt-1">{editErrors.password}</p>}
                </div>

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={handleCancel} className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 active:scale-[0.96] transition-all">
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.96] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                  >
                    {isUpdating && (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    )}
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      </motion.div>

      {/* Delete confirmation modal — rendered above drawer (z-[60]) */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            kasir={kasir}
            onConfirm={() => deleteKasir(kasir.id)}
            onCancel={() => setShowDeleteConfirm(false)}
            isPending={isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Create Kasir Modal ────────────────────────────────────────────────────────
interface CreateFormState { full_name: string; email: string; password: string; phone: string }
const EMPTY_FORM: CreateFormState = { full_name: '', email: '', password: '', phone: '' }

function CreateKasirModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<CreateFormState>>({})
  const { mutate, isPending } = useCreateKasir(() => { setForm(EMPTY_FORM); setErrors({}); onClose() })

  const validate = (): boolean => {
    const next: Partial<CreateFormState> = {}
    if (!form.full_name.trim()) next.full_name = 'Nama wajib diisi'
    if (!form.email.trim()) next.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Format email tidak valid'
    if (!form.password) next.password = 'Password wajib diisi'
    else if (form.password.length < 8) next.password = 'Minimal 8 karakter'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate({ full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(), password: form.password, phone: form.phone.trim() || null })
  }

  const field = (id: keyof CreateFormState, label: string, placeholder: string, type = 'text', required = true) => (
    <div>
      <label htmlFor={`create-${id}`} className="block text-sm font-semibold text-neutral-700 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={`create-${id}`}
          type={id === 'password' ? (showPassword ? 'text' : 'password') : type}
          autoComplete={id === 'password' ? 'new-password' : id === 'email' ? 'email' : 'off'}
          value={form[id]}
          onChange={(e) => { setForm((f) => ({ ...f, [id]: e.target.value })); if (errors[id]) setErrors((er) => ({ ...er, [id]: undefined })) }}
          placeholder={placeholder}
          className={`w-full bg-neutral-50/50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors[id] ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-neutral-200 focus:border-primary focus:ring-primary/20'} ${id === 'password' ? 'pr-11' : ''}`}
        />
        {id === 'password' && (
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors" aria-label="Toggle password">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {errors[id] && <p className="text-xs font-medium text-danger mt-1.5 flex items-center gap-1"><X size={11} />{errors[id]}</p>}
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Kasir Baru">
      <form onSubmit={handleSubmit} noValidate className="px-5 py-5 space-y-4">
        <p className="text-xs text-primary/80 bg-primary/5 border border-primary/20 rounded-xl p-3 leading-relaxed">
          Kasir akan langsung bisa login menggunakan email dan password yang Anda buat.
        </p>
        {field('full_name', 'Nama Lengkap', 'Contoh: Budi Santoso')}
        {field('email', 'Email', 'contoh@email.com', 'email')}
        {field('password', 'Password Sementara', 'Min. 8 karakter')}
        {field('phone', 'No. HP', '08xxxxxxxxxx', 'tel', false)}
        <button type="submit" disabled={isPending} className="w-full mt-2 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.96] transition-all disabled:opacity-60 shadow-md shadow-primary/20 flex items-center justify-center gap-2">
          {isPending ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Menyimpan...</> : <><UserCheck size={16} />Simpan</>}
        </button>
      </form>
    </Modal>
  )
}

// ─── Kasir Card ────────────────────────────────────────────────────────────────
function KasirCard({ kasir, onClick }: { kasir: Profile; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`w-full group bg-white rounded-2xl border transition-all duration-200 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md text-left cursor-pointer active:scale-[0.96] ${kasir.is_active ? 'border-neutral-200 hover:border-primary/25' : 'border-neutral-100 opacity-70'
        }`}
    >
      <div className="relative flex-shrink-0">
        <KasirAvatar profile={kasir} />
        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${kasir.is_active ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900 leading-tight truncate">{kasir.full_name}</p>
        {kasir.phone && (
          <div className="flex items-center gap-1 mt-0.5">
            <Phone size={11} className="text-neutral-400 flex-shrink-0" />
            <span className="text-xs text-neutral-500 tabular-nums">{kasir.phone}</span>
          </div>
        )}
        <p className="text-[11px] text-neutral-400 mt-1">Sejak {formatDate(kasir.created_at)}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${kasir.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
          {kasir.is_active ? <CheckCircle2 size={11} /> : <ShieldOff size={11} />}
          {kasir.is_active ? 'Aktif' : 'Ditangguhkan'}
        </span>
        <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transition-transform duration-150" />
      </div>
    </motion.button>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ManajemenKasirPage() {
  const { profile: adminProfile } = useAuth()
  const { data: kasirList = [], isLoading } = useKasirList()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleKasirStatus()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedKasir, setSelectedKasir] = useState<Profile | null>(null)

  const activeCount = kasirList.filter((k) => k.is_active).length
  const suspendedCount = kasirList.length - activeCount

  // Sync selectedKasir with the live kasirList data after any mutation refetch.
  // The drawer always receives syncedKasir (ground truth from the database),
  // never a stale local snapshot that could disagree with what the server stored.
  const syncedKasir = kasirList.find((k) => k.id === selectedKasir?.id) ?? null

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      if (id === adminProfile?.id) return
      toggleStatus({ id, isActive })
    },
    [adminProfile, toggleStatus],
  )

  return (
    <div className="flex flex-col min-h-dvh bg-neutral-50/50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">Tim Kasir</h1>
            <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
              {isLoading ? 'Memuat...' : `${kasirList.length} kasir · ${activeCount} aktif${suspendedCount > 0 ? ` · ${suspendedCount} ditangguhkan` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profil" className="md:hidden flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-[0.96] transition-all" aria-label="Profil Admin">
              <User size={16} strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.96] transition-all"
            >
              <PlusCircle size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Tambah Kasir</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Stats */}
          {!isLoading && kasirList.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Kasir', value: kasirList.length, color: 'text-neutral-900', bg: 'bg-white' },
                { label: 'Aktif', value: activeCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Ditangguhkan', value: suspendedCount, color: suspendedCount > 0 ? 'text-blue-700' : 'text-neutral-400', bg: suspendedCount > 0 ? 'bg-blue-50' : 'bg-neutral-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl border border-neutral-200 p-4 text-center shadow-sm`}>
                  <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
                  <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : kasirList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Kasir"
              description="Tambahkan kasir pertama agar bisa mulai mencatat transaksi."
              action={{
                label: 'Tambah Kasir Pertama',
                onClick: () => setShowCreateModal(true),
              }}
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {kasirList.map((kasir) => (
                <KasirCard key={kasir.id} kasir={kasir} onClick={() => setSelectedKasir(kasir)} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Drawer & Modals */}
      <AnimatePresence>
        {selectedKasir && syncedKasir && (
          <KasirDetailDrawer
            kasir={syncedKasir}
            onClose={() => setSelectedKasir(null)}
            onToggle={handleToggle}
            isToggling={isToggling}
            adminId={adminProfile?.id}
          />
        )}
      </AnimatePresence>

      <CreateKasirModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
