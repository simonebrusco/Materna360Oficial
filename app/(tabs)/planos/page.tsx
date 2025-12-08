'use client'

import React from 'react'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { setPlan, getPlan } from '@/app/lib/plan'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import LegalFooter from '@/components/common/LegalFooter' // ✅ corrigido aqui

// Configuração dos planos
const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    badge: 'Seu plano atual',
    price: 'R$0',
    pricePeriod: '/mês',
    priceNote: 'Para começar leve, sem compromisso e sem cartão.',
    subtitle: 'Para começar leve, sem compromisso e sem cartão.',
    features: [
      { label: 'Planner diário (versão básica)' },
      { label: 'Registro de humor e energia' },
      { label: 'Anotações rápidas' },
      { label: 'Atividades do dia (não personalizadas)' },
      { label: '1 insight emocional por dia' },
      { label: 'Acesso parcial ao Eu360' },
      { label: 'Histórico emocional dos últimos 7 dias' },
      { label: 'Biblioteca Materna limitada (1 guia por categoria)' },
      { label: '1 trilha educativa introdutória' },
      { label: 'Até 5 interações de IA por dia' },
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
    priceNote:
      'Para mães que desejam organização gentil, clareza emocional e apoio diário.',
    subtitle:
      'Recursos avançados para uma rotina organizada, leve e acolhida.',
    features: [
      { label: 'Tudo do Essencial' },
      { label: 'Exportar PDF (Planner, Rotina Leve, Como Estou Hoje)' },
      { label: 'Insights emocionais e organizacionais avançados' },
      { label: 'Modo offline' },
      { label: 'Histórico emocional completo' },
      { label: 'Rotinas inteligentes do dia (com IA personalizada)' },
      { label: 'Atividades guiadas por idade' },
      {
        label:
          'Trilhas educativas completas e trilhas de desenvolvimento infantil',
      },
      { label: 'Biblioteca Materna completa' },
      { label: 'Wallpapers exclusivos' },
      { label: 'Gamificação: primeiros níveis de conquistas (níveis 1 e 2)' },
      {
        label:
          'Conteúdos premium incluídos: Manual de Sobrevivência para Pais, Minicurso Parentalidade Inteligente, Áudios de Acalmamento, Caderno de Exercícios e guias complementares',
      },
      {
        label:
          'Até 40 interações de IA por dia, personalizadas pelo seu perfil no Eu360',
      },
    ],
    buttonText: 'Quero o Materna+',
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
    priceNote:
      'Para acompanhar sua jornada emocional e familiar de forma completa e personalizada.',
    subtitle: 'A experiência completa de cuidado, presença e personalização.',
    features: [
      { label: 'Tudo do Materna+' },
      { label: 'IA ilimitada e avançada com leitura emocional detalhada' },
      { label: 'Relatórios emocionais semanais e mensais' },
      { label: 'Trilhas educativas personalizadas para sua família' },
      {
        label:
          'Rotina Inteligente 360, com ajustes automáticos ao longo da semana',
      },
      {
        label:
          'Conteúdos avançados da Biblioteca Materna, trilhas terapêuticas e aulas especiais',
      },
      {
        label:
          'Gamificação premium: níveis 3 a 5, missões semanais personalizadas e medalhas exclusivas',
      },
      { label: 'Painel mensal e anual de evolução da sua jornada' },
      {
        label:
          'Prioridade nas agendas de profissionais parceiros e acesso a eventos especiais',
      },
      {
        label:
          'Descontos entre 10% e 15% em mentorias e encontros com especialistas parceiros',
      },
    ],
    buttonText: 'Quero o Materna+ 360',
    buttonVariant: 'primary' as const,
    highlighted: false,
    badgeIcon: 'crown' as const,
  },
]

export default function PlanosPage() {
  const [open, setOpen] = React.useState(false)
  const plan = typeof window !== 'undefined' ? getPlan() : 'free'
  const currentPlanId = plan === 'premium' ? 'materna-plus' : 'essencial'

  const handleViewPlans = (planId: string) => {
    track('paywall_view', { plan: planId, source: 'planos_page' })
  }

  const handleUpgradeClick = () => {
    track('paywall_click', { plan: 'premium', source: 'planos_page' })
    setOpen(true)
  }

  return (
    <main
      data-layout="page-template-v1"
      className="min-h-[100dvh] pb-16 bg-[#FFE4F0] bg-[radial-gradient(circle_at_top_left,#F2C3EA_0,#FF78B3_30%,#FF9BC8_60%,#FFB3D8_82%,#FFE4F0_100%)]"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6 pt-10">
        {/* HERO da página de planos */}
        <header className="mb-8 sm:mb-10 text-center">
          <span className="inline-flex items-center rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            PLANOS MATERNA360
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            Planos feitos para acompanhar o seu ritmo
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
            Cada mãe tem seu tempo, sua energia e sua rotina. Escolha o plano
            que faz sentido para o seu momento — sem pressão, sem cobrança. Aqui,
            você é quem guia o caminho.
          </p>

          {currentPlanId && (
            <div className="mt-4 space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-[#FFE4F0]">
                Você já está no plano{' '}
                {PLANS.find(p => p.id === currentPlanId)?.name}
              </p>
              <p className="text-xs sm:text-sm text-white/90">
                Se fizer sentido para você, pode mudar de plano com calma, sem
                pressa e sem multas. O plano acompanha a sua fase, não o
                contrário.
              </p>
            </div>
          )}
        </header>

        {/* Card grande com conteúdo em branco */}
        <div className="rounded-[32px] border border-white/70 bg-white/96 backdrop-blur-2xl shadow-[0_22px_55px_rgba(0,0,0,0.22)] px-4 sm:px-6 lg:px-8 py-8 sm:py-10 mb-10">
          {/* Grid de planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
            {PLANS.map(planConfig => {
              const isCurrentPlan = currentPlanId === planConfig.id
              const isHighlighted = planConfig.highlighted

              return (
                <SoftCard
                  key={planConfig.id}
                  className={`rounded-3xl border transition-all flex flex-col relative bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${
                    isCurrentPlan
                      ? 'border-[var(--color-brand)]/40'
                      : isHighlighted
                        ? 'border-[var(--color-brand-plum)]/30'
                        : 'border-[var(--color-pink-snow)]/60'
                  } ${
                    isHighlighted
                      ? 'lg:scale-105 lg:shadow-[0_18px_45px_rgba(155,77,150,0.18)]'
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
                      <AppIcon
                        name={planConfig.badgeIcon}
                        size={12}
                        decorative
                      />
                      {planConfig.badge}
                    </div>
                  </div>

                  {/* Nome do plano */}
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

                  {/* Preço */}
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

                  {/* Lista de benefícios */}
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

                  {/* Botão */}
                  <Button
                    variant={planConfig.buttonVariant}
                    size="lg"
                    className="w-full md:w-[230px]"
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
                      Plano ativo atualmente
                    </p>
                  )}
                </SoftCard>
              )
            })}
          </div>

          {/* Tabela comparativa simplificada */}
          <div className="mb-10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              Comparando os planos
            </h3>
            <p className="text-sm text-white/90 mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              Um resumo dos principais recursos em cada plano, para te ajudar a
              escolher com calma o que faz mais sentido para a sua rotina.
            </p>

            <div className="overflow-x-auto">
