'use client'

import Link from 'next/link'
import { SoftCard } from '@/components/ui/card'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

type CuidarFeatureCardProps = {
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
  cardId: string
  ctaText?: string
}

export function CuidarFeatureCard({
  icon,
  title,
  subtitle,
  href,
  cardId,
  ctaText = 'Acessar',
}: CuidarFeatureCardProps) {
  const handleClick = () => {
    track('nav.click', {
      tab: 'cuidar',
      section: 'meu-bem-estar',
      card: cardId,
      dest: href,
    })
  }

  const content = (
    <div className="flex h-full flex-col rounded-3xl bg-white px-4 sm:px-5 py-5 sm:py-6">
      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
        <AppIcon
          name={icon}
          size={24}
          variant="brand"
          decorative
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-base sm:text-lg font-semibold text-support-1 mb-1">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-support-2 mb-4">
          {subtitle}
        </p>
      </div>

      {/* CTA */}
      <span className="text-xs sm:text-sm font-medium text-primary inline-flex items-center gap-1 mt-auto">
        {ctaText} <span>→</span>
      </span>
    </div>
  )

  return (
    <Link href={href} onClick={handleClick} className="block h-full">
      <SoftCard className="h-full rounded-3xl p-0 overflow-hidden hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] transition-shadow">
        {content}
      </SoftCard>
    </Link>
  )
}

export default CuidarFeatureCard
