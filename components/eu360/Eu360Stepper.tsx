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
    <div className="mx-auto w-full max-w-xl px-4 -mt-1 md:-mt-3 mb-4">
      {/* Linha principal do stepper */}
      <div className="flex items-center justify-between gap-1.5 rounded-full bg-white/14 px-2.5 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl border border-white/35">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={[
                  'group flex items-center gap-1.5 rounded-full px-2.5 md:px-3 py-1.5 transition-all',
                  isActive
                    ? 'bg-white text-[var(--color-text-main)] shadow-[0_4px_14px_rgba(0,0,0,0.16)]'
                    : 'bg-white/80 text-[var(--color-text-main)] hover:bg-white',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-[#FFE8F2] text-[var(--color-brand)]',
                  ].join(' ')}
                >
                  {step.index}
                </span>

                <span className="text-[11px] md:text-xs font-semibold tracking-wide truncate">
                  {step.label}
                </span>
              </button>

              {/* conector só no desktop */}
              {idx < STEPS.length - 1 && (
                <div className="hidden md:flex flex-1 justify-center">
                  <div className="h-[1px] w-full bg-white/50" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Texto de apoio bem colado no stepper */}
      <p className="mt-2 text-center text-[10px] md:text-xs text-white/90 leading-relaxed">
        Comece por você e avance pelas etapas no seu tempo. Suas respostas deixam
        todas as sugestões do Materna360 mais próximas da sua rotina real.
      </p>
    </div>
  )
}

export default Eu360Stepper
