import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({
    left: '0px',
    right: 'auto',
    transformOrigin: 'top left',
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const screenWidth = window.innerWidth

      if (rect.left > screenWidth / 2) {
        setDropdownStyle({ left: 'auto', right: '0px', transformOrigin: 'top right' })
      } else {
        setDropdownStyle({ left: '0px', right: 'auto', transformOrigin: 'top left' })
      }
    }
  }, [isOpen])

  const selectedOption = options.find((o) => o.value === value)

  return (
    <div className={`relative inline-block text-left min-w-[140px] ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all active:scale-[0.96]"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full min-w-[160px] rounded-xl bg-white p-1.5 shadow-xl shadow-black/5 ring-1 ring-black/5 animate-slide-up"
          style={dropdownStyle}
        >
          <div className="space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                  value === option.value
                    ? 'bg-primary/5 text-primary font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {option.icon}
                  {option.label}
                </span>
                {value === option.value && (
                  <Check size={14} className="text-primary flex-shrink-0" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
