import { createPortal } from 'react-dom'

interface PortalProps {
  children: React.ReactNode
  className?: string
  role?: string
  'aria-labelledby'?: string
}

/**
 * Global Portal component for all Modals/Dialogs/Overlays.
 * Automatically handles React createPortal, font-family inheritance,
 * and smart sidebar offset alignment.
 */
export function Portal({ children, className = '', role, 'aria-labelledby': ariaLabelledBy }: PortalProps) {
  const content = (
    <div
      className={`fixed inset-0 antialiased font-sans ${className}`}
      style={{ left: 'var(--sidebar-offset)' }}
      role={role}
      aria-modal={role ? 'true' : undefined}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </div>
  )

  return createPortal(content, document.body)
}
