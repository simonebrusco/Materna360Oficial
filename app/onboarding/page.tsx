'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'

type Step = {
  id: string
  title: string
  subtitle: string
  content: string
  icon: string
  cta: string
}

const ONBOARDING_STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Bem-vinda ao Materna360',
    subtitle: 'Seu companheiro em cada passo da maternidade',
    content:
      'Aqui você encontra acolhimento, clareza e ferramentas práticas para uma maternidade mais leve.',
    icon: 'heart',
    cta: 'Próximo',
  },
  {
    id: 'profile',
    title: 'Conheça você e sua família',
    subtitle: 'Personalizamos tudo para você',
    content:
      'Conte-nos sobre você, seu filho e sua jornada. Assim podemos oferecer sugestões que realmente fazem sentido.',
    icon: 'user',
    cta: 'Próximo',
  },
  {
    id: 'features',
    title: 'Explore os recursos',
    subtitle: 'Tudo que você precisa em um só lugar',
    content:
      'Organize seu dia, acompanhe o bem-estar, celebre conquistas e muito mais — tudo pensado para você e seu filho.',
    icon: 'star',
    cta: 'Próximo',
  },
  {
    id: 'ready',
    title: 'Tudo pronto!',
    subtitle: 'Sua jornada começa agora',
    content:
      'Você não precisa abraçar tudo de uma vez. Escolha apenas um passo para hoje — o Materna360 caminha com você.',
    icon: 'crown',
    cta: 'Começar',
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      // Redirect to main app
      window.location.href = '/meu-dia'
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-[#FFF0F6] to-white overflow-hidden">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFE5EF] to-transparent opacity-70 blur-[40px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-[100dvh] px-4">
        {/* Progress indicator */}
        <div className="pt-8 md:pt-12 pb-6">
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 items-center justify-center">
              {ONBOARDING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= currentStep
                      ? 'bg-[#ff005e] w-8'
                      : 'bg-[#ffd8e6] w-6'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center py-8">
          <Reveal delay={0}>
            <div className="max-w-md mx-auto text-center space-y-8">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#ffe9f5] flex items-center justify-center shadow-[0_10px_40px_rgba(255,0,94,0.12)]">
                  <AppIcon
                    name={step.icon as any}
                    size={48}
                    className="text-[#ff005e]"
                    decorative
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-[#2f3a56]">
                  {step.title}
                </h1>
                <p className="text-lg text-[#545454] font-medium">
                  {step.subtitle}
                </p>
                <p className="text-base text-[#545454]/80 leading-relaxed">
                  {step.content}
                </p>
              </div>

              {/* Step indicator text */}
              <p className="text-xs text-[#545454]/60 tracking-wide">
                ETAPA {currentStep + 1} DE {ONBOARDING_STEPS.length}
              </p>
            </div>
          </Reveal>
        </div>

        {/* CTA buttons */}
        <div className="pb-12 md:pb-16">
          <div className="max-w-md mx-auto space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              className="w-full"
            >
              {step.cta}
            </Button>

            {currentStep > 0 && !isLastStep && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="w-full"
              >
                Voltar
              </Button>
            )}

            {!isLastStep && (
              <Link href="/meu-dia" className="block pt-2">
                <button className="w-full text-xs text-[#545454]/60 hover:text-[#545454] transition-colors">
                  Pular para o app
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
