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
  { id: 'support', label: 'Rede & preferências', shortLabel: 'Rede & pref.' },
]

export function Eu360Stepper({ currentStep, onStepClick }: Eu360StepperProps) {
  return (
    <div className="mb-6">
      <div className="mx-auto max-w-3xl rounded-full border border-white/70 bg-white/14 px-3 py-3 md:px-5 md:py-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        {/* Linha de etapas */}
        <div className="flex items-center justify-between gap-2 md:gap-3">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={`group relative flex flex-1 items-center justify-center rounded-full px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-[var(--color-text-main)] shadow-[0_6px_18px_rgba(0,0,0,0.22)]'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isActive ? 'bg-[var(--color-brand)] text-white' : 'bg-white/90 text-[var(--color-brand)]'
                  }`}
                >
                  {index + 1}
                </span>
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

        {/* Texto de apoio – dentro da mesma barra */}
        <div className="mt-2.5 flex items-center justify-center gap-2 px-2">
          <AppIcon
            name="sparkles"
            className="hidden h-4 w-4 text-[#FFD3E6] sm:inline-block"
          />
          <p className="text-center text-[10px] md:text-[11px] text-white/90 leading-relaxed">
            Comece por você e avance pelas etapas no seu tempo. Suas respostas deixam todas as
            sugestões do Materna360 mais próximas da sua rotina real.
          </p>
        </div>
      </div>
    </div>
  )
}
