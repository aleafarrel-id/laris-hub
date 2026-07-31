import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  ShieldOff,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useDeleteKasir,
  useKasirAuthDetails,
  useUpdateKasir,
} from '@/hooks/useKasirManagement'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { Profile } from '@/types'
import { KasirAvatar } from './KasirAvatar'

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
  isLoading?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-4 w-40 mt-1" />
        ) : (
          <p className="text-sm font-medium text-neutral-900 mt-0.5 break-all">{value || '-'}</p>
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
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
          Akun <strong className="text-neutral-900">{kasir.full_name}</strong> akan dihapus permanen
          dari sistem.
        </p>
        <p className="text-sm text-neutral-500 mb-5">
          Jika kasir memiliki data transaksi, penghapusan akan ditolak secara otomatis, gunakan{' '}
          <strong>Tangguhkan</strong>.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="w-full sm:flex-1"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            isLoading={isPending}
            className="w-full sm:flex-1"
          >
            Hapus
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export function KasirDetailDrawer({
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
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim()))
      errs.email = 'Format email tidak valid'
    if (editForm.password && editForm.password.length < 8)
      errs.password = 'Password minimal 8 karakter'
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
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <ArrowLeft size={18} className="text-neutral-600" />
            </button>
            <h2 className="text-base font-bold text-neutral-900 flex-1">Detail Kasir</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
              aria-label="Tutup panel"
            >
              <X size={16} className="text-neutral-400" />
            </button>
          </div>

          {/* Profile hero */}
          <div
            className={`px-5 py-5 border-b border-neutral-100 ${kasir.is_active ? 'bg-neutral-50/30' : 'bg-amber-50/40'}`}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <KasirAvatar profile={kasir} size="lg" />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${kasir.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-neutral-900 leading-tight truncate">
                  {kasir.full_name}
                </p>
                {isLoadingEmail ? (
                  <Skeleton className="h-3.5 w-36 mt-1" />
                ) : (
                  <p className="text-sm text-neutral-500 mt-0.5 truncate">
                    {authDetails?.email || '-'}
                  </p>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full mt-2 ${kasir.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                >
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
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={authDetails?.email}
                    isLoading={isLoadingEmail}
                  />
                  <InfoRow icon={Phone} label="No. HP" value={kasir.phone} />
                  <InfoRow
                    icon={Calendar}
                    label="Bergabung Sejak"
                    value={formatDate(kasir.created_at)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Login Terakhir"
                    value={
                      authDetails?.last_sign_in_at
                        ? formatDateTime(authDetails.last_sign_in_at)
                        : 'Belum pernah login'
                    }
                    isLoading={isLoadingEmail}
                  />
                </div>

                <div className="space-y-2.5">
                  <Button
                    type="button"
                    onClick={() => {
                      setEditForm({
                        full_name: kasir.full_name,
                        phone: kasir.phone ?? '',
                        email: '',
                        password: '',
                      })
                      setEditErrors({})
                      setIsEditing(true)
                    }}
                    className="w-full"
                    leftIcon={<Edit2 size={15} />}
                  >
                    Edit Profil &amp; Akun
                  </Button>

                  {!isOwnAccount && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onToggle(kasir.id, !kasir.is_active)}
                      disabled={isToggling}
                      className={`w-full border ${
                        kasir.is_active
                          ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300'
                          : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
                      }`}
                      leftIcon={kasir.is_active ? <ShieldOff size={15} /> : <UserCheck size={15} />}
                    >
                      {kasir.is_active ? 'Tangguhkan Akun' : 'Aktifkan Kembali'}
                    </Button>
                  )}

                  {!isOwnAccount && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full text-danger border-danger/20 bg-danger/5 hover:bg-danger/10 hover:border-danger/30"
                      leftIcon={<Trash2 size={15} />}
                    >
                      Hapus Akun
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* Edit form */
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 bg-neutral-50 rounded-xl p-3 border border-neutral-100 leading-relaxed">
                  Kosongkan jika tidak ingin mengubahnya.
                </p>

                {/* Nama */}
                <Input
                  id="full_name"
                  type="text"
                  label="Nama Lengkap"
                  required
                  value={editForm.full_name}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, full_name: e.target.value }))
                    if (editErrors.full_name) setEditErrors((e) => ({ ...e, full_name: '' }))
                  }}
                  error={editErrors.full_name}
                />

                {/* No HP */}
                <Input
                  id="phone"
                  type="tel"
                  label="No. HP"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                />

                {/* Email baru */}
                <Input
                  id="email"
                  type="email"
                  label={
                    <>
                      Email Baru{' '}
                      <span className="ml-1.5 text-[10px] font-medium text-neutral-400 normal-case">
                        (kosongkan jika tidak diubah)
                      </span>
                    </>
                  }
                  autoComplete="off"
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                    if (editErrors.email) setEditErrors((e) => ({ ...e, email: '' }))
                  }}
                  placeholder={
                    isLoadingEmail ? 'Memuat...' : (authDetails?.email ?? 'Email saat ini')
                  }
                  leftDecorator={<Mail size={15} />}
                  error={editErrors.email}
                />

                {/* Password baru */}
                <Input
                  id="password"
                  type={showNewPassword ? 'text' : 'password'}
                  label={
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={13} className="text-neutral-500" />
                      Password Baru{' '}
                      <span className="text-[10px] font-medium text-neutral-400 normal-case">
                        (kosongkan jika tidak diubah)
                      </span>
                    </span>
                  }
                  autoComplete="new-password"
                  value={editForm.password}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, password: e.target.value }))
                    if (editErrors.password) setEditErrors((e) => ({ ...e, password: '' }))
                  }}
                  placeholder="Min. 8 karakter"
                  error={editErrors.password}
                  rightDecorator={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="p-1 hover:text-neutral-700 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isUpdating}
                    isLoading={isUpdating}
                    className="flex-1"
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      </motion.div>

      {/* Delete confirmation modal - rendered above drawer (z-[60]) */}
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
