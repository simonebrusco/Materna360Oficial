'use client'

import React, { ReactNode } from 'react'

interface WizardBandProps {
  id: string
  title: string
  description: string
  children: ReactNode
  autoSaveStatus?: 'idle' | 'saving' | 'saved'
  isActive?: boolean
}

export function WizardBand({
  id,
  title,
  description,
  children,
  autoSaveStatus = 'idle',
  isActive = true,
}: WizardBandProps) {
  return (
    <section
      id={id}
      className="scroll-mt-[120px] md:scroll-mt-[140px]"
      data-wizard-band={id}
    >
      {/* Container alinhado com o restante da página */}
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-5 md:py-6">
        {/* Card principal */}
        <div
          className={`rounded-3xl border shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white border-[var(--color-pink-snow)] ${
            isActive ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-[1px]'
          }`}
        >
          <div className="p-5 md:p-7 space-y-5">
            {/* Cabeçalho com título e status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                  {title}
                </h2>
                <p className="mt-1.5 text-xs md:text-sm text-[var(--color-text-muted)]">
                  {description}
                </p>
              </div>

              {autoSaveStatus !== 'idle' && (
                <div
                  className={`flex-shrink-0 text-[11px] md:text-xs font-medium whitespace-nowrap transition-opacity duration-500 ${
                    autoSaveStatus === 'saving'
                      ? 'text-[var(--color-text-muted)] opacity-100'
                      : 'text-[var(--color-brand-plum)] opacity-100'
                  }`}
                >
                  {autoSaveStatus === 'saving' ? 'Salvando…' : 'Tudo salvo'}
                </div>
              )}
            </div>

            {/* Conteúdo do bloco */}
            <div className="space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
