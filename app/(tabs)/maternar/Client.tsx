'use client'

import * as React from 'react'
import { useEffect } from 'react'
import CardHub from '@/components/maternar/CardHub'
import { ContinueCard } from './components/ContinueCard'
import DestaquesDodia from '@/components/maternar/DestaquesDodia'
import { HighlightsSection } from './components/HighlightsSection'
import { PageTemplate } from '@/components/common/PageTemplate'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { useProfile } from '@/app/hooks/useProfile'
import { isPremium } from '@/app/lib/plan'
import SoftCard from '@/components/ui/SoftCard'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { DiarioDaMae } from './components/DiarioDaMae'
import { MomentosComOsFilhos } from './components/MomentosComOsFilhos'
import { SuaEvolucao } from './components/SuaEvolucao'
import { RotinasDaMae } from './components/RotinasDaMae'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function MaternarClient() {
  const [dateKey, setDateKey] = React.useState('2025-01-01')
  const { name } = useProfile()

  useEffect(() => {
    setDateKey(getBrazilDateKey(new Date()))
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    })
  }, [])

  return (
    <PageTemplate
      label="MATERNAR"
      title="Maternar"
      subtitle="O coração do seu dia a dia como mãe. Aqui você acompanha sua jornada, suas memórias e sua evolução."
    >
      <div className="space-y-6 md:space-y-8">
        {/* HIGHLIGHTS SECTION */}
        <Reveal delay={100}>
          <DestaquesDodia />
        </Reveal>

        <Reveal delay={120}>
          <HighlightsSection />
        </Reveal>

        <Reveal delay={140}>
          <ContinueCard dateKey={dateKey} />
        </Reveal>

        {/* SECTION 1: EMOTIONAL JOURNEY */}
        <div>
          {/* Diário da Mãe */}
          <ClientOnly>
            <Reveal delay={160}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Jornada Emocional
              </div>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-6">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Diário da Mãe</h3>
                  <p className="m360-label-sm text-gray-600">
                    Registre sentimentos, pensamentos e momentos importantes da maternidade.
                  </p>
                </div>
                <DiarioDaMae />
              </div>
            </Reveal>
          </ClientOnly>

          {/* Momentos com os Filhos */}
          <ClientOnly>
            <Reveal delay={180}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Conexões Especiais
              </div>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-8">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Momentos com os Filhos</h3>
                  <p className="m360-label-sm text-gray-600">
                    Celebre e registre as memórias especiais com seus filhos que você quer lembrar para sempre.
                  </p>
                </div>
                <MomentosComOsFilhos />
              </div>
            </Reveal>
          </ClientOnly>
        </div>

        {/* SECTION 2: EVOLUTION & ANALYTICS */}
        <ClientOnly>
          <Reveal delay={200}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
              Sua Evolução
            </div>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-8">
              <div className="flex flex-col gap-1 mb-6">
                <h3 className="m360-subtitle">Sua Evolução</h3>
                <p className="m360-label-sm text-gray-600">
                  Acompanhe seu progresso, humor e bem-estar ao longo do tempo.
                </p>
              </div>
              <SuaEvolucao />
            </div>
          </Reveal>
        </ClientOnly>

        {/* SECTION 3: MATERNAL ROUTINES */}
        <ClientOnly>
          <Reveal delay={220}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
              Rotinas da Mãe
            </div>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-8">
              <div className="flex flex-col gap-1 mb-6">
                <h3 className="m360-subtitle">Checklist da Mãe</h3>
                <p className="m360-label-sm text-gray-600">
                  Pequenos cuidados diários que fazem diferença na sua rotina.
                </p>
              </div>
              <RotinasDaMae />
            </div>
          </Reveal>
        </ClientOnly>

        {/* Premium Banner */}
        {!isPremium() && (
          <Reveal delay={240}>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] border-l-4 border-primary p-6 md:p-8">
              <div className="flex items-start gap-4 sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-2">
                    <AppIcon name="sparkles" size={12} decorative />
                    Premium
                  </div>
                  <h3 className="font-semibold text-support-1">Recursos premium disponíveis</h3>
                  <p className="text-xs text-support-2 mt-1">
                    Desbloqueie análises avançadas e PDFs personalizados.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    track('paywall_banner_click', { source: 'maternar', feature: 'premium_features' })
                    window.location.href = '/planos'
                  }}
                  className="flex-shrink-0 whitespace-nowrap"
                >
                  Ver planos
                </Button>
              </div>
            </div>
          </Reveal>
        )}

        {/* ACCESS HUB */}
        <Reveal delay={260}>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
            Acesso Rápido
          </div>
          <CardHub />
        </Reveal>
      </div>
    </PageTemplate>
  )
}
