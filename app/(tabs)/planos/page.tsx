'use client'

import React from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { setPlan, getPlan } from '@/app/lib/plan'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

// Plan configurations
const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    badge: 'Seu plano atual',
    price: 'R$0',
    pricePeriod: '/mês',
    priceNote: 'Sem necessidade de cartão de crédito',
    subtitle: 'Essencial para começar',
    features: [
      { label: 'Planner diário' },
      { label: 'Registro de humor e energia' },
      { label: 'Atividades do dia' },
      { label: 'Anotações rápidas' },
    ],
    buttonText: 'Seu plano atual',
    buttonVariant: 'secondary' as const,
    highlighted: false,
    badgeIcon: 'star' as const,
  },
  {
    id: 'materna-plus',
    name: 'Materna+',
    badge: 'Recomendado',
    price: 'R$29,90',
    pricePeriod: '/mês',
    priceNote: 'Teste 7 dias grátis, sem compromisso',
    subtitle: 'Tudo liberado + recursos avançados',
    features: [
      { label: 'Tudo do Essencial' },
      { label: 'Exportar PDF' },
      { label: 'Insights avançados' },
      { label: 'Modo offline' },
    ],
    buttonText: 'Upgrade agora',
    buttonVariant: 'primary' as const,
    highlighted: true,
    badgeIcon: 'sparkles' as const,
  },
  {
    id: 'materna-360',
    name: 'Materna+ 360',
    badge: 'Completo',
    price: 'R$49,90',
    pricePeriod: '/mês',
    priceNote: 'Acesso à biblioteca completa',
    subtitle: 'Tudo do Materna+ + conteúdos exclusivos',
    features: [
      { label: 'Tudo do Materna+' },
      { label: 'Biblioteca Materna completa' },
      { label: 'Conteúdos premium (aulas, guias, áudios)' },
      { label: 'Novidades em primeira mão' },
    ],
    buttonText: 'Quero o completo',
    buttonVariant: 'primary' as const,
    highlighted: false,
    badgeIcon: 'crown' as const,
  },
]

