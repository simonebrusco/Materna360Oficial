'use client'

'use client'

import { useState, useEffect } from 'react'
import { track } from '@/app/lib/telemetry-track'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { PaywallBanner } from '@/components/ui/PaywallBanner'
import { PageTemplate } from '@/components/common/PageTemplate'
import { PageGrid } from '@/components/common/PageGrid'

type PlanId = 'free' | 'essencial' | 'premium'

interface Plan {
  id: PlanId
  name: string
  price: string
  period: string
  description: string
  badge: string
  iconName: 'place' | 'star' | 'crown'
  isPrimary: boolean
  cta: string
  features: string[] // 3 key features
  fullFeatures: string[] // all features shown in expanded view
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: '0',
    period: 'para sempre',
    description: 'Organize suas rotinas e acompanhe o básico.',
    badge: 'Sua opção atual',
    iconName: 'place',
    isPrimary: false,
    cta: 'Acessar →',
    features: [
      'Registrar humor e atividades diárias',
      'Receitas e dicas de organização',
      'Comunidade e suporte básico',
    ],
    fullFeatures: [
      'Registrar humor e atividades',
      'Responder a 3 questões IA por semana',
      'Acessar receitas e dicas de organização',
      'Comunidade e suporte básico',
      'Modo escuro e lembretes',
    ],
  },
  {
    id: 'essencial',
    name: 'Essencial',
    price: '29',
    period: 'ao mês',
    description: 'Desbloqueie recomendações personalizadas e relatórios semanais.',
    badge: 'Popular',
    iconName: 'star',
    isPrimary: true,
    cta: 'Acessar →',
    features: [
      'Respostas IA ilimitadas',
      'Relatórios semanais personalizados',
      'Exportar semana em PDF',
    ],
    fullFeatures: [
      'Tudo do Gratuito, mais:',
      'Respostas IA ilimitadas',
      'Análises avançadas e relatórios personalizados',
      'Exportar semana em PDF',
      'Prioridade em suporte',
      'Planos de cuidado personalizados',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '49',
    period: 'ao mês',
    description: 'Viva a experiência completa, com acesso exclusivo a insights e exportações.',
    badge: 'Melhor valor',
    iconName: 'crown',
    isPrimary: true,
    cta: 'Acessar →',
    features: [
      'Mentorias mensais com profissionais',
      'Consultoria familiar personalizada',
      'Acesso antecipado a novos recursos',
    ],
    fullFeatures: [
      'Tudo do Essencial, mais:',
      'Mentorias mensais com profissionais',
      'Consultoria familiar personalizada',
      'Planos avançados com IA generativa',
      'Acesso antecipado a novos recursos',
      'Suporte 24/7 via chat e WhatsApp',
    ],
  },
]

const FEATURE_COMPARISON = [
  { category: 'Fundamentals', icon: 'heart' },
  { category: 'Analytics', icon: 'bar-chart-2' },
  { category: 'Support', icon: 'message-circle' },
] as const

/**
 * Compute the next plan tier based on current plan
 * Progression: free → essencial → premium
 */
function getNextPlanId(current: PlanId): PlanId {
  if (current === 'free') return 'essencial'
  if (current === 'essencial') return 'premium'
  return 'premium'
}

