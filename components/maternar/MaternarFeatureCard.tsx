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
      className="relative flex h-full min-h-[120px] flex-col items-center gap-1.5 rounded-3xl border border-white/60 bg-white/80 px-4 py-3 text-center shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-all duration-300 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 hover:-translate-y-1"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white/90 shadow-[0_4px_24px_rgba(47,58,86,0.08)]">
        <AppIcon
          name={icon}
          size={24}
          variant="brand"
          decorative
        />
      </div>

      <p className="text-sm font-semibold text-support-1 text-center leading-snug">
        {title}
      </p>

      <p className="text-[11px] text-support-2 text-center leading-snug">
        {subtitle}
      </p>

      <span className="mt-1.5 text-[11px] font-medium text-m360-pink inline-flex items-center gap-1">
        Acessar <span>→</span>
      </span>
    </Link>
  )
}

export default MaternarFeatureCard
