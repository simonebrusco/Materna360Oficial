'use client'

interface SkeletonProps {
  variant?: 'card' | 'line' | 'avatar'
  count?: number
  className?: string
}

export function Skeleton({ variant = 'card', count = 1, className = '' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/60 rounded'

  const variantClasses = {
    card: 'h-32 rounded-2xl',
    line: 'h-4 w-full',
    avatar: 'h-12 w-12 rounded-full',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  if (count === 1) {
    return <div className={classes} aria-hidden />
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skeleton-${i}`} className={classes} aria-hidden />
      ))}
    </div>
  )
}
