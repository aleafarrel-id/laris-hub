import { createFileRoute, redirect } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  PlusCircle,
  ShieldOff,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useKasirList, useCreateKasir, useToggleKasirStatus } from '@/hooks/useKasirManagement'
import { supabase } from '@/lib/supabase'
import { formatDate, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

export const Route = createFileRoute('/_auth/manajemen-kasir')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })

    const role = session.user.app_metadata?.role
    if (role !== 'admin') throw redirect({ to: '/kasir' })
  },
  component: ManajemenKasirPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────
interface CreateFormState {
  full_name: string
  email: string
  password: string
  phone: string
}

const EMPTY_FORM: CreateFormState = { full_name: '', email: '', password: '', phone: '' }

// ─── Avatar Component ──────────────────────────────────────────────────────────
function KasirAvatar({ profile }: { profile: Profile }) {
  const COLORS = [
    'from-violet-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-600',
  ]
  const colorClass = COLORS[profile.full_name.charCodeAt(0) % COLORS.length]

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name}
        className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-sm"
      />
    )
  }
  return (
    <div
      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white`}
    >
      {getInitials(profile.full_name)}
    </div>
  )
}

// ─── Kasir Card Component ──────────────────────────────────────────────────────
function KasirCard({
  kasir,
  onToggle,
  isToggling,
}: {
  kasir: Profile
  onToggle: (id: string, isActive: boolean) => void
  isToggling: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md ${
        kasir.is_active
          ? 'border-neutral-200 hover:border-primary/30'
          : 'border-neutral-100 bg-neutral-50/70 opacity-70'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <KasirAvatar profile={kasir} />
        <span
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
            kasir.is_active ? 'bg-emerald-500' : 'bg-neutral-400'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900 leading-tight truncate">
          {kasir.full_name}
        </p>
        {kasir.phone && (
          <div className="flex items-center gap-1 mt-0.5">
            <Phone size={11} className="text-neutral-400 flex-shrink-0" />
            <span className="text-xs text-neutral-500 tabular-nums">{kasir.phone}</span>
          </div>
        )}
        <p className="text-[11px] text-neutral-400 mt-1">
          Sejak {formatDate(kasir.created_at)}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            kasir.is_active
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {kasir.is_active ? (
            <>
              <CheckCircle2 size={11} />
              Aktif
            </>
          ) : (
            <>
              <ShieldOff size={11} />
              Ditangguhkan
            </>
          )}
        </span>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => onToggle(kasir.id, !kasir.is_active)}
          disabled={isToggling}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait ${
            kasir.is_active
              ? 'text-danger bg-danger/5 hover:bg-danger/15 border border-danger/20'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          {kasir.is_active ? 'Tangguhkan' : 'Aktifkan'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Create Kasir Modal ────────────────────────────────────────────────────────
function CreateKasirModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<CreateFormState>>({})
  const { mutate, isPending } = useCreateKasir(() => {
    setForm(EMPTY_FORM)
    setErrors({})
    onClose()
  })

  const validate = useCallback((): boolean => {
    const next: Partial<CreateFormState> = {}
    if (!form.full_name.trim()) next.full_name = 'Nama wajib diisi'
    if (!form.email.trim()) next.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Format email tidak valid'
    if (!form.password) next.password = 'Password wajib diisi'
    else if (form.password.length < 8) next.password = 'Minimal 8 karakter'
    setErrors(next)
    return Object.keys(next).length === 0
  }, [form])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return
      mutate({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || null,
      })
    },
    [form, validate, mutate],
  )

  const field = (id: keyof CreateFormState, label: string, placeholder: string, type = 'text') => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-700 mb-1.5">
        {label}
        {id !== 'phone' && <span className="text-danger ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={id === 'password' ? (showPassword ? 'text' : 'password') : type}
          autoComplete={id === 'password' ? 'new-password' : id === 'email' ? 'email' : 'off'}
          value={form[id]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [id]: e.target.value }))
            if (errors[id]) setErrors((er) => ({ ...er, [id]: undefined }))
          }}
          placeholder={placeholder}
          className={`w-full bg-neutral-50/50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all ${
            errors[id]
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-neutral-200 focus:border-primary focus:ring-primary/20'
          } ${id === 'password' ? 'pr-11' : ''}`}
        />
        {id === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {errors[id] && (
        <p className="text-xs font-medium text-danger mt-1.5 flex items-center gap-1">
          <X size={11} />
          {errors[id]}
        </p>
      )}
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Kasir Baru">
      <form onSubmit={handleSubmit} noValidate className="px-5 py-5 space-y-4">
        <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary/80 leading-relaxed">
          Kasir akan langsung bisa login menggunakan email dan password yang Anda buat.
        </div>

        {field('full_name', 'Nama Lengkap', 'Contoh: Budi Santoso')}
        {field('email', 'Email', 'contoh@email.com', 'email')}
        {field('password', 'Password Sementara', 'Min. 8 karakter')}
        {field('phone', 'No. HP (Opsional)', '08xxxxxxxxxx', 'tel')}

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait shadow-md shadow-primary/20 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Membuat akun...
            </>
          ) : (
            <>
              <UserCheck size={16} />
              Buat Akun Kasir
            </>
          )}
        </button>
      </form>
    </Modal>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ManajemenKasirPage() {
  const { profile: adminProfile } = useAuth()
  const { data: kasirList = [], isLoading } = useKasirList()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleKasirStatus()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const activeCount = kasirList.filter((k) => k.is_active).length
  const suspendedCount = kasirList.length - activeCount

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      // Prevent admin from toggling themselves (shouldn't happen but safety check)
      if (id === adminProfile?.id) return
      toggleStatus({ id, isActive })
    },
    [adminProfile, toggleStatus],
  )

  return (
    <div className="flex flex-col min-h-dvh bg-neutral-50/50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">
              Manajemen Kasir
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {kasirList.length} kasir terdaftar · {activeCount} aktif
              {suspendedCount > 0 && ` · ${suspendedCount} ditangguhkan`}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all"
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.2, bounce: 0 }}
          >
            <PlusCircle size={16} strokeWidth={2.5} />
            <span className="hidden xs:inline">Tambah Kasir</span>
            <span className="xs:hidden">Tambah</span>
          </motion.button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-3">

          {/* Stats bar */}
          {!isLoading && kasirList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 gap-3 mb-5"
            >
              {[
                { label: 'Total Kasir', value: kasirList.length, color: 'text-neutral-900', bg: 'bg-white' },
                { label: 'Aktif', value: activeCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Ditangguhkan', value: suspendedCount, color: 'text-neutral-500', bg: 'bg-neutral-100' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl border border-neutral-200 p-4 text-center shadow-sm`}>
                  <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
                  <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : kasirList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-neutral-200 shadow-sm py-16 flex flex-col items-center gap-4 text-center px-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users size={28} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-base font-bold text-neutral-900">Belum Ada Kasir</p>
                <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                  Tambahkan kasir pertama Anda agar mereka bisa mulai mencatat transaksi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
              >
                <PlusCircle size={16} />
                Tambah Kasir Pertama
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {kasirList.map((kasir) => (
                <KasirCard
                  key={kasir.id}
                  kasir={kasir}
                  onToggle={handleToggle}
                  isToggling={isToggling}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Create Modal ── */}
      <CreateKasirModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
