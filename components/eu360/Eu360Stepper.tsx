'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'

export type Eu360Step = 'about-you' | 'children' | 'routine' | 'support'

interface Eu360StepperProps {
  currentStep: Eu360Step
  onStepClick?: (step: Eu360Step) => void
}

const STEPS: { id: Eu360Step; label: string; shortLabel: string }[] = [
  { id: 'about-you', label: 'Você', shortLabel: 'Você' },
  { id: 'children', label: 'Seu(s) filho(s)', shortLabel: 'Filho(s)' },
  { id: 'routine', label: 'Rotina', shortLabel: 'Rotina' },
  {
    id: 'support',
    label: 'Rede & preferências',
    shortLabel: 'Rede & pref.',
  },
]

export function Eu360Stepper({ currentStep, onStepClick }: Eu360StepperProps) {
  return (
    <div className="mb-6 md:mb-8">
      {/* Barra principal de etapas */}
      <div className="mx-auto max-w-3xl rounded-full border border-white/80 bg-white/10 px-3 py-2.5 md:px-5 md:py-3 shadow-[0_16px_38px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        <div className="relative flex items-center justify-between gap-2 md:gap-3">
          {/* Linha sutil atrás dos steps */}
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 h-[2px] -translate-y-1/2 bg-white/18" />

          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={`relative z-10 flex flex-1 items-center justify-center rounded-full px-2 py-1.5 md:px-3 md:py-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[var(--color-text-main)] shadow-[0_6px_18px_rgba(0,0,0,0.22)]'
                    : 'bg-transparent text-white/90 hover:bg-white/10'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* número */}
                <span
                  className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.25)] ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-white text-[var(--color-brand)]'
                  }`}
                >
                  {index + 1}
                </span>

                {/* label */}
                <span
                  className={`text-[11px] md:text-xs font-semibold tracking-wide ${
                    isActive ? 'text-[var(--color-text-main)]' : 'text-white'
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Frase de apoio fora da cápsula */}
      <div className="mt-3 flex items-center justify-center gap-2 px-4">
        <AppIcon
          name="sparkles"
          className="hidden h-4 w-4 text-[#FFD3E6] sm:inline-block"
          decorative
        />
        <p className="text-center text-[10px] md:text-[11px] text-white/90 leading-relaxed">
          Comece por você e avance pelas etapas no seu tempo. Suas respostas
          deixam todas as sugestões do Materna360 mais próximas da sua rotina
          real.
        </p>
      </div>
    </div>
  )
}
