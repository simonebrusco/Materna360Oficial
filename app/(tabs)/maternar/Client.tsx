'use client'

import * as React from 'react'
import { useEffect } from 'react'
import CardHub from '@/components/maternar/CardHub'
import { PageTemplate } from '@/components/common/PageTemplate'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { useProfile } from '@/app/hooks/useProfile'
import { isPremium } from '@/app/lib/plan'
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
        {/* 6 MAIN NAVIGATION CARDS */}
        <Reveal delay={80}>
          <CardHub />
        </Reveal>

        {/* SECTION 1: EMOTIONAL JOURNEY */}
        <Reveal delay={120}>
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm">
              Jornada Emocional
            </div>
            
            {/* Two-column grid for desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Momentos com os Filhos */}
              <ClientOnly>
                <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                  <div className="flex flex-col gap-1 mb-6">
                    <h3 className="m360-subtitle">Momentos com os Filhos</h3>
                    <p className="m360-label-sm text-gray-600">
                      Celebre e registre as memórias especiais que quer guardar para sempre.
                    </p>
                  </div>
                  <MomentosComOsFilhos />
                </div>
              </ClientOnly>

              {/* Diário da Mãe */}
              <ClientOnly>
                <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                  <div className="flex flex-col gap-1 mb-6">
                    <h3 className="m360-subtitle">Diário da Mãe</h3>
                    <p className="m360-label-sm text-gray-600">
                      Registre seus sentimentos, pensamentos e reflexões da maternidade.
                    </p>
                  </div>
                  <DiarioDaMae />
                </div>
              </ClientOnly>
            </div>
          </div>
        </Reveal>

        {/* SECTION 2: YOUR EVOLUTION */}
        <Reveal delay={160}>
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm">
              Sua Evolução
            </div>
            
            <ClientOnly>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Acompanhe seu Progresso</h3>
                  <p className="m360-label-sm text-gray-600">
                    Veja como seu bem-estar, humor e energia evoluem ao longo do tempo.
                  </p>
                </div>
                <SuaEvolucao />
              </div>
            </ClientOnly>
          </div>
        </Reveal>

        {/* SECTION 3: MOTHERHOOD ROUTINES */}
        <Reveal delay={200}>
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm">
              Rotinas da Mãe
            </div>
            
            <ClientOnly>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Crie Seus Hábitos</h3>
                  <p className="m360-label-sm text-gray-600">
                    Pequenos cuidados leves que fazem diferença no seu dia a dia.
                  </p>
                </div>
                <RotinasDaMae />
              </div>
            </ClientOnly>
          </div>
        </Reveal>

        {/* PREMIUM CTA - Only one, clean and at the bottom */}
        {!isPremium() && (
          <Reveal delay={240}>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
              <div className="flex items-start gap-4 sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-3">
                    <AppIcon name="sparkles" size={12} decorative />
                    Premium
                  </div>
                  <h3 className="font-semibold text-support-1 text-lg">Desbloqueie recursos premium</h3>
                  <p className="text-sm text-support-2 mt-1.5">
                    Acesse análises avançadas, PDFs personalizados e muito mais.
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
      </div>
    </PageTemplate>
  )
}
