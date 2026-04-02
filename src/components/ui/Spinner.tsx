interface SpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${s} ${className}`}
      role="status"
      aria-label="Chargement"
    />
  )
}
