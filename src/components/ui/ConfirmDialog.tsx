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
}: ConfirmDialogProps) {
  // Prevent body scroll and close on Escape
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
          className="fixed inset-0 z-[100]"
          style={{ left: 'var(--layout-sidebar-width)' }}
          role="alertdialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-modal w-full max-w-sm overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              <div className="p-5">
                <div className="flex gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${variant === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}
                  >
                    <AlertCircle size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 px-5 py-4 flex gap-3 justify-end border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors active:scale-95 shadow-sm ${
                    variant === 'danger'
                      ? 'bg-danger hover:bg-danger-dark shadow-danger/20'
                      : 'bg-primary hover:bg-primary-700 shadow-primary/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
