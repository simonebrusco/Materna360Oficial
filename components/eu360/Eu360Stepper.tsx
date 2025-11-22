'use client'

import React, { useEffect, useRef } from 'react'

export type Eu360Step = 'about-you' | 'children' | 'routine' | 'support'

interface Eu360StepperProps {
  currentStep: Eu360Step
  onStepClick: (step: Eu360Step) => void
}

const STEPS: Array<{ id: Eu360Step; label: string; number: number }> = [
  { id: 'about-you', label: 'Você', number: 1 },
  { id: 'children', label: 'Seu(s) filho(s)', number: 2 },
  { id: 'routine', label: 'Rotina', number: 3 },
  { id: 'support', label: 'Rede de apoio', number: 4 },
]

export function Eu360Stepper({ currentStep, onStepClick }: Eu360StepperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  useEffect(() => {
    // Scroll active step into view on mobile
    if (containerRef.current && window.innerWidth < 768) {
      const activeButton = containerRef.current.querySelector('[data-active="true"]')
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentStep])

  return (
    <div className="sticky top-[var(--header-height,64px)] z-40 bg-white border-b border-[var(--color-pink-snow)] py-3 md:py-4">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="flex items-center gap-2 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex

            return (
              <button
                key={step.id}
                data-active={isActive}
                onClick={() => onStepClick(step.id)}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full transition-all duration-300 ease-out flex-shrink-0 snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/30 focus-visible:ring-offset-2"
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Step circle with number or checkmark */}
                <div
                  className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-white shadow-md'
                      : isCompleted
                        ? 'bg-[var(--color-brand-plum)] text-white'
                        : 'bg-[var(--color-pink-snow)] text-[var(--color-text-main)]'
                  }`}
                >
                  {isCompleted ? '✓' : step.number}
                </div>

                {/* Step label */}
                <span
                  className={`text-xs md:text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'text-[var(--color-brand)] font-semibold' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {step.label}
                </span>

                {/* Separator between steps (not after last) */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden md:block w-8 h-0.5 ml-1 transition-colors duration-300 ${
                      isCompleted ? 'bg-[var(--color-brand-plum)]' : 'bg-[var(--color-border-muted)]'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hide scrollbar on mobile */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
