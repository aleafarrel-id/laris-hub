import { Eye, EyeOff, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useCreateCashier } from '@/hooks/useCashierManagement'

interface CreateFormState {
  full_name: string
  email: string
  password: string
  phone: string
}
const EMPTY_FORM: CreateFormState = { full_name: '', email: '', password: '', phone: '' }

export function CreateCashierModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<CreateFormState>>({})
  const { mutate, isPending } = useCreateCashier(() => {
    setForm(EMPTY_FORM)
    setErrors({})
    onClose()
  })

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
    mutate({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim() || null,
    })
  }

  const field = (
    id: keyof CreateFormState,
    label: string,
    placeholder: string,
    type = 'text',
    required = true,
  ) => (
    <Input
      id={`create-${id}`}
      type={id === 'password' ? (showPassword ? 'text' : 'password') : type}
      label={label}
      required={required}
      autoComplete={id === 'password' ? 'new-password' : id === 'email' ? 'email' : 'off'}
      value={form[id]}
      onChange={(e) => {
        setForm((f) => ({ ...f, [id]: e.target.value }))
        if (errors[id]) setErrors((er) => ({ ...er, [id]: undefined }))
      }}
      placeholder={placeholder}
      error={errors[id]}
      rightDecorator={
        id === 'password' ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="p-1 hover:text-neutral-700 transition-colors"
            aria-label="Toggle password"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : undefined
      }
    />
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Kasir Baru">
      <form onSubmit={handleSubmit} noValidate className="px-5 py-5 space-y-4">
        <p className="text-xs text-primary/80 bg-primary/5 border border-primary/20 rounded-xl p-3 leading-relaxed">
          Kasir akan langsung bisa login menggunakan akun yang Anda buat.
        </p>
        {field('full_name', 'Nama Lengkap', 'Contoh: Budi Santoso')}
        {field('email', 'Email', 'contoh@email.com', 'email')}
        {field('password', 'Password Sementara', 'Min. 8 karakter')}
        {field('phone', 'No. HP', '08xxxxxxxxxx', 'tel', false)}
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
          className="w-full mt-2 py-3.5"
          leftIcon={<UserCheck size={16} />}
        >
          Simpan
        </Button>
      </form>
    </Modal>
  )
}
