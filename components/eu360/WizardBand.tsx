'use client'

import React, { ReactNode } from 'react'

interface WizardBandProps {
  id: string
  title: string
  description: string
  children: ReactNode
  autoSaveStatus?: 'idle' | 'saving' | 'saved'
}

export function WizardBand({
  id,
  title,
  description,
  children,
  autoSaveStatus = 'idle',
}: WizardBandProps) {
  return (
    <section
      id={id}
      className="scroll-mt-[120px] md:scroll-mt-[140px]"
      data-wizard-band={id}
    >
      {/* Band container */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Card with consistent styling */}
        <div className="rounded-3xl bg-white border border-[var(--color-pink-snow)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-6">
          {/* Header with title and autosave status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                {title}
              </h2>
              <p className="mt-1.5 text-xs md:text-sm text-[var(--color-text-muted)]">
                {description}
              </p>
            </div>

            {/* Autosave status indicator (discreet, top-right) */}
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

          {/* Content */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