export default function PlanosPage() {
  const [expandedPlan, setExpandedPlan] = useState<PlanId | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  // TODO: Wire to real user plan from context/state
  const currentPlanId: PlanId = 'free'

  // Track page view on mount
  useEffect(() => {
    track({
      event: 'paywall.view',
      payload: { page: 'plans_overview' },
    })
  }, [])

  const handleUpgrade = (planId: PlanId) => {
    track({
      event: 'paywall.click',
      action: 'upgrade_click',
      id: planId,
      payload: { plan: planId },
    })

    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return

    if (planId === 'essencial') {
      const url = process.env.NEXT_PUBLIC_CHECKOUT_ESSENCIAL_URL || process.env.NEXT_PUBLIC_CHECKOUT_PLUS_URL || '#'
      if (url !== '#') window.location.href = url
      else alert('URL de checkout não configurada')
    } else if (planId === 'premium') {
      const url = process.env.NEXT_PUBLIC_CHECKOUT_PREMIUM_URL || '#'
      if (url !== '#') window.location.href = url
      else alert('URL de checkout não configurada')
    }
  }

  return (
    <main data-layout="page-template-v1" className="bg-soft-page min-h-[100dvh] pb-24">
      <PageTemplate
        title="Planos que Crescem com Você"
        subtitle="Escolha o plano ideal para sua jornada de maternidade e bem-estar familiar."
      >
        {/* Feature Limit Banner (soft paywall) */}
        {showBanner && (
          <PaywallBanner
            title="Você atingiu o limite do seu plano atual."
            description="Que tal conhecer as vantagens do próximo nível?"
            featureName="Gerador de Ideias"
            onUpgradeClick={() => handleUpgrade('plus')}
            onDismiss={() => setShowBanner(false)}
          />
        )}

        {/* Plans Grid */}
        <PageGrid className="gap-6 lg:gap-8">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col rounded-[var(--radius-card)] overflow-hidden transition-all duration-300 ${
                plan.isPrimary
                  ? 'ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20'
                  : 'bg-white/95 border-white/60'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="px-5 pt-4 pb-0">
                  <div className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="px-5 py-4">
                <div className="flex items-start gap-3 mb-2">
                  <AppIcon
                    name={plan.iconName}
                    size={28}
                    variant={plan.isPrimary ? 'brand' : undefined}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-support-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-support-2 mt-1">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4">
                  {plan.price === '0' ? (
                    <p className="text-sm text-support-2">Sempre gratuito</p>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-primary">
                        R$ {plan.price}
                      </span>
                      <span className="text-xs text-support-2">/{plan.period}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features (3 key features shown, others in expandable) */}
              <div className="flex-1 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-support-2 mb-3">
                  Incluso
                </p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-support-1">
                      <AppIcon
                        name="check"
                        size={16}
                        variant="brand"
                        className="flex-shrink-0 mt-0.5"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Expandable full features */}
                {plan.fullFeatures.length > plan.features.length && (
                  <button
                    onClick={() =>
                      setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                    }
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    {expandedPlan === plan.id
                      ? 'Ver menos'
                      : `+ ${plan.fullFeatures.length - plan.features.length} mais`}
                  </button>
                )}

                {expandedPlan === plan.id && (
                  <ul className="space-y-2 mt-4 pt-4 border-t border-white/40">
                    {plan.fullFeatures.slice(plan.features.length).map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2 text-sm text-support-2"
                      >
                        <AppIcon
                          name="check"
                          size={16}
                          variant="muted"
                          className="flex-shrink-0 mt-0.5"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CTA */}
              <div className="px-5 py-4 border-t border-white/40">
                <Button
                  variant={plan.isPrimary ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => {
                    if (plan.id !== 'free') {
                      handleUpgrade(plan.id)
                    }
                  }}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            </Card>
          ))}
        </PageGrid>

        {/* Info Section */}
        <Card className="rounded-[var(--radius-card)] p-5 md:p-6 text-center border-white/60 bg-white/95">
          <p className="text-sm text-support-2">
            Todas as assinaturas incluem{' '}
            <span className="font-semibold text-primary">
              acesso à comunidade premium
            </span>
            , dúvidas respondidas em até 24h, e atualizações contínuas. Não há
            contratos, você pode cancelar a qualquer momento.
          </p>
        </Card>

        {/* FAQ Section */}
        <div>
          <h2 className="text-lg font-semibold text-support-1 mb-4">
            D��vidas?
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Posso mudar de plano?',
                a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Vamos ajustar a sua cobrança proporcionalmente.',
              },
              {
                q: 'E se eu não gostar?',
                a: 'Oferecemos garantia de 30 dias. Se não estiver satisfeito, reembolsamos tudo.',
              },
              {
                q: 'Como funciona o suporte?',
                a: 'Você pode entrar em contato via chat, email, ou WhatsApp. Os planos Plus e Premium têm prioridade.',
              },
            ].map((faq) => (
              <Card
                key={faq.q}
                className="rounded-[var(--radius-card)] p-4 md:p-5 border-white/60 bg-white/95"
              >
                <p className="font-semibold text-support-1">{faq.q}</p>
                <p className="text-sm text-support-2 mt-2">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <Card className="rounded-[var(--radius-card)] p-5 md:p-6 text-center bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <p className="text-sm text-support-1 mb-4">
            Ainda tem dúvidas? Entre em contato conosco
          </p>
          <Button variant="primary" size="md" onClick={() => {
            track({
              event: 'paywall.click',
              action: 'contact_support',
              payload: { context: 'plans_page' },
            })
          }}>
            Conversar com suporte
          </Button>
        </Card>
      </PageTemplate>
    </main>
  )
}
