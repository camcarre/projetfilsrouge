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

interface SkeletonTextProps {
  width?: string
}

export function SkeletonText({ width = 'w-full' }: SkeletonTextProps) {
  return <Skeleton className={`h-4 ${width}`} />
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}
