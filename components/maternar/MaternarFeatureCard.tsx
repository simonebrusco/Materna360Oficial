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
    'flex h-full flex-col justify-between rounded-3xl border border-black/5 bg-white/90 ' +
    'shadow-[0_6px_22px_rgba(0,0,0,0.06)] backdrop-blur-sm ' +
    'px-4 py-4 md:px-5 md:py-5 ' +
    'transition-transform transition-shadow duration-200 ease-out ' +
    'group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] ' +
    'group-active:translate-y-0 group-active:shadow-[0_4px_14px_rgba(0,0,0,0.05)]'

  const premiumCardClasses =
    'border-transparent bg-gradient-to-br from-[#ffe3f0] via-white to-[#ffe9f5] ' +
    'shadow-[0_10px_32px_rgba(255,0,94,0.16)]'

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
        <div className="flex flex-col gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/70">
            <AppIcon
              name={icon}
              className="h-4 w-4 text-[#ff005e]"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-1">
            {tag && (
              <span className="inline-flex items-center rounded-full bg-[#ffe3f0] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#ff005e]/90">
                {tag}
              </span>
            )}
            <h3 className="text-sm md:text-base font-semibold text-[#2f3a56] tracking-tight">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-[#545454]/85 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-[#ff005e] transition-transform duration-150 group-hover:translate-x-0.5"
          >
            <span>{ctaText}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
