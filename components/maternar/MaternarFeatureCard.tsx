'use client'

import Link from 'next/link'
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

type MaternarFeatureCardProps = {
  icon: AppIconName
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
      className="flex h-full flex-col justify-between rounded-3xl bg-white shadow-soft p-3 md:p-4 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-2.5 md:p-3 w-fit">
          <AppIcon
            name={icon}
            size={24}
            variant="brand"
            decorative
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm md:text-base font-semibold text-support-1 leading-snug">
            {title}
          </p>
          <p className="text-xs md:text-sm text-support-2 leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      <span className="mt-3 text-xs md:text-sm font-medium text-primary inline-flex items-center gap-1">
        Acessar <span>→</span>
      </span>
    </Link>
  )
}

export default MaternarFeatureCard
