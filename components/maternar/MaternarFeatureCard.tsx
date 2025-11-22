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
  const isSpecial = isPremium || isConquistas

  const baseCardClasses =
    'h-full flex flex-col rounded-3xl border bg-white ' +
    'shadow-[0_2px_12px_rgba(47,58,86,0.06)] ' +
    'min-h-[200px] ' +
    'px-5 md:px-6 py-5 md:py-6 ' +
    'transition-all duration-200 ease-out ' +
    'hover:shadow-[0_8px_28px_rgba(47,58,86,0.1)] ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  // Special treatment for Materna+ and Minhas Conquistas
  const specialCardClasses = isSpecial
    ? 'border-l-[3px] border-l-[#9B4D96] border-t border-t-[#FFE8F2] border-r border-r-[#FFE8F2] border-b border-b-[#FFE8F2] ' +
      'hover:shadow-[0_12px_32px_rgba(155,77,150,0.15)]'
    : 'border-[#FFE8F2] hover:border-[#FF1475]/25'

  return (
    <Link
      href={href}
      aria-label={title}
      data-card-id={cardId}
      className={clsx(
        'block h-full rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isSpecial
          ? 'focus-visible:ring-[#9B4D96] focus-visible:ring-offset-white'
          : 'focus-visible:ring-[#FF1475] focus-visible:ring-offset-white'
      )}
    >
      <div
        role="article"
        className={clsx(baseCardClasses, specialCardClasses)}
      >
        {/* Top Row: Category Badge (Left) + Icon (Right) */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Category Badge - Left */}
          {tag && (
            <div>
              <span className="inline-flex items-center rounded-full bg-[#FFE8F2] px-2.5 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#9B4D96]">
                {tag}
              </span>
            </div>
          )}
          {!tag && <div />}

          {/* Icon - Top Right, smaller size, plum color */}
          <div
            className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg transition-all"
            style={{
              backgroundColor: isSpecial ? 'rgba(155, 77, 150, 0.08)' : 'rgba(255, 20, 117, 0.06)',
            }}
          >
            <AppIcon
              name={icon}
              className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0"
              style={{ color: '#9B4D96' }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Accent Line */}
        <div
          className="h-0.5 w-8 rounded-full mb-3 md:mb-3.5"
          style={{ backgroundColor: '#9B4D96' }}
        />

        {/* Title + Subtitle - Tight Spacing */}
        <div className="flex-1 space-y-1.5 md:space-y-2 mb-4 md:mb-5">
          <h3 className="text-sm md:text-base font-semibold text-[#3A3A3A] leading-tight">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-[#6A6A6A] leading-snug line-clamp-2 md:line-clamp-3">
            {subtitle}
          </p>
        </div>

        {/* Premium CTA - Plum color, arrow icon, medium weight, hover animation */}
        <div className="mt-auto pt-0.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium transition-all duration-150 hover:translate-x-[2px]"
            style={{ color: '#9B4D96' }}
            aria-label={`${ctaText} ${title}`}
          >
            <span>{ctaText}</span>
            <AppIcon
              name="chevron"
              className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0"
              style={{ color: '#9B4D96' }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </Link>
  )
}
