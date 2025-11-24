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

  // Enhanced premium spacing for special cards
  const baseCardClasses = clsx(
    'h-full flex flex-col rounded-3xl border bg-white transition-all duration-200 ease-out',
    isSpecial
      ? 'min-h-[190px] md:min-h-[210px] px-4 md:px-6 py-5 md:py-7'
      : 'min-h-[180px] md:min-h-[200px] px-4 md:px-6 py-4 md:py-6',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  )

  // Special premium styling for Materna+ and Minhas Conquistas
  const specialCardClasses = isSpecial
    ? clsx(
        // Enhanced plumSoft border (light plum) for premium presence
        'border-[#E8D4E8] border-[1.5px]',
        // Premium glow shadow: larger blur (14px), subtle spread, 10% opacity
        'shadow-[0_4px_14px_rgba(155,77,150,0.10)]',
        // Enhanced hover state with plum glow
        'hover:shadow-[0_8px_28px_rgba(155,77,150,0.16)]',
        // Elegant curved left accent in plum
        'border-l-[4px] border-l-[#9B4D96]',
        // Premium focus ring
        'focus-visible:ring-[#9B4D96]'
      )
    : clsx(
        'border-[#FFE8F2]',
        'shadow-[0_2px_12px_rgba(47,58,86,0.06)]',
        'hover:shadow-[0_8px_28px_rgba(47,58,86,0.1)]',
        'focus-visible:ring-[#FF1475]'
      )

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
      <div role="article" className={clsx(baseCardClasses, specialCardClasses)}>
        {/* Top Row: Category Badge (Left) + Icon (Right) */}
        <div className={clsx(
          'flex items-start justify-between gap-3',
          isSpecial ? 'mb-3 md:mb-3.5' : 'mb-2.5 md:mb-3'
        )}>
          {/* Category Badge - Left, always pink */}
          {tag && (
            <div>
              <span className="inline-flex items-center rounded-full bg-[#FFE8F2] px-2.5 py-1 text-[9px] md:text-xs font-bold uppercase tracking-wider text-[#FF1475]">
                {tag}
              </span>
            </div>
          )}
          {!tag && <div />}

          {/* Icon - Top Right, reduced ~15% for special cards, plum with soft glow */}
          <div
            className={clsx(
              'flex-shrink-0 flex items-center justify-center rounded-lg transition-all',
              isSpecial
                ? 'h-8 w-8 md:h-8.5 md:w-8.5 shadow-sm'
                : 'h-8 w-8 md:h-9 md:w-9 shadow-sm'
            )}
            style={{
              backgroundColor: isSpecial
                ? 'rgba(155, 77, 150, 0.12)'
                : 'rgba(155, 77, 150, 0.06)',
            }}
          >
            <AppIcon
              name={icon}
              className={clsx(
                'flex-shrink-0',
                isSpecial
                  ? 'h-3.5 w-3.5 md:h-4 md:w-4'
                  : 'h-4 w-4 md:h-4.5 md:w-4.5'
              )}
              style={{ color: '#9B4D96' }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Accent Line - Plum, positioned close to category */}
        <div
          className={clsx(
            'h-0.5 rounded-full',
            isSpecial ? 'w-7 mb-3 md:mb-3.5' : 'w-6 mb-2.5 md:mb-3'
          )}
          style={{ backgroundColor: '#9B4D96' }}
        />

        {/* Title + Subtitle - Premium spacing, raised slightly for special cards */}
        <div
          className={clsx(
            'flex-1',
            isSpecial
              ? 'space-y-1.5 md:space-y-2 mb-4 md:mb-5'
              : 'space-y-1 md:space-y-1.5 mb-3.5 md:mb-4'
          )}
        >
          <h3 className="text-sm md:text-base font-semibold text-[#3A3A3A] leading-tight">
            {title}
          </h3>
          <p className="text-xs md:text-[13px] text-[#6A6A6A] leading-snug line-clamp-2 md:line-clamp-3">
            {subtitle}
          </p>
        </div>

        {/* Premium CTA - Pink text/arrow, plum hover animation */}
        <div className="mt-auto pt-0.5">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs md:text-sm font-medium transition-all duration-150 hover:translate-x-[2px] hover:text-[#9B4D96] group"
            style={{ color: '#FF1475' }}
            aria-label={`${ctaText} ${title}`}
          >
            <span>{ctaText}</span>
            <AppIcon
              name="chevron"
              className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 transition-all group-hover:text-[#9B4D96]"
              style={{ color: '#FF1475' }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </Link>
  )
}
