import { Button } from '@/components/ui/Button'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'primary'
  icon?: LucideIcon
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  variant = 'danger',
  icon: Icon = AlertCircle,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] antialiased"
          style={{ left: 'var(--sidebar-offset)' }}
          role="alertdialog"
          aria-modal="true"
        >
          <motion.div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />

          <div
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
            onClick={onCancel}
          >
            <motion.div
              className="bg-white rounded-[24px] shadow-xl w-full max-w-[400px] overflow-hidden flex flex-col p-5 sm:p-8"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 sm:mb-5 ${
                    variant === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon size={28} strokeWidth={2} />
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-2 sm:mb-3 text-balance tracking-tight">
                  {title}
                </h3>
                <p className="text-[14px] sm:text-[15px] text-neutral-500 leading-relaxed mb-6 sm:mb-8 text-pretty px-1 sm:px-0">
                  {description}
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  variant={variant}
                  onClick={onConfirm}
                  className="flex-1"
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
