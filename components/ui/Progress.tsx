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
  const percentage = (value / max) * 100

  return (
    <div className={className}>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-support-2 mt-1">
          {value} / {max}
        </p>
      )}
    </div>
  )
}
