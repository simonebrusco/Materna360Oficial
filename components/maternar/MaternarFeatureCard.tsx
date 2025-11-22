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
  const isConquistas = cardId === 'minhas-conquistas-hub'

  const baseCardClasses =
    'h-full flex flex-col justify-between rounded-2xl border border-[#FFE8F2] bg-white ' +
    'shadow-[0_2px_12px_rgba(47,58,86,0.06)] ' +
    'min-h-[220px] ' +
    'mb-0 px-4 py-6 md:px-6 md:py-7 ' +
    'transition-all duration-200 ease-out ' +
    'hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(47,58,86,0.1)] hover:border-[#FF1475]/30 ' +
    'active:shadow-[0_2px_8px_rgba(0,0,0,0.05)]'

  const premiumCardClasses =
    'border-[#e865a7] ' +
    'hover:border-[#b8236b]/50'

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
        <div className="flex flex-col gap-2.5 md:gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF1475]/5 flex-shrink-0 shadow-[0_0_0_8px_rgba(255,20,117,0.06)]">
            <AppIcon
              name={icon}
              className="h-5 w-5 text-[#FF1475]"
              aria-hidden="true"
            />
          </div>

          {/* Tag, Title, Subtitle */}
          <div className="space-y-0">
            {tag && (
              <div className="pb-1.5 md:pb-2">
                <span className="inline-flex items-center rounded-full bg-[#FFE8F2] px-2 py-0.5 text-[10px] md:text-xs font-semibold uppercase tracking-tight text-[#FF1475]">
                  {tag}
                </span>
              </div>
            )}
            {/* Accent bar above title - shorter, more elegant */}
            <div className="h-[2px] w-8 bg-[#FF1475]/30 rounded-full mb-2.5" />
            <h3 className="text-sm md:text-lg font-semibold text-[var(--color-text-main)] leading-snug">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed pt-0.5 md:pt-1.5 line-clamp-2 md:line-clamp-3">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Bottom CTA - always at bottom with breathing room */}
        <div className="mt-auto pt-5 md:pt-6">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-xs md:text-sm font-semibold text-[#FF1475] transition-all duration-150 hover:gap-1 active:opacity-80"
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
