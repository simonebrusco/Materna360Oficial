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
  const isPremium = cardId === 'planos-premium' || cardId === 'planner-do-dia'

  const baseCardClasses =
    'flex flex-col justify-between rounded-[26px] md:rounded-[20px] border border-black/5 bg-white/90 ' +
    'shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08),0_12px_36px_rgba(0,0,0,0.08)] backdrop-blur-sm ' +
    'min-h-[220px] md:min-h-[260px] ' +
    'mb-3 md:mb-0 px-4 md:px-6 py-3 md:py-8 ' +
    'transition-transform transition-shadow duration-200 ease-out ' +
    'group-hover:-translate-y-1 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.07),0_10px_28px_rgba(0,0,0,0.1),0_14px_40px_rgba(0,0,0,0.1)] ' +
    'group-active:translate-y-0 group-active:shadow-[0_4px_14px_rgba(0,0,0,0.06)]'

  const premiumCardClasses =
    'border-transparent bg-gradient-to-br from-[#ffe3f0] via-white to-[#ffe9f5] ' +
    'shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08),0_12px_36px_rgba(0,0,0,0.08)]'

  return (
    <Link
      href={href}
      aria-label={title}
      data-card-id={cardId}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-3xl"
    >
      <div
        role="article"
        className={clsx(baseCardClasses, isPremium && premiumCardClasses)}
      >
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#ffd8e6]/70">
            <AppIcon
              name={icon}
              className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#ff005e]"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-1">
            {tag && (
              <span className="inline-flex items-center rounded-full bg-[#ffe3f0] px-2 py-0.5 text-[11px] md:text-xs font-medium uppercase tracking-wide text-[#ff005e]/90">
                {tag}
              </span>
            )}
            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] tracking-tight leading-tight">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-[#545454]/85 leading-snug md:leading-relaxed line-clamp-2 md:line-clamp-none">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="mt-3 md:mt-5 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 md:gap-1 text-xs md:text-sm font-medium text-[#ff005e] transition-transform duration-150 group-hover:translate-x-0.5"
          >
            <span>{ctaText}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </Link>
  )
}

export default MaternarFeatureCard
