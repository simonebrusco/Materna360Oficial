'use client'

import React from 'react'

type PageTemplateProps = {
  label?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Caso alguma página use algo à direita do título (botão, link, etc.) */
  rightElement?: React.ReactNode
}

export function PageTemplate({
  label,
  title,
  subtitle,
  children,
  rightElement,
}: PageTemplateProps) {
  return (
    <main
      data-layout="page-template-v1"
      className="
        min-h-[100dvh]
        pb-28
        bg-[#FFE4F2]
        bg-[radial-gradient(circle_at_top,#FF7BB1_0,#FFB3D3_35%,#FFE4F2_70%,#FFF5FA_100%)]
      "
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6 pt-8 md:pt-10">
        {/* HEADER PADRÃO */}
        <header className="mb-6 md:mb-7 text-left">
          {label && (
            <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
              {label}
            </span>
          )}

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm md:text-base text-white/85 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                  {subtitle}
                </p>
              )}
            </div>

            {rightElement && (
              <div className="hidden md:block">{rightElement}</div>
            )}
          </div>
        </header>

        {/* CONTEÚDO – sem fundo extra, só os próprios cards */}
        <div className="pb-4 md:pb-6">{children}</div>
      </div>
    </main>
  )
}

export default PageTemplate
