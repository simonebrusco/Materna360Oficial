'use client'

import type { ReactNode } from 'react'
import LegalFooter from '@/components/common/LegalFooter'

export type PageTemplateProps = {
  label: string
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
      className="min-h-[100dvh] pb-12 bg-[#FFE4F0] bg-[radial-gradient(circle_at_top_left,#F2C3EA_0,#FF78B3_30%,#FF9BC8_60%,#FFB3D8_82%,#FFE4F0_100%)]"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        {/* HERO padrão das páginas internas */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-7 text-left">
          <span className="inline-flex items-center rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            {label}
          </span>

          <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              {subtitle}
            </p>
          )}
        </header>

        {/* Conteúdo específico da página */}
        <div className="space-y-6 md:space-y-7 pb-6">
          {children}
        </div>
      </div>

      {/* Rodapé legal global */}
      <LegalFooter />
    </main>
  )
}

// 👇 Mantém compatível com import default e import nomeado
export default PageTemplate
