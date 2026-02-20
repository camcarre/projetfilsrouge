import type { ComponentChildren } from 'preact'

type AlertVariant = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  variant?: AlertVariant
  children: ComponentChildren
  className?: string
  role?: 'alert' | 'status'
  id?: string
  'aria-live'?: 'polite' | 'assertive'
}

const STYLES: Record<AlertVariant, string> = {
  error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200',
  success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200',
  info: 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300',
}

export function Alert({ variant = 'error', children, className = '', role = 'alert', id, 'aria-live': ariaLive }: AlertProps) {
  return (
    <div
      role={role}
      id={id}
      aria-live={ariaLive}
      className={`rounded-lg border px-4 py-3 text-[13px] ${STYLES[variant]} ${className}`}
    >
      {children}
    </div>
  )
}
