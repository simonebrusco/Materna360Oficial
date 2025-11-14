'use client'

import React from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { upgradeToPremium, setPlan, getPlan } from '@/app/lib/plan'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

interface PlanFeature {
  label: string
  included: boolean
}

const PLAN_FEATURES: Record<string, PlanFeature[]> = {
  free: [
    { label: 'Planner diário', included: true },
    { label: 'Registro de humor e energia', included: true },
    { label: 'Atividades do dia', included: true },
    { label: 'Anotações rápidas', included: true },
    { label: 'Exportar PDF', included: false },
    { label: 'Insights avançados', included: false },
    { label: 'Modo offline', included: false },
  ],
  premium: [
    { label: 'Planner diário', included: true },
    { label: 'Registro de humor e energia', included: true },
    { label: 'Atividades do dia', included: true },
    { label: 'Anotações rápidas', included: true },
    { label: 'Exportar PDF', included: true },
    { label: 'Insights avançados', included: true },
    { label: 'Modo offline', included: true },
  ],
}

export default function PlansPage() {
  const [open, setOpen] = React.useState(false)
  const plan = typeof window !== 'undefined' ? getPlan() : 'free'

  const handleViewPlans = (planName: string) => {
    track('paywall_view', { plan: planName, source: 'planos_page' })
  }

  const handleUpgradeClick = () => {
    track('paywall_click', { plan: 'premium', source: 'planos_page' })
    setOpen(true)
  }

  return (
    <SectionWrapper className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      {/* Header */}
      <header className="mb-8 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-support-1 mb-2">
          Escolha seu plano
        </h1>
        <p className="text-sm sm:text-base text-support-2 max-w-2xl mx-auto">
          Desbloqueie o potencial completo do Materna360 com recursos premium.
          {plan === 'premium' && (
            <span className="block mt-2 text-primary font-semibold">
              ✓ Você já está no plano Premium
            </span>
          )}
        </p>
      </header>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
        {/* Free Plan */}
        <SoftCard
          className={`rounded-3xl border-2 transition-all ${
            plan === 'free'
              ? 'border-primary/40 shadow-lg'
              : 'border-neutral-200/40'
          } p-6 sm:p-8 flex flex-col`}
        >
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold mb-3">
              <AppIcon name="star" size={12} decorative />
              Seu plano atual
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-support-1">Free</h2>
            <p className="text-sm text-support-2 mt-1">
              Essencial para começar
            </p>
          </div>

          {/* Price */}
          <div className="mb-6 pb-6 border-b border-neutral-200/40">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-bold text-support-1">R$0</span>
              <span className="text-sm text-support-2">/mês</span>
            </div>
            <p className="text-xs text-support-2 mt-2">
              Sem necessidade de cartão de crédito
            </p>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-3 mb-6">
            {PLAN_FEATURES.free.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {feature.included ? (
                  <AppIcon
                    name="check"
                    size={16}
                    decorative
                    className="text-primary flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <AppIcon
                    name="x"
                    size={16}
                    decorative
                    className="text-neutral-300 flex-shrink-0 mt-0.5"
                  />
                )}
                <span
                  className={`text-sm ${
                    feature.included
                      ? 'text-support-1'
                      : 'text-support-2/60'
                  }`}
                >
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* Button */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              handleViewPlans('free')
              setPlan('free')
            }}
          >
            Seu plano atual
          </Button>
        </SoftCard>

        {/* Premium Plan */}
        <SoftCard
          className={`rounded-3xl border-2 transition-all ${
            plan === 'premium'
              ? 'border-primary/40 shadow-lg bg-gradient-to-br from-primary/5 to-white'
              : 'border-primary/20 shadow-lg bg-gradient-to-br from-primary/10 to-white'
          } p-6 sm:p-8 flex flex-col relative`}
        >
          {/* Badge */}
          <div className="absolute -top-3 right-6">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-lg">
              <AppIcon name="sparkles" size={12} decorative />
              Recomendado
            </div>
          </div>

          <div className="mb-6 pt-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-support-1">Premium</h2>
            <p className="text-sm text-support-2 mt-1">
              Tudo liberado + recursos avançados
            </p>
          </div>

          {/* Price */}
          <div className="mb-6 pb-6 border-b border-primary/20">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-bold text-primary">R$29,90</span>
              <span className="text-sm text-support-2">/mês</span>
            </div>
            <p className="text-xs text-support-2 mt-2">
              Teste 7 dias grátis, sem compromisso
            </p>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-3 mb-6">
            {PLAN_FEATURES.premium.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <AppIcon
                  name="check"
                  size={16}
                  decorative
                  className="text-primary flex-shrink-0 mt-0.5"
                />
                <span className="text-sm text-support-1 font-medium">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleUpgradeClick}
          >
            {plan === 'premium' ? 'Seu plano atual' : 'Upgrade agora'}
          </Button>

          {plan === 'premium' && (
            <p className="text-center text-xs text-primary font-semibold mt-3">
              ✓ Ativo até 31 de dezembro de 2025
            </p>
          )}
        </SoftCard>
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg sm:text-xl font-bold text-support-1 mb-4">
          Perguntas frequentes
        </h3>
        <div className="space-y-3">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200/40 bg-white/50 p-4 font-medium text-support-1 hover:bg-white/70 transition-colors">
              Posso mudar de plano depois?
              <span className="transition-transform group-open:rotate-180">
                <AppIcon name="chevron-down" size={20} decorative />
              </span>
            </summary>
            <div className="p-4 text-sm text-support-2 border-t border-neutral-200/40 bg-white/30">
              Sim, você pode fazer downgrade ou cancelar a qualquer momento sem penalidades.
            </div>
          </details>
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200/40 bg-white/50 p-4 font-medium text-support-1 hover:bg-white/70 transition-colors">
              O teste premium de 7 dias é realmente grátis?
              <span className="transition-transform group-open:rotate-180">
                <AppIcon name="chevron-down" size={20} decorative />
              </span>
            </summary>
            <div className="p-4 text-sm text-support-2 border-t border-neutral-200/40 bg-white/30">
              Sim, completamente grátis e sem necessidade de cartão de crédito para começar o teste.
            </div>
          </details>
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200/40 bg-white/50 p-4 font-medium text-support-1 hover:bg-white/70 transition-colors">
              Meus dados ficarão privados?
              <span className="transition-transform group-open:rotate-180">
                <AppIcon name="chevron-down" size={20} decorative />
              </span>
            </summary>
            <div className="p-4 text-sm text-support-2 border-t border-neutral-200/40 bg-white/30">
              Todos os seus dados são criptografados e armazenados com segurança. Nunca compartilhamos informações pessoais.
            </div>
          </details>
        </div>
      </div>

      {/* Upsell Sheet */}
      <UpgradeSheet open={open} onOpenChange={setOpen} />
    </SectionWrapper>
  )
}
