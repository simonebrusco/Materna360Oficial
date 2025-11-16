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
    <div className="flex h-full min-h-[200px] flex-col items-center justify-between rounded-[24px] bg-white border border-black/4 shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] px-4 py-8 text-center transition-all duration-200">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-m360-pink-soft">
          <AppIcon
            name={icon}
            size={18}
            variant="brand"
            decorative
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-tighter text-m360-text-primary leading-tight">
            {title}
          </p>
          <p className="text-xs text-gray-700/85 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <span className="mt-3 text-[12px] font-medium text-m360-pink inline-flex items-center gap-0.5 hover:scale-[1.02] transition-transform">
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
