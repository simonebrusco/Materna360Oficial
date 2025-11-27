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
      <div className="mx-auto max-w-4xl px-4 md:px-6 relative z-10">
        <header className="pt-6 md:pt-8 mb-8 md:mb-10">
          <div className="space-y-2 md:space-y-3">
            {label && (
              <span className="inline-flex items-center rounded-full border border-white/45 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                {label}
              </span>
            )}

            {/* Título no mesmo padrão visual do Maternar */}
            <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-2 text-sm md:text-base text-white/88 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                {subtitle}
              </p>
            )}
          </div>
        </header>

        {/* Conteúdo da página (planner, etc.) sempre alinhado ao título */}
        <div className="space-y-6 md:space-y-8">{children}</div>
      </div>
    </main>
  )
}

export default PageTemplate
