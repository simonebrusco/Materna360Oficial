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
  ctaText?: string
}

export function MaternarFeatureCard({
  icon,
  title,
  subtitle,
  href,
  cardId,
  ctaText = 'Acessar',
}: MaternarFeatureCardProps) {
  const handleClick = () => {
    track('nav.click', {
      tab: 'maternar',
      card: cardId,
      dest: href,
    })
  }

  const content = (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-between rounded-3xl bg-white shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] px-4 py-6 text-center transition-shadow duration-200">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-m360-pink-soft">
          <AppIcon
            name={icon}
            size={20}
            variant="brand"
            decorative
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-m360-text-primary leading-tight">
            {title}
          </p>
          <p className="text-xs text-m360-text-muted leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <span className="mt-3 text-xs font-medium text-m360-pink inline-flex items-center gap-0.5">
        {ctaText}
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
