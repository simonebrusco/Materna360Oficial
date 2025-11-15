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
}

export function MaternarFeatureCard({
  icon,
  title,
  subtitle,
  href,
  cardId,
}: MaternarFeatureCardProps) {
  const handleClick = () => {
    track('nav.click', {
      tab: 'maternar',
      card: cardId,
      dest: href,
    })
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="flex h-full min-h-[150px] flex-col justify-between rounded-3xl bg-white shadow-soft p-3 text-left"
    >
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center justify-center rounded-2xl bg-m360-pink-soft p-2.5 w-fit">
          <AppIcon
            name={icon}
            size={20}
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

      <span className="mt-2 text-xs font-medium text-m360-pink inline-flex items-center gap-1">
        Acessar <span>→</span>
      </span>
    </Link>
  )
}

export default MaternarFeatureCard
