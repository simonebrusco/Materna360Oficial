'use client'

import type { ReactNode } from 'react'
import LegalFooter from '@/components/common/LegalFooter'

export type PageTemplateProps = {
  label: string
  title: string
  subtitle?: string
  children: ReactNode
  headerVariant?: 'dark' | 'light'
  /**
   * Define a cor do header (label/título/subtítulo).
   * - "dark": padrão atual (cinza)
   * - "light": branco (para fundos mais fortes)
   */
  headerTone?: 'dark' | 'light'
}

export function PageTemplate({
  label,
  title,
  subtitle,
  children,
  headerTone = 'dark',
}: PageTemplateProps) {
  const isLight = headerTone === 'light'

  const labelClasses = isLight
    ? 'border-white/25 bg-white/10 text-white backdrop-blur-md'
    : 'border-[#F5D7E5] bg-white/85 text-[#b8236b] backdrop-blur-md'

  const titleClasses = isLight ? 'text-white' : 'text-[#545454]'

  const subtitleClasses = isLight ? 'text-white/85' : 'text-[#545454]'

  return (
    <main data-layout="page-template-v1" className="min-h-[100dvh] bg-transparent">
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20">
        {/* HERO padrão das páginas internas */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-7 text-left">
          <span
            className={[
              'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.24em] uppercase',
              labelClasses,
            ].join(' ')}
          >
            {label}
          </span>

          <h1
            className={[
              'mt-3 text-[28px] md:text-[32px] font-semibold leading-tight',
              titleClasses,
            ].join(' ')}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={[
                'mt-2 text-sm md:text-base leading-relaxed max-w-2xl',
                subtitleClasses,
              ].join(' ')}
            >
              {subtitle}
            </p>
          )}
        </header>

        {/* Conteúdo específico da página */}
        <div className="space-y-6 md:space-y-7 pb-6">{children}</div>

        {/* Rodapé legal global – fica acima da bottom nav */}
        <div className="mt-4 md:mt-6">
          <LegalFooter />
        </div>
      </div>
    </main>
  )
}

export default PageTemplate
