// components/common/PageTemplate.tsx
'use client'

import * as React from 'react'

export type PageTemplateTone = 'light' | 'dark'

export type PageTemplateProps = {
  headerTone?: PageTemplateTone
  label: string
  title: string
  subtitle?: string

  /**
   * Quando false, esconde o "pill" do label (ex.: MATERNAR).
   * Útil quando você quer controlar manualmente o topo (ex.: BackToMaternar).
   */
  showLabel?: boolean

  /**
   * Slot renderizado NO TOPO do header, antes do label/title/subtitle.
   * É aqui que deve entrar o "← Voltar para o Maternar" (BackToMaternar),
   * para não ficar atrás do subtítulo nem dentro do body.
   */
  headerTop?: React.ReactNode

  /**
   * Conteúdo da página
   */
  children: React.ReactNode

  /**
   * Ajustes opcionais
   */
  className?: string
  contentClassName?: string
}

export function PageTemplate({
  headerTone = 'light',
  label,
  title,
  subtitle,
  showLabel = true,
  headerTop,
  children,
  className,
  contentClassName,
}: PageTemplateProps) {
  const isLight = headerTone === 'light'

  // Mantém o padrão visual do app (gradiente Materna) e garante
  // que o header seja "área própria" com espaçamento previsível.
  const rootBg = isLight
    ? 'bg-[#ffe1f1] bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]'
    : 'bg-[#0b1220] bg-[linear-gradient(to_bottom,#121a2e_0%,#0b1220_70%,#0b1220_100%)]'

  const titleColor = isLight ? 'text-white' : 'text-white'
  const subtitleColor = isLight ? 'text-white/90' : 'text-white/85'
  const labelPill = isLight
    ? 'bg-white/15 border border-white/35 text-white/90'
    : 'bg-white/10 border border-white/20 text-white/85'

  return (
    <main
      data-layout="page-template-v1"
      className={[
        'min-h-[100dvh] pb-32',
        rootBg,
        className ?? '',
      ].join(' ')}
    >
      <div className={['mx-auto max-w-5xl px-4 md:px-6', contentClassName ?? ''].join(' ')}>
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="space-y-3">
            {headerTop ? <div className="mb-1">{headerTop}</div> : null}

            {showLabel ? (
              <span
                className={[
                  'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
                  labelPill,
                ].join(' ')}
              >
                {label}
              </span>
            ) : null}

            <h1
              className={[
                'text-2xl md:text-3xl font-semibold leading-tight',
                titleColor,
                'drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]',
              ].join(' ')}
            >
              {title}
            </h1>

            {subtitle ? (
              <p
                className={[
                  'text-sm md:text-base leading-relaxed max-w-2xl',
                  subtitleColor,
                  'drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]',
                ].join(' ')}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </header>

        {children}
      </div>
    </main>
  )
}

// Mantém compatibilidade com imports antigos: `import PageTemplate from ...`
export default PageTemplate
