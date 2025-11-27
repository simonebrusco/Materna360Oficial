'use client'

import React from 'react'

export type Eu360Step = 'about-you' | 'children' | 'routine' | 'support'

type Eu360StepperProps = {
  currentStep: Eu360Step
  onStepClick?: (step: Eu360Step) => void
}

const STEPS: { id: Eu360Step; index: number; label: string }[] = [
  { id: 'about-you', index: 1, label: 'Você' },
  { id: 'children', index: 2, label: 'Seu(s) filho(s)' },
  { id: 'routine', index: 3, label: 'Rotina' },
  { id: 'support', index: 4, label: 'Rede & preferências' },
]

export function Eu360Stepper({ currentStep, onStepClick }: Eu360StepperProps) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-3xl border border-white/30 bg-white/12 px-4 py-4 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        {/* Linha de passos */}
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {STEPS.map((step, idx) => {
            const isActive = step.id === currentStep

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className={[
                    'group flex items-center gap-2 rounded-full px-3 md:px-4 py-1.5 md:py-2 transition-all',
                    'bg-white/90 text-[var(--color-text-main)] shadow-[0_6px_18px_rgba(0,0,0,0.16)]',
                    isActive
                      ? 'border border-[var(--color-brand)]'
                      : 'border border-white/60 hover:bg-white',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                      isActive
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'bg-[#FFE8F2] text-[var(--color-brand)]',
                    ].join(' ')}
                  >
                    {step.index}
                  </span>
                  <span className="text-xs md:text-sm font-semibold tracking-wide truncate">
                    {step.label}
                  </span>
                </button>

                {/* Linha conectora (entre os passos) */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden flex-1 items-center justify-center md:flex">
                    <div className="h-[1px] w-full bg-gradient-to-r from-white/40 via-white/70 to-white/40" />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Texto de apoio */}
        <p className="mt-3 text-center text-[11px] md:text-xs text-white/85 leading-relaxed px-4">
          Comece por você e avance pelas etapas no seu tempo. Suas respostas deixam todas as
          sugestões do Materna360 mais próximas da sua rotina real.
        </p>
      </div>
    </div>
  )
}

export default Eu360Stepper
