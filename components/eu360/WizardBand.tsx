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
      {/* Band container alinhado com os demais cards */}
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-7">
        {/* Card com cabeçalho + conteúdo (condicional) */}
        <div className="rounded-3xl bg-white border border-[var(--color-pink-snow)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                {title}
              </h2>
              <p className="mt-1.5 text-xs md:text-sm text-[var(--color-text-muted)]">
                {description}
              </p>
            </div>

            {/* Status de autosave */}
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

          {/* Conteúdo: só mostra quando a banda está ativa */}
          {isActive ? (
            <div className="space-y-4">
              {children}
            </div>
          ) : (
            <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
              Use os passos acima para abrir esta etapa quando estiver pronta.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
