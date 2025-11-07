'use client'

import React, { useState } from 'react'
import { Button } from './Button'
import AppIcon from './AppIcon'
import { Card } from './card'

interface PaywallBannerProps {
  title: string
  description: string
  featureName: string
  upgradeText?: string
  onUpgradeClick?: () => void
  onDismiss?: () => void
  variant?: 'info' | 'warning'
}

/**
 * Soft paywall banner - never blocks user flow
 * - Always dismissible
 * - Always has "see later" option
 * - Positioned at top of feature
 * - Non-intrusive styling
 */
export function PaywallBanner({
  title,
  description,
  featureName,
  upgradeText = 'Conheça os planos',
  onUpgradeClick,
  onDismiss,
  variant = 'info',
}: PaywallBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <Card className={`relative overflow-hidden p-4 md:p-5 rounded-[var(--radius-card)] border ${
      variant === 'warning'
        ? 'border-yellow-200/50 bg-yellow-50/30'
        : 'border-white/60 bg-white/95'
    }`}>
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <AppIcon
            name={variant === 'warning' ? 'alert-circle' : 'sparkles'}
            size={20}
            variant={variant === 'warning' ? 'muted' : 'brand'}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-support-1">
            {title}
          </h3>
          <p className="text-xs text-support-2 mt-1">
            {description}
          </p>

          {/* CTAs */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={onUpgradeClick}
              className="text-xs"
            >
              {upgradeText}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs"
            >
              Ver depois
            </Button>
          </div>
        </div>

        {/* Close button (alternative dismiss) */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 mt-0.5 text-support-2 hover:text-support-1 transition-colors"
          aria-label="Fechar"
        >
          <AppIcon name="x" size={16} />
        </button>
      </div>
    </Card>
  )
}
