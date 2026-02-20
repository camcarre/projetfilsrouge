interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-700 ${className}`}
      aria-hidden
    />
  )
}
