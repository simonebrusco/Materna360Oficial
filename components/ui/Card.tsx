import React from 'react'

import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
}

export function Card({
  children,
  className = '',
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      className={`group/card glass-panel blurred-border transition-all duration-500 ease-gentle hover:-translate-y-1 hover:shadow-elevated ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 -z-10 bg-materna-card opacity-0 transition-opacity duration-700 group-hover/card:opacity-80" />
      <span className="pointer-events-none absolute inset-x-6 top-2 -z-0 h-1 rounded-full bg-white/70 opacity-0 blur-lg transition-opacity duration-700 group-hover/card:opacity-100" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
