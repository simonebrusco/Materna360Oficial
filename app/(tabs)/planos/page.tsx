'use client'

import { useState } from 'react'
import { isEnabled } from '@/app/lib/flags'
import AppIcon from '@/components/ui/AppIcon'
import AppShell from '@/components/common/AppShell'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'para sempre',
    emoji: '🌱',
    iconName: 'place',
    description: 'Perfeito para começar sua jornada',
    features: [
      'Registrar humor e atividades',
      'Responder a 3 questões IA por semana',
      'Acessar receitas e dicas de organização',
      'Comunidade e suporte básico',
      'Modo escuro e lembretes',
    ],
    cta: 'Sua opção atual',
    ctaAction: () => {},
    badge: 'Atual',
    isPrimary: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '29',
    period: 'ao mês',
    emoji: '✨',
    iconName: 'star',
    description: 'Para mães que querem mais insights',
    features: [
      'Tudo do Free, mais:',
      'Respostas IA ilimitadas',
      'Análises avançadas e relatórios personalizados',
      'Exportar semana em PDF',
      'Prioridade em suporte',
      'Planos de cuidado personalizados',
    ],
    cta: 'Fazer upgrade',
    ctaAction: () => {
      const url = process.env.NEXT_PUBLIC_CHECKOUT_PLUS_URL || '#'
      if (url !== '#') window.location.href = url
      else alert('URL de checkout não configurada')
    },
    badge: 'Popular',
    isPrimary: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '49',
    period: 'ao mês',
    emoji: '👑',
    iconName: 'crown',
    description: 'Suporte completo e máximo de funcionalidades',
    features: [
      'Tudo do Plus, mais:',
      'Mentorias mensais com profissionais',
      'Consultoria familiar personalizada',
      'Planos avançados com IA generativa',
      'Acesso antecipado a novos recursos',
      'Suporte 24/7 via chat e WhatsApp',
    ],
    cta: 'Fazer upgrade',
    ctaAction: () => {
      const url = process.env.NEXT_PUBLIC_CHECKOUT_PREMIUM_URL || '#'
      if (url !== '#') window.location.href = url
      else alert('URL de checkout não configurada')
    },
    badge: 'Melhor valor',
    isPrimary: true,
  },
]

export default function PlanosPage() {
  const [expandedFeatures, setExpandedFeatures] = useState<string | null>(null)

  if (!isEnabled('FF_LAYOUT_V1')) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-center">
        <p className="text-support-2">Esta página não está disponível no momento.</p>
      </main>
    )
  }

  const content = (
    <main className="PageSafeBottom relative mx-auto max-w-5xl bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)] px-4 pt-10 pb-24 sm:px-6 md:px-8">
      <SectionWrapper className="bg-transparent">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(65%_65%_at_50%_0%,rgba(255,216,230,0.55),transparent)]"
        />
        <div>
          <h1 className="text-3xl font-semibold text-support-1 md:text-4xl">
            Planos que Crescem com Você
          </h1>
          <p className="mt-2 text-sm text-support-2 md:text-base">
            Escolha o plano ideal para sua jornada de maternidade e bem-estar familiar.
          </p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 70} className="h-full">
              <Card
                className={`relative h-full flex flex-col p-6 transition-all duration-300 ${
                  plan.isPrimary
                    ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10 ring-2 ring-primary/30'
                    : 'border-white/60 bg-white/80'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2">
                        {isEnabled('FF_LAYOUT_V1') && plan.iconName ? (
                          <AppIcon name={plan.iconName as any} size={40} variant={plan.isPrimary ? 'brand' : 'neutral'} />
                        ) : (
                          <p className="text-4xl">{plan.emoji}</p>
                        )}
                      </div>
                      <h3 className="mt-2 text-2xl font-bold text-support-1">{plan.name}</h3>
                      <p className="mt-1 text-xs text-support-2">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {plan.price === '0' ? (
                      <p className="text-sm text-support-2">Sempre gratuito</p>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-primary">R$ {plan.price}</span>
                        <span className="text-xs text-support-2">/{plan.period}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setExpandedFeatures(expandedFeatures === plan.id ? null : plan.id)}
                  className="mb-6 w-full text-left"
                >
                  <Button
                    variant={plan.isPrimary ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      plan.ctaAction()
                    }}
                  >
                    {plan.cta}
                  </Button>
                </button>

                <div className="flex-1">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-support-2">
                    Incluso:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-support-1">
                        <span className="mt-0.5 text-xs flex-shrink-0">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <Card className="p-6 text-center md:p-8">
          <p className="text-sm text-support-2">
            Todas as assinaturas incluem{' '}
            <span className="font-semibold text-primary">acesso �� comunidade premium</span>, dúvidas respondidas em
            até 24h, e atualizações contínuas. Não há contratos, você pode cancelar a qualquer momento.
          </p>
        </Card>
      </SectionWrapper>

      <SectionWrapper title="Dúvidas?">
        <Card className="p-6 md:p-8">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-support-1">Posso mudar de plano?</p>
              <p className="mt-1 text-sm text-support-2">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Vamos ajustar a sua cobrança proporcionalmente.
              </p>
            </div>
            <div>
              <p className="font-semibold text-support-1">E se eu não gostar?</p>
              <p className="mt-1 text-sm text-support-2">
                Oferecemos garantia de 30 dias. Se não estiver satisfeito, reembolsamos tudo.
              </p>
            </div>
            <div>
              <p className="font-semibold text-support-1">Como funciona o suporte?</p>
              <p className="mt-1 text-sm text-support-2">
                Você pode entrar em contato via chat, email, ou WhatsApp. Os planos Plus e Premium têm prioridade.
              </p>
            </div>
          </div>
        </Card>
      </SectionWrapper>
    </main>
  )

  return <AppShell>{content}</AppShell>
}
