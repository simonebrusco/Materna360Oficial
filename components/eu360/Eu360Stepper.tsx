'use client'

import React from 'react'

export type Eu360Step = 'about-you' | 'children' | 'routine' | 'support'

type StepDef = {
  id: Eu360Step
  index: number
  label: string
}

const STEPS: StepDef[] = [
  { id: 'about-you', index: 1, label: 'Você' },
  { id: 'children', index: 2, label: 'Seu(s) filho(s)' },
  { id: 'routine', index: 3, label: 'Rotina' },
  { id: 'support', index: 4, label: 'Rede & preferências' },
]

interface Eu360StepperProps {
  currentStep: Eu360Step
  onStepClick?: (step: Eu360Step) => void
}

export function Eu360Stepper({ currentStep, onStepClick }: Eu360StepperProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 mb-6 md:mb-8">
      {/* cápsula do stepper */}
      <div className="rounded-full border border-white/65 bg-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {STEPS.map((step, idx) => {
            const isActive = step.id === currentStep

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 md:px-5 md:py-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(255,20,117,0.45)] focus-visible:ring-white/90 ${
                    isActive
                      ? 'bg-white text-[var(--color-text-main)] shadow-[0_10px_26px_rgba(0,0,0,0.22)]'
                      : 'bg-white/12 text-white/90 border border-white/35 hover:bg-white/18'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isActive ? 'bg-[var(--color-brand)] text-white' : 'bg-white/85 text-[var(--color-brand)]'
                    }`}
                  >
                    {step.index}
                  </span>
                  <span
                    className={`text-xs md:text-sm font-semibold whitespace-nowrap ${
                      isActive ? 'text-[var(--color-text-main)]' : 'text-white'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* linha entre os steps (desktop) */}
                {idx < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden md:inline-block h-px flex-1 bg-white/55"
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* texto de apoio logo abaixo, alinhado com os cards */}
      <p className="mt-3 text-center text-[11px] md:text-xs text-white/90 max-w-2xl mx-auto leading-relaxed">
        Comece por você e avance pelas etapas no seu tempo. Suas respostas deixam
        todas as sugestões do Materna360 mais próximas da sua rotina real.
      </p>
    </div>
  )
}