export default function PlanosPage() {
  const [open, setOpen] = React.useState(false)
  const plan = typeof window !== 'undefined' ? getPlan() : 'free'

  const handleViewPlans = (planId: string) => {
    track('paywall_view', { plan: planId, source: 'planos_page' })
  }

  const handleUpgradeClick = () => {
    track('paywall_click', { plan: 'premium', source: 'planos_page' })
    setOpen(true)
  }

  const currentPlanId = plan === 'premium' ? 'materna-plus' : 'essencial'

  return (
    <PageTemplate
      label="MATERNA+"
      title="Escolha seu plano"
      subtitle="Desbloqueie o potencial completo do Materna360 com recursos premium, no seu tempo e do seu jeito."
    >
      <SectionWrapper className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Mensagem suave sobre o plano atual */}
        {currentPlanId && (
          <div className="mb-8 sm:mb-10 text-center">
            <p className="text-xs sm:text-sm font-semibold text-[#ff005e]">
              ✓ Você já está no plano{' '}
              {PLANS.find((p) => p.id === currentPlanId)?.name}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-muted)]">
              Se fizer sentido para você, pode mudar de plano com calma, sem
              pressa e sem multas.
            </p>
          </div>
        )}

        {/* Plans Grid - 3 Column Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:px-4">
          {PLANS.map((planConfig) => {
            const isCurrentPlan = currentPlanId === planConfig.id
            const isHighlighted = planConfig.highlighted

            return (
              <SoftCard
                key={planConfig.id}
                className={`rounded-3xl border transition-all flex flex-col relative bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl ${
                  isCurrentPlan
                    ? 'border-[var(--color-brand)]/40'
                    : isHighlighted
                      ? 'border-[var(--color-brand-plum)]/30'
                      : 'border-[var(--color-pink-snow)]/60'
                } ${
                  isHighlighted
                    ? 'lg:scale-105 lg:shadow-[0_18px_45px_rgba(155,77,150,0.22)]'
                    : ''
                } p-6 sm:p-8`}
              >
                {/* Badge */}
                <div className="mb-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                      isHighlighted
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'bg-[var(--color-soft-strong)] text-[var(--color-text-main)]'
                    }`}
                  >
                    <AppIcon name={planConfig.badgeIcon} size={12} decorative />
                    {planConfig.badge}
                  </div>
                </div>

                {/* Plan Name */}
                <div className="mb-1">
                  <h2
                    className={`text-xl sm:text-2xl font-bold mb-1 ${
                      isHighlighted
                        ? 'text-[var(--color-brand)]'
                        : 'text-[var(--color-text-main)]'
                    }`}
                  >
                    {planConfig.name}
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {planConfig.subtitle}
                  </p>
                </div>

                {/* Price Section */}
                <div className="mb-6 pb-6 border-b border-[var(--color-pink-snow)]/60">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl sm:text-5xl font-bold ${
                        isHighlighted
                          ? 'text-[var(--color-brand)]'
                          : 'text-[var(--color-text-main)]'
                      }`}
                    >
                      {planConfig.price}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {planConfig.pricePeriod}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    {planConfig.priceNote}
                  </p>
                </div>

                {/* Features List */}
                <div className="flex-1 space-y-3 mb-6">
                  {planConfig.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <AppIcon
                        name="check"
                        size={16}
                        decorative
                        className="flex-shrink-0 mt-0.5 text-[var(--color-brand)]"
                      />
                      <span className="text-sm text-[var(--color-text-main)]">
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  variant={planConfig.buttonVariant}
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    handleViewPlans(planConfig.id)
                    if (planConfig.id !== 'essencial') {
                      handleUpgradeClick()
                    } else {
                      setPlan('free')
                    }
                  }}
                  disabled={isCurrentPlan && planConfig.id === 'essencial'}
                >
                  {isCurrentPlan && planConfig.id === 'essencial'
                    ? 'Seu plano atual'
                    : planConfig.buttonText}
                </Button>

                {isCurrentPlan && planConfig.id !== 'essencial' && (
                  <p className="text-center text-xs text-[var(--color-brand)] font-semibold mt-3">
                    ✓ Ativo até 31 de dezembro de 2025
                  </p>
                )}
              </SoftCard>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-main)] mb-4">
            Perguntas frequentes
          </h3>
          <div className="space-y-3">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-pink-snow)]/60 bg-white/70 p-4 font-medium text-[var(--color-text-main)] hover:bg-white/90 transition-colors">
                Posso mudar de plano depois?
                <span className="transition-transform group-open:rotate-180">
                  <AppIcon name="chevron-down" size={20} decorative />
                </span>
              </summary>
              <div className="p-4 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-pink-snow)]/60 bg-white/60">
                Sim, você pode fazer downgrade ou cancelar a qualquer momento
                sem penalidades. A ideia é que o Materna360 se adapte à sua
                fase, e não o contrário.
              </div>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-pink-snow)]/60 bg-white/70 p-4 font-medium text-[var(--color-text-main)] hover:bg-white/90 transition-colors">
                O teste premium de 7 dias é realmente grátis?
                <span className="transition-transform group-open:rotate-180">
                  <AppIcon name="chevron-down" size={20} decorative />
                </span>
              </summary>
              <div className="p-4 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-pink-snow)]/60 bg-white/60">
                Sim, completamente grátis e sem necessidade de cartão de
                crédito para começar o teste. Você só segue com o plano pago se
                fizer sentido para você.
              </div>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-pink-snow)]/60 bg-white/70 p-4 font-medium text-[var(--color-text-main)] hover:bg-white/90 transition-colors">
                Meus dados ficarão privados?
                <span className="transition-transform group-open:rotate-180">
                  <AppIcon name="chevron-down" size={20} decorative />
                </span>
              </summary>
              <div className="p-4 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-pink-snow)]/60 bg-white/60">
                Todos os seus dados são criptografados e armazenados com
                segurança. Nunca compartilhamos informações pessoais.
              </div>
            </details>
          </div>
        </div>

        {/* Upsell Sheet */}
        <UpgradeSheet open={open} onOpenChange={setOpen} />
      </SectionWrapper>
    </PageTemplate>
  )
}
