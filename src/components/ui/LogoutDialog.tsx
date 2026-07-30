import { LogOut } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import { useAuthActions } from '@/hooks/useAuth'

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
      description="Anda harus login kembali untuk masuk ke sistem."
      confirmText="Keluar"
      cancelText="Batal"
      onConfirm={signOut}
      onCancel={onClose}
      variant="danger"
    />
  )
}
