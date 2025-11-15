'use client'

import Link from 'next/link'
import type React from 'react'

type MaternarFeatureCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  subtitle: string
  href?: string
}

export function MaternarFeatureCard({
  icon: Icon,
  title,
  subtitle,
  href,
}: MaternarFeatureCardProps) {
  const content = (
    <div className="flex h-full flex-col justify-between rounded-3xl bg-white shadow-soft p-3 md:p-4 text-left">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center justify-center rounded-2xl bg-m360-pink-soft p-2.5 md:p-3">
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-m360-pink" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm md:text-base font-semibold text-m360-text-primary leading-snug">
            {title}
          </p>
          <p className="text-xs md:text-sm text-m360-text-muted leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      <span className="mt-3 text-xs md:text-sm font-medium text-m360-pink inline-flex items-center gap-1">
        Acessar <span>→</span>
      </span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return <div className="h-full">{content}</div>
}

export default MaternarFeatureCard
