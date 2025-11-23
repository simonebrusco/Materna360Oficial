'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'

export interface SectionBlockProps {
  title: string
  icon?: 'star' | 'heart' | 'place' | 'care' | 'time' | 'books'
  children: React.ReactNode
  className?: string
  collapsible?: boolean
}

/**
 * Section block component for organizing meu-dia content into themed sections
 * Provides consistent visual hierarchy with icon, title, and content grouping
 */
export function SectionBlock({
  title,
  icon,
  children,
  className = '',
  collapsible = false,
}: SectionBlockProps) {
  const [isOpen, setIsOpen] = React.useState(true)

  if (collapsible && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full text-left p-4 rounded-xl bg-white/50 border border-white/60 hover:bg-white/70 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2">
          {icon && <AppIcon name={icon} size={20} className="text-primary" decorative />}
          <h2 className="m360-card-title">{title}</h2>
          <span className="ml-auto text-xs text-[#545454]">Expandir</span>
        </div>
      </button>
    )
  }

  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <AppIcon name={icon} size={24} className="text-primary" decorative />}
        <h2 className="m360-title-page">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
