'use client';

import React, { ReactNode } from 'react';
import SoftCard from '@/components/ui/SoftCard';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';

export interface PremiumPaywallCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'pdf' | 'insight' | 'coach';
  className?: string;
}

/**
 * A reusable, elegant premium paywall card component.
 * Displays a soft pink-tinted card with icon, title, description, and CTA.
 * Fully mobile-first and consistent with Materna360 design system.
 */
export function PremiumPaywallCard({
  title,
  description,
  ctaLabel,
  icon,
  onClick,
  variant = 'default',
  className = '',
}: PremiumPaywallCardProps) {
  const variantStyles = {
    default: 'from-primary/8 to-white border-primary/30',
    pdf: 'from-primary/8 to-white border-primary/30',
    insight: 'from-primary/8 to-white border-primary/30',
    coach: 'from-primary/8 to-white border-primary/30',
  };

  const bgClass = variantStyles[variant];

  return (
    <SoftCard className={`mb-4 bg-gradient-to-br ${bgClass} ${className}`}>
      <div className="flex items-start gap-4 sm:items-center sm:justify-between">
        {/* Left side: Icon (if provided), Title, and Description */}
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          {icon ? (
            <div className="flex-shrink-0 mt-0.5">
              {typeof icon === 'string' ? (
                <AppIcon name={icon as any} size={24} decorative className="text-primary" />
              ) : (
                icon
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-2">
              <AppIcon name="sparkles" size={12} decorative />
              <span>Premium</span>
            </div>
          )}

          {/* Title and Description */}
          <div className="flex-1">
            {icon && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-2">
                <AppIcon name="sparkles" size={12} decorative />
                <span>Premium</span>
              </div>
            )}
            <h3 className="font-semibold text-support-1">{title}</h3>
            <p className="text-xs text-support-2 mt-1">{description}</p>
          </div>
        </div>

        {/* Right side: CTA Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onClick}
          className="flex-shrink-0 whitespace-nowrap"
        >
          {ctaLabel}
        </Button>
      </div>
    </SoftCard>
  );
}

export default PremiumPaywallCard;
