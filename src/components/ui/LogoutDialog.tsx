import { LogOut } from 'lucide-react'
import { useAuthActions } from '@/hooks/useAuth'
import { ConfirmDialog } from './ConfirmDialog'

interface LogoutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutDialog({ isOpen, onClose }: LogoutDialogProps) {
  const { signOut } = useAuthActions()

  return (
    <ConfirmDialog
      isOpen={isOpen}
      icon={LogOut}
      title="Yakin ingin keluar?"
      description={
        <p className="text-sm text-neutral-600 leading-relaxed">
          Anda harus login kembali untuk masuk ke sistem.
        </p>
      }
      confirmText="Keluar"
      cancelText="Batal"
      onConfirm={signOut}
      onCancel={onClose}
      variant="danger"
    />
  )
}
