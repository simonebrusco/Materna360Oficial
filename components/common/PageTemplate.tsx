'use client'

import { ReactNode } from 'react'

type PageTemplateProps = {
  label?: string
  title: string
  subtitle?: string
  children: ReactNode
}

export function PageTemplate({
  label,
  title,
  subtitle,
  children,
}: PageTemplateProps) {
  return (
    <main
      data-layout="page-template-v1"
      className="relative min-h-[100dvh] pb-24 materna360-premium-bg"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6 relative z-10">
        {/* HERO PADRONIZADO COM MATERNAR */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="space-y-2 md:space-y-3">
            {label && (
              <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                {label}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              {title}
            </h1>

            {subtitle && (
              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                {subtitle}
              </p>
            )}
          </div>
        </header>

        <div className="space-y-6 md:space-y-8">{children}</div>
      </div>
    </main>
  )
}

export default PageTemplate
