import React from 'react'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={className}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/60">
        <div className="absolute inset-0 bg-white/40 blur-md" aria-hidden />
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-all duration-500 ease-gentle"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">
          {value} / {max}
        </p>
      )}
    </div>
  )
}
