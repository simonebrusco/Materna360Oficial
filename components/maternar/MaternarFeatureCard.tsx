'use client'

import Link from 'next/link'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

type MaternarFeatureCardProps = {
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
  cardId: string
  ctaText: string
}

export function MaternarFeatureCard({
  icon,
  title,
  subtitle,
  href,
  cardId,
  ctaText,
}: MaternarFeatureCardProps) {
  const handleClick = () => {
    track('nav.click', {
      tab: 'maternar',
      card: cardId,
      dest: href,
    })
  }

  const content = (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-between rounded-3xl bg-white shadow-soft px-4 py-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-m360-pink-soft">
          <AppIcon
            name={icon}
            size={24}
            variant="brand"
            decorative
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-m360-text-primary leading-snug">
            {title}
          </p>
          <p className="text-xs text-m360-text-muted leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      <span className="mt-2 text-[11px] font-medium text-m360-pink inline-flex items-center gap-1">
        {ctaText} <span>→</span>
      </span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className="block h-full">
        {content}
      </Link>
    )
  }

  return <div className="h-full">{content}</div>
}

export default MaternarFeatureCard
