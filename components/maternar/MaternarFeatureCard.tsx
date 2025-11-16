'use client'

import Link from 'next/link'
import type React from 'react'

type MaternarFeatureCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ComponentType<any>
  title: string
  subtitle: string
  href: string
}

export function MaternarFeatureCard({
  icon: Icon,
  title,
  subtitle,
  href,
}: MaternarFeatureCardProps) {
  const content = (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-between rounded-3xl bg-white shadow-soft px-4 py-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-m360-pink-soft">
          <Icon className="h-6 w-6 text-m360-pink" />
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
        Acessar <span>→</span>
      </span>
    </div>
  )

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  )
}

export default MaternarFeatureCard
