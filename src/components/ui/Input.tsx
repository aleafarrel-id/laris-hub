import type React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string
  leftDecorator?: React.ReactNode
  rightDecorator?: React.ReactNode
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode
  error?: string
}

const BASE_INPUT_CLASS =
  'w-full border rounded-xl px-4 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-sm'

const errorClass = 'border-danger focus:ring-danger/20 focus:border-danger'
const defaultClass =
  'border-neutral-200 focus:ring-primary/20 focus:border-primary hover:border-neutral-300'

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
    >
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  )
}

/**
 * Reusable form input with optional label, error message,
 * and inline left/right decorators (e.g. "Rp" prefix or an icon).
 */
export function Input({
  label,
  error,
  leftDecorator,
  rightDecorator,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const stateClass = error ? errorClass : defaultClass
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        {leftDecorator && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-neutral-500 text-sm pointer-events-none">
            {leftDecorator}
          </span>
        )}
        <input
          id={id}
          required={required}
          className={cn(
            BASE_INPUT_CLASS,
            stateClass,
            leftDecorator && 'pl-10',
            rightDecorator && 'pr-10',
            className,
          )}
          {...props}
        />
        {rightDecorator && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
            {rightDecorator}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
    </div>
  )
}

/**
 * Reusable textarea input, sharing the same styling system as Input.
 */
export function Textarea({ label, error, className, id, required, ...props }: TextareaProps) {
  const stateClass = error ? errorClass : defaultClass
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      )}
      <textarea
        id={id}
        className={cn(BASE_INPUT_CLASS, stateClass, 'min-h-[100px] resize-y', className)}
        {...props}
      />
      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
    </div>
  )
}
