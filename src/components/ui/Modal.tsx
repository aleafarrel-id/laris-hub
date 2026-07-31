import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Portal } from './Portal'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** 'bottom' slides up from bottom (mobile), 'center' is centered dialog */
  variant?: 'bottom' | 'center'
}

export function Modal({ isOpen, onClose, title, children, variant = 'bottom' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

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
    : 'relative bg-white rounded-2xl shadow-modal w-full max-w-md max-h-[90dvh] flex flex-col mx-auto'

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal className="z-50" role="dialog" aria-labelledby="modal-title">
          <motion.div
            className="absolute inset-0 bg-neutral-900/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          />

          {/* biome-ignore lint/a11y/useKeyWithClickEvents: purely mouse shortcut for escape */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: purely mouse shortcut for escape */}
          <div
            className={`absolute inset-0 flex ${
              isBottom
                ? 'flex-col justify-end sm:justify-center p-0 sm:p-4'
                : 'items-center justify-center p-4 sm:p-6'
            }`}
            onClick={onClose}
          >
            <motion.div
              className={`${contentClass} will-change-transform`}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {isBottom && (
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-neutral-200" />
                </div>
              )}

              {title && (
                <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-neutral-100 flex-shrink-0">
                  <h2
                    id="modal-title"
                    className="text-base font-semibold text-neutral-900 text-balance tracking-tight"
                  >
                    {title}
                  </h2>
                </div>
              )}

              <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  )
}
