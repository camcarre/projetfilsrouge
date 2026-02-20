import type { ComponentChildren } from 'preact'
import type { ButtonHTMLAttributes } from 'preact/compat'

const VARIANTS = {
  primary: 'bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm hover:shadow-md',
  secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600',
  outline: 'border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/50',
} as const

export type ButtonVariant = keyof typeof VARIANTS

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children?: ComponentChildren
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-[13px] font-medium tracking-tight transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
