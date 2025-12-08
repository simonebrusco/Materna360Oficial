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
  const currentIndex =
    STEPS.findIndex(step => step.id === currentStep) + 1 || 1
  const totalSteps = STEPS.length

  // porcentagem da linha de progresso (entre o 1º e o último step)
  const progressPercent =
    totalSteps > 1 ? ((currentIndex - 1) / (totalSteps - 1)) * 100 : 0

  return (
    <div className="mb-6 md:mb-8">
      <div className="relative mx-auto max-w-3xl rounded-[999px] border border-white/70 bg-white/14 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        {/* Glows de fundo */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-8 h-16 w-16 rounded-full bg-white/18 blur-2xl" />
          <div className="absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-[#fd2597]/22 blur-3xl" />
        </div>

        <div className="relative z-10 px-3 py-3 md:px-5 md:py-3.5">
          {/* Linha + etapas */}
          <div className="relative mb-2.5 md:mb-3">
            {/* Linha base */}
            <div className="pointer-events-none absolute left-[10%] right-[10%] top-1/2 h-[2px] -translate-y-1/2 bg-white/22" />

            {/* Linha de progresso */}
            <div
              className="pointer-events-none absolute left-[10%] top-1/2 h-[2px] -translate-y-1/2 bg-white"
              style={{ width: `${progressPercent * 0.8}%` }}
            />

            <div className="relative flex items-center justify-between gap-2 md:gap-3">
              {STEPS.map((step, index) => {
                const isActive = step.id === currentStep
                const isDone = index + 1 < currentIndex

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => onStepClick?.(step.id)}
                    className={`group relative flex flex-1 items-center justify-center rounded-full px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-[var(--color-text-main)] shadow-[0_6px_18px_rgba(0,0,0,0.22)]'
                        : 'bg-white/8 text-white/90 hover:bg-white/16'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {/* bolinha com número */}
                    <span
                      className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.25)] ${
                        isActive
                          ? 'bg-[var(--color-brand)] text-white scale-110'
                          : isDone
                            ? 'bg-white text-[var(--color-brand)]'
                            : 'bg-white/90 text-[var(--color-brand)]'
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

          {/* Texto de apoio – dentro da mesma barra */}
          <div className="mt-1.5 flex items-center justify-center gap-2 px-2">
            <AppIcon
              name="sparkles"
              className="hidden h-4 w-4 text-[#FFD3E6] sm:inline-block"
              decorative
            />
            <p className="text-center text-[10px] md:text-[11px] text-white/90 leading-relaxed">
              Comece por você e avance pelas etapas no seu tempo. Suas respostas
              deixam todas as sugestões do Materna360 mais próximas da sua
              rotina real.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
