'use client'

import type { FC } from 'react'

export type Eu360Step = 'about-you' | 'children' | 'routine' | 'support'

type Eu360StepperProps = {
  currentStep: Eu360Step
  onStepClick?: (step: Eu360Step) => void
}

const STEPS: { id: Eu360Step; label: string; number: number }[] = [
  { id: 'about-you', label: 'Você', number: 1 },
  { id: 'children', label: 'Seu(s) filho(s)', number: 2 },
  { id: 'routine', label: 'Rotina', number: 3 },
  { id: 'support', label: 'Rede & preferências', number: 4 },
]

export const Eu360Stepper: FC<Eu360StepperProps> = ({
  currentStep,
  onStepClick,
}) => {
  return (
    <nav className="mb-6 md:mb-8">
      {/* largura alinhada com os cards do formulário */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-3xl bg-white/96 border border-[var(--color-soft-strong)] shadow-[0_12px_32px_rgba(0,0,0,0.06)] px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep
              const isLast = index === STEPS.length - 1

              return (
                <div
                  key={step.id}
                  className="flex items-center flex-1 min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => onStepClick?.(step.id)}
                    className={`flex items-center gap-2 rounded-full px-2 md:px-3 py-1.5 md:py-2 transition-all flex-1 min-w-0 ${
                      isActive
                        ? 'bg-[var(--color-brand)] text-white shadow-[0_6px_18px_rgba(255,20,117,0.35)]'
                        : 'bg-white text-[var(--color-text-main)] hover:bg-[var(--color-soft-strong)]/70'
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-white text-[var(--color-brand)]'
                          : 'bg-[var(--color-soft-strong)] text-[var(--color-text-main)]'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span className="truncate text-xs md:text-sm font-semibold text-left">
                      {step.label}
                    </span>
                  </button>

                  {/* linha conectora entre as etapas */}
                  {!isLast && (
                    <div className="mx-1 md:mx-2 h-px flex-1 bg-[var(--color-soft-strong)]" />
                  )}
                </div>
              )
            })}
          </div>

          {/* texto de apoio para deixar clara a experiência */}
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)] text-center">
            Comece por você e avance pelas etapas no seu tempo. Suas respostas
            deixam todas as sugestões do Materna360 mais próximas da sua rotina real.
          </p>
        </div>
      </div>
    </nav>
  )
}
