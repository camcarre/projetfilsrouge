import type { ComponentChildren } from 'preact'

interface CardProps {
  title?: string
  children: ComponentChildren
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/50 p-6 transition-all duration-200 ease-out hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:-translate-y-px ${className}`}
    >
      {title && (
        <h3 className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide uppercase mb-3">
          {title}
        </h3>
      )}
      <div className="text-[14px] text-neutral-600 dark:text-neutral-400 leading-[1.55]">
        {children}
      </div>
    </div>
  )
}
