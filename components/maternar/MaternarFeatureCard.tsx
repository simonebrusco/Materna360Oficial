'use client'

import Link from 'next/link'
import clsx from 'clsx'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

type MaternarFeatureCardProps = {
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
  cardId: string
  ctaText?: string
}

export function MaternarFeatureCard({
  icon,
  title,
  subtitle,
  href,
  cardId,
  ctaText = 'Explorar',
}: MaternarFeatureCardProps) {
  const handleClick = () => {
    track('nav.click', {
      tab: 'maternar',
      card: cardId,
      dest: href,
    })
  }

  const isPremium = cardId === 'planos-premium';

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-label={title}
      data-card-id={cardId}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e] focus-visible:ring-offset-2 rounded-3xl"
    >
      <article
        className={clsx(
          'flex h-full flex-col justify-between',
          'rounded-3xl border bg-white/90 backdrop-blur-sm',
          'px-4 py-4 md:px-5 md:py-5',
          'transition-transform transition-shadow duration-200 ease-out',
          'group-hover:-translate-y-0.5',
          'group-active:translate-y-0',
          isPremium
            ? 'border-transparent bg-gradient-to-br from-[#ffe3f0] via-white to-[#ffe9f5] shadow-[0_10px_32px_rgba(255,0,94,0.16)] group-hover:shadow-[0_14px_40px_rgba(255,0,94,0.20)]'
            : 'border-black/5 shadow-[0_6px_22px_rgba(0,0,0,0.06)] group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]'
        )}
      >
        {/* Icon */}
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/70">
          <AppIcon
            name={icon}
            className="h-4 w-4 text-[#ff005e]"
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="mt-3 flex-1">
          <h3 className="text-sm md:text-base font-semibold text-[#2f3a56] tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-xs md:text-sm text-[#545454]/85 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-[#ff005e] transition-transform duration-150 group-hover:translate-x-0.5"
          >
            <span>{ctaText}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    </Link>
  )
}

export default MaternarFeatureCard
