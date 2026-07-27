import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** 'bottom' slides up from bottom (mobile), 'center' is centered dialog */
  variant?: 'bottom' | 'center'
}

/**
 * Accessible modal — bottom sheet on mobile, centered on desktop.
 * Closes on backdrop click and Escape key.
 * Uses motion/react for smooth enter/exit animations.
 */
export function Modal({ isOpen, onClose, title, children, variant = 'bottom' }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const isBottom = variant === 'bottom'

  const contentVariants = isBottom
    ? {
        hidden: { y: '100%', opacity: 0.8 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: 'spring' as const, duration: 0.3, bounce: 0 },
        },
        exit: {
          y: '100%',
          opacity: 0.8,
          transition: { type: 'spring' as const, duration: 0.3, bounce: 0 },
        },
      }
    : {
        hidden: { scale: 0.94, opacity: 0, y: 8 },
        visible: {
          scale: 1,
          opacity: 1,
          y: 0,
          transition: { type: 'spring' as const, duration: 0.3, bounce: 0 },
        },
        exit: {
          scale: 0.96,
          opacity: 0,
          y: 4,
          transition: { duration: 0.15, ease: 'easeIn' as const },
        },
      }

  const contentClass = isBottom
    ? 'absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-modal max-h-[90dvh] flex flex-col'
    : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-modal w-full max-w-md max-h-[90dvh] flex flex-col'

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 antialiased"
          style={{ left: 'var(--layout-sidebar-width)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          />

          {/* Content Wrapper (captures outside clicks) */}
          <div 
            className="absolute inset-0 flex flex-col justify-end sm:justify-center p-0 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              className={contentClass}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle (bottom sheet only) */}
              {isBottom && (
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-neutral-200" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-neutral-100 flex-shrink-0">
                <h2 id="modal-title" className="text-base font-semibold text-neutral-900 text-balance tracking-tight">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all active:scale-[0.96]"
                  aria-label="Tutup modal"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
