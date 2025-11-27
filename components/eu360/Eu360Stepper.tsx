'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import clsx from 'clsx'
import { type Eu360Step } from './types'

const steps: Eu360Step[] = ['about-you', 'children', 'routine', 'support']

const labels: Record<Eu360Step, string> = {
  'about-you': 'Você',
  children: 'Seu(s) filho(s)',
  routine: 'Rotina',
  support: 'Rede & prefs'
}

export function Eu360Stepper({
  currentStep,
  onStepClick
}: {
  currentStep: Eu360Step
  onStepClick: (s: Eu360Step) => void
}) {
  return (
    <div className="mx-auto max-w-xl px-4">
      <div className="
        rounded-3xl border border-white/20 bg-white/10 
        backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.18)]
        px-4 py-5 flex flex-col items-center gap-4
      ">
        {/* steps */}
        <div className="flex items-center gap-3">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <button
                type="button"
                onClick={() => onStepClick(step)}
                className={clsx(
                  'px-4 py-1.5 rounded-full flex items-center gap-2 transition-all',
                  'text-sm font-semibold shadow-sm',
                  step === currentStep
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_4px_14px_rgba(255,20,117,0.35)]'
                    : 'bg-white/50 text-white/80 hover:bg-white/70'
                )}
              >
                <span
                  className={clsx(
                    'h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold',
                    step === currentStep
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-white/40 text-white/80'
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate max-w-[85px]">{labels[step]}</span>
              </button>

              {/* divider */}
              {index < steps.length - 1 && (
                <div className="h-[1.5px] w-8 bg-white/25 rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* subtitle */}
        <p className="text-xs text-white/70 text-center leading-relaxed max-w-sm">
          Comece por você e avance pelas etapas no seu tempo. Suas respostas deixam todas as sugestões do Materna360 mais próximas da sua rotina real.
        </p>
      </div>
    </div>
  )
}
