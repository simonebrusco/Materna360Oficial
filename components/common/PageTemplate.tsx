import * as React from 'react'

export type PageTemplateProps = {
  headerTone?: 'light' | 'dark'
  label?: string
  title: string
  subtitle?: string
  children: React.ReactNode

  // NOVO: controla se o "chip" aparece
  showLabel?: boolean

  // NOVO: slot para inserir "← Voltar..." no topo do header
  headerTop?: React.ReactNode
}

export function PageTemplate({
  headerTone = 'light',
  label,
  title,
  subtitle,
  children,
  showLabel = true,
  headerTop,
}: PageTemplateProps) {
  const isLight = headerTone === 'light'

  return (
    <main
      data-layout="page-template-v1"
      className={[
        'min-h-[100dvh] pb-32',
        'bg-[#ffe1f1]',
        'bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]',
      ].join(' ')}
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="space-y-3">
            {headerTop ? <div className="mb-1">{headerTop}</div> : null}

            {showLabel && label ? (
              <div className="inline-flex">
                <span
                  className={[
                    'rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase border',
                    isLight
                      ? 'bg-white/15 text-white border-white/25'
                      : 'bg-white text-[#2f3a56] border-[#f5d7e5]',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
            ) : null}

            <h1
              className={[
                'text-2xl md:text-3xl font-semibold leading-tight',
                isLight
                  ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
                  : 'text-[#2f3a56]',
              ].join(' ')}
            >
              {title}
            </h1>

            {subtitle ? (
              <p
                className={[
                  'text-sm md:text-base leading-relaxed max-w-3xl',
                  isLight
                    ? 'text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]'
                    : 'text-[#545454]',
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
