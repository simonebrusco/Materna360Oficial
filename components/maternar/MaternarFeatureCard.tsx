'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'

type MaternarFeatureCardProps = {
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
  cardId: string
  ctaText?: string
  index?: number
  tag?: string
}

export function MaternarFeatureCard({
  icon,
  title,
  subtitle,
  href,
  cardId,
  ctaText = 'Explorar',
  index = 0,
  tag,
}: MaternarFeatureCardProps) {
  const isPremium = cardId === 'planos-premium'

  const baseCardClasses =
    'h-full flex flex-col justify-between rounded-[26px] md:rounded-[20px] border border-[#FFE8F2] bg-white ' +
    'shadow-[0_4px_24px_rgba(47,58,86,0.08)] ' +
    'min-h-[200px] ' +
    'mb-0 px-4 py-5 md:px-6 md:py-6 ' +
    'transition-all duration-200 ease-out ' +
    'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:border-[#FF1475]/40 ' +
    'active:shadow-[0_2px_8px_rgba(0,0,0,0.05)]'

  const premiumCardClasses =
    'border-[#FFE8F2] bg-white ' +
    'shadow-sm ' +
    'hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]'

  return (
    <Link
      href={href}
      aria-label={title}
      data-card-id={cardId}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1475] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-3xl"
    >
      <div
        role="article"
        className={clsx(baseCardClasses, isPremium && premiumCardClasses)}
      >
        {/* Top content: Icon, Tag, Title, Subtitle */}
        <div className="flex flex-col gap-2 md:gap-4">
          <div className="inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#FFE8F2]/80 flex-shrink-0 shadow-[0_4px_12px_rgba(255,0,94,0.15)]">
            <AppIcon
              name={icon}
              className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#FF1475]"
              aria-hidden="true"
            />
          </div>

          {/* Tag, Title, Subtitle */}
          <div className="space-y-0">
            {tag && (
              <div className="pb-1 md:pb-2">
                <span className="inline-flex items-center rounded-full bg-[#FFE8F2]/70 px-2 py-0.5 text-[10px] md:text-xs font-semibold uppercase tracking-tight text-[#FF1475]">
                  {tag}
                </span>
              </div>
            )}
            {/* Accent bar above title */}
            <div className="h-1 w-12 bg-[#FF1475]/80 rounded-full mb-1.5" />
            <h3 className="text-sm md:text-lg font-semibold text-[var(--color-text-main)] leading-snug">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed pt-0.5 md:pt-1.5 line-clamp-2 md:line-clamp-3">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Bottom CTA - always at bottom */}
        <div className="mt-auto pt-3">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-xs md:text-sm font-medium text-[#FF1475] transition-all duration-150 hover:gap-1"
            aria-label={`${ctaText} ${title}`}
          >
            <span>{ctaText}</span>
            {!ctaText.includes('→') && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </div>
    </Link>
  )
}
