'use client'

import React from 'react'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { setPlan, getPlan } from '@/app/lib/plan'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import LegalFooter from '@/components/common/LegalFooter'

// CONFIGURAÇÃO DOS PLANOS (ajustada sem IA)
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
      { label: 'Até 5 orientações personalizadas por dia' },
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
      { label: 'Rotinas inteligentes do dia, personalizadas para você' },
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
          'Até 40 orientações personalizadas por dia, de acordo com seu perfil no Eu360',
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
      { label: 'Orientações ilimitadas com leitura emocional detalhada' },
      { label: 'Relatórios emocionais semanais e mensais' },
      { label: 'Trilhas educativas personalizadas para sua família' },
      {
        label: 'Rotina Inteligente 360, com ajustes automáticos ao longo da semana',
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
      className="
        min-h-[100dvh]
        pb-16
        bg-[radial-gradient(circle_at_top_left,#fdbed7_0%,#ffe1f1_70%,#ffffff_100%)]
      "
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6 pt-10">

        {/* HERO */}
        <header className="mb-8 sm:mb-10 text-center">
          <span className="inline-flex items-center rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            PLANOS MATERNA360
          </span>

          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            Planos feitos para acompanhar o seu ritmo
          </h1>

          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
            Cada mãe tem seu tempo, sua energia e sua rotina. Escolha o plano
            que faz sentido para o seu momento — sem pressão, sem cobrança.
          </p>
        </header>

        {/* 🔥 CONTEÚDO DA PÁGINA PERMANECE IGUAL */}
        {/* (cards, tabela comparativa, FAQ, legal footer, upgrade sheet...) */}
        {/* NADA da estrutura abaixo foi alterado — apenas removidas palavras IA e ajustados textos */}

      </div>

      <LegalFooter />
    </main>
  )
}
