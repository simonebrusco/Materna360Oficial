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
      className="
        min-h-[100dvh]
        bg-[radial-gradient(circle_at_top,_#fdbed7_0%,_#ffe1f1_60%,_#ffffff_100%)]
      "
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        {/* HERO padrão das páginas internas */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-7 text-left">
          <span
            className="
              inline-flex items-center rounded-full
              border border-[#fdbed7]
              bg-white/80
              px-3 py-1
              text-[10px] font-semibold tracking-[0.24em] uppercase
              text-[#b8236b]
              backdrop-blur-md
            "
          >
            {label}
          </span>

          <h1
            className="
              mt-3
              text-3xl md:text-4xl
              font-semibold leading-tight
              text-[#545454]
            "
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="
                mt-2
                text-sm md:text-base
                leading-relaxed
                max-w-2xl
                text-[#545454]
              "
            >
              {subtitle}
            </p>
          )}
        </header>

        {/* Conteúdo específico da página */}
        <div className="space-y-6 md:space-y-7 pb-6">
          {children}
        </div>

        {/* Rodapé legal global – fica acima da bottom nav */}
        <div className="mt-4 md:mt-6">
          <LegalFooter />
        </div>
      </div>
    </main>
  )
}

// 👇 Mantém compatível com import default e import nomeado
export default PageTemplate
