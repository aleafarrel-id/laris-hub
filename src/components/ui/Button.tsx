import { Loader2 } from 'lucide-react'
import type React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30',
  danger:
    'bg-danger text-white shadow-md shadow-danger/20 hover:bg-danger/90 hover:shadow-danger/30',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
  outline:
    'border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3.5 text-sm',
}

/**
 * Reusable button component.
 * Supports `primary`, `danger`, `ghost`, and `outline` variants,
 * and integrates a standardized loading/disabled state.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all active:scale-[0.96] cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {isLoading ? loadingText || children : children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
