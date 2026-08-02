import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useNativeBack } from '@/hooks/useNativeBack'
import { Portal } from './Portal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
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
  useNativeBack(isOpen, onCancel)

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
        <Portal className="z-[100]" role="alertdialog">
          <motion.div
            className="absolute inset-0 bg-neutral-900/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* biome-ignore lint/a11y/useKeyWithClickEvents: purely mouse shortcut for escape */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: purely mouse shortcut for escape */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
            onClick={onCancel}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      variant === 'danger'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                </div>
                <div className="flex flex-col gap-1.5 mb-5 text-sm text-neutral-600 leading-relaxed">
                  {description}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  variant={variant}
                  onClick={onConfirm}
                  className="w-full sm:flex-1"
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  )
}
