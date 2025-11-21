'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'

export interface PremiumCardProps {
  icon?: 'star' | 'pdf' | 'heart' | 'lock' | 'upgrade'
  title: string
  subtitle: string
  description?: string
  ctaText?: string
  ctaHref?: string
  onCta?: () => void
  variant?: 'default' | 'elevated'
  className?: string
}

/**
 * Unified premium/paywall card component
 * Used for premium actions like PDF export, advanced features, etc.
 */
export function PremiumCard({
  icon = 'star',
  title,
  subtitle,
  description,
  ctaText = 'Conhecer planos',
  ctaHref = '/planos',
  onCta,
  variant = 'default',
  className = '',
}: PremiumCardProps) {
  const handleCta = () => {
    if (onCta) {
      onCta()
    } else if (ctaHref) {
      // Navigate using Next.js navigation
      window.location.href = ctaHref
    }
  }

  const cardClasses = {
    default: 'bg-gradient-to-br from-white/95 to-white/85 border border-white/60',
    elevated: 'bg-gradient-to-br from-[var(--color-brand)]/5 to-[var(--color-soft-strong)]/10 border border-[var(--color-brand)]/20',
  }

  return (
    <div className={`${cardClasses[variant]} rounded-2xl p-6 md:p-8 shadow-soft ${className}`}>
      {/* Icon */}
      <div className="mb-4 inline-block p-3 rounded-xl bg-[var(--color-brand)]/10">
        <AppIcon
          name={icon as any}
          size={32}
          className="text-[var(--color-brand)]"
          decorative
        />
      </div>

      {/* Content */}
      <h3 className="m360-card-title mb-2 text-lg md:text-xl">{title}</h3>
      <p className="m360-subtitle mb-3 text-base">{subtitle}</p>

      {description && (
        <p className="m360-body mb-6 text-sm md:text-base text-[var(--color-text-muted)]">
          {description}
        </p>
      )}

      {/* CTA Button */}
      <Button
        variant="primary"
        onClick={handleCta}
        className="w-full md:w-auto"
      >
        {ctaText}
      </Button>
    </div>
  )
}
