'use client'

import clsx from 'clsx'

export type Eu360Step = 'about-you' | 'children' | 'routine' | 'support'

const STEPS: Eu360Step[] = ['about-you', 'children', 'routine', 'support']

const LABELS: Record<Eu360Step, string> = {
  'about-you': 'Você',
  children: 'Seu(s) filho(s)',
  routine: 'Rotina',
  support: 'Rede & prefs',
}

type Props = {
  currentStep: Eu360Step
  onStepClick: (step: Eu360Step) => void
}

export function Eu360Stepper({ currentStep, onStepClick }: Props) {
  return (
    <div className="mx-auto max-w-xl px-4">
      <div className="rounded-3xl border border-white/22 bg-white/10 px-4 py-5 flex flex-col items-center gap-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        {/* STEPS */}
        <div className="flex items-center gap-3">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStepClick(step)}
                className={clsx(
                  'px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold transition-all shadow-sm max-w-[150px]',
                  step === currentStep
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_4px_14px_rgba(255,20,117,0.35)]'
                    : 'bg-white/55 text-white/85 hover:bg-white/80'
                )}
              >
                <span
                  className={clsx(
                    'h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold',
                    step === currentStep
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-white/40 text-[var(--color-brand)]'
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate">{LABELS[step]}</span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="h-[1.5px] w-8 rounded-full bg-white/30" />
              )}
            </div>
          ))}
        </div>

        {/* SUBTEXTO */}
        <p className="text-xs text-white/75 text-center leading-relaxed max-w-sm">
          Comece por você e avance pelas etapas no seu tempo. Suas respostas deixam todas as sugestões do Materna360 mais
          próximas da sua rotina real.
        </p>
      </div>
    </div>
  )
}

export default Eu360Stepper
