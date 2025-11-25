'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { SoftCard } from '@/components/ui/card'
import { DailyPriorities } from '@/components/blocks/DailyPriorities'
import { IntelligentSuggestionsSection } from '@/components/blocks/IntelligentSuggestionsSection'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'

const MOOD_LABELS: Record<string, string> = {
  happy: 'Feliz',
  okay: 'Normal',
  stressed: 'Estressada',
}

function generateSummaryText(
  mood: string | null,
  day: string | null,
): { main: React.ReactNode; show: boolean } {
  if (mood && day) {
    return {
      show: true,
      main: (
        <>
          Hoje você está{' '}
          <span className="font-semibold text-[#FF1475]">
            {MOOD_LABELS[mood]}
          </span>{' '}
          e escolheu um dia{' '}
          <span className="font-semibold text-[#FF1475]">{day}</span>. Que tal
            começar definindo suas três prioridades?
        </>
      ),
    }
  }

  if (mood) {
    return {
      show: true,
      main: (
        <>
          Hoje você está{' '}
          <span className="font-semibold text-[#FF1475]">
            {MOOD_LABELS[mood]}
          </span>
          . Agora escolha que tipo de dia você quer ter.
        </>
      ),
    }
  }

  if (day) {
    return {
      show: true,
      main: (
        <>
          Você escolheu um dia{' '}
          <span className="font-semibold text-[#FF1475]">{day}</span>. Conte
          pra gente como você está agora.
        </>
      ),
    }
  }

  return {
    show: true,
    main: (
      <>
        Conte pra gente como você está e que tipo de dia você quer ter. Vamos
        organizar tudo a partir disso.
      </>
    ),
  }
}

export function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Saudação dinâmica
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : 'Mãe'
    const timeGreeting = getTimeGreeting(firstName)
    setGreeting(timeGreeting)

    const interval = window.setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName)
      setGreeting(updatedGreeting)
    }, 60000)

    return () => window.clearInterval(interval)
  }, [name])

  // Telemetria
  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
  }, [])

  // Reload diário
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    )
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const timeoutId = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <PageTemplate
      label="MEU DIA"
      title="Seu Dia Organizado"
      subtitle="Um espaço para planejar com leveza."
      className="materna360-premium-bg"
    >
      <ClientOnly>
        <div className="space-y-8 md:space-y-10 pb-28">
          {/* BLOCO 1 — SAUDAÇÃO + HUMOR + INTENÇÃO (HERO WIDGET) */}
          <Reveal delay={0}>
            <section>
              <div className="space-y-6 rounded-3xl bg-white/80 border border-[#FFD8E6] shadow-[0_10px_30px_rgba(0,0,0,0.10)] px-4 py-5 md:px-6 md:py-7">
                {/* Texto principal */}
                <div className="space-y-2">
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Hoje por aqui
                  </p>
                  <h2 className="text-2xl md:text-3xl font-semibold text-[#3A3A3A] leading-snug">
                    {greeting}
                  </h2>
                  <p className="text-xs md:text-sm text-[#545454] max-w-xl">
                    Vamos organizar seu dia com leveza, priorizando o que
                    realmente importa pra você e pra sua família.
                  </p>
                </div>

                {/* Humor */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide mb-1">
                      Como você está?
                    </p>
                    <p className="text-xs md:text-sm text-[#6A6A6A]">
                      Escolha como você se sente agora.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: 'happy', label: 'Feliz' },
                      { id: 'okay', label: 'Normal' },
                      { id: 'stressed', label: 'Estressada' },
                    ].map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() =>
                          setSelectedMood(
                            selectedMood === mood.id ? null : mood.id,
                          )
                        }
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          selectedMood === mood.id
                            ? 'bg-[#FF1475] border border-[#FF1475] text-white shadow-sm'
                            : 'bg-white border border-[#FFE8F2] text-[#3A3A3A] hover:border-[#FF1475]/50'
                        }`}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intenção do dia */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide mb-1">
                      Hoje eu quero um dia...
                    </p>
                    <p className="text-xs md:text-sm text-[#6A6A6A]">
                      Selecione o estilo do seu dia.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(
                      (tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            setSelectedDay(selectedDay === tag ? null : tag)
                          }
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            selectedDay === tag
                              ? 'bg-[#FF1475] border border-[#FF1475] text-white shadow-sm'
                              : 'bg-white border border-[#FFE8F2] text-[#3A3A3A] hover:border-[#FF1475]/50'
                          }`}
                        >
                          {tag}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Resumo */}
                {(() => {
                  const summary = generateSummaryText(selectedMood, selectedDay)
                  return (
                    summary.show && (
                      <div className="pt-1 text-sm md:text-base text-[#6A6A6A] leading-relaxed">
                        {summary.main}
                      </div>
                    )
                  )
                })()}
              </div>
            </section>
          </Reveal>

          {/* BLOCO 2 — GRID DE WIDGETS DO PLANNER (ESTILO HOME DO CELULAR) */}
          <Reveal delay={100}>
            <section className="space-y-4">
              {/* Título geral do painel */}
              <div className="px-1">
                <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                  Seu planner de hoje
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
                  Veja seu dia em um único lugar
                </h3>
                <p className="text-xs md:text-sm text-[#6A6A6A] max-w-xl">
                  Widgets pensados para você acompanhar prioridades, inspirações
                  e compromissos com a mesma sensação de uma tela inicial de
                  celular, mas com a profundidade do Planner Materna360.
                </p>
              </div>

              {/* GRID PRINCIPAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Widget — Prioridades do Dia */}
                <SoftCard
                  className="relative overflow-hidden rounded-3xl bg-white/92 border border-[#FFE8F2] p-5 md:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.10)]
                             flex flex-col justify-between"
                >
                  <div className="space-y-1 mb-3">
                    <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                      Prioridades do dia
                    </p>
                    <h4 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                      Escolha o que realmente importa hoje
                    </h4>
                    <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                      Três focos principais para tirar o peso da cabeça e
                      colocar no planner.
                    </p>
                  </div>
                  <div className="mt-2">
                    <DailyPriorities />
                  </div>
                </SoftCard>

                {/* Widget — Sugestões Inteligentes */}
                <SoftCard
                  className="relative overflow-hidden rounded-3xl bg-white/92 border border-[#FFE8F2] p-5 md:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.10)]
                             flex flex-col justify-between"
                >
                  <div className="space-y-1 mb-3">
                    <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                      Sugestões inteligentes
                    </p>
                    <h4 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                      Ideias rápidas para o seu momento
                    </h4>
                    <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                      Eu uso seu humor e o tipo de dia que você escolheu para
                      sugerir conteúdos, ideias e cuidados que façam sentido
                      agora.
                    </p>
                  </div>
                  <div className="mt-2">
                    <IntelligentSuggestionsSection
                      mood={selectedMood}
                      intention={selectedDay}
                    />
                  </div>
                </SoftCard>

                {/* Widget — Planner Semanal / Calendário */}
                <SoftCard
                  className="relative overflow-hidden rounded-3xl bg-white/92 border border-[#FFE8F2] p-5 md:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.10)]
                             md:col-span-2"
                >
                  <div className="space-y-1 mb-3">
                    <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                      Compromissos & rotina
                    </p>
                    <h4 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                      Veja sua semana numa visão leve
                    </h4>
                    <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                      Um calendário pensado para mães ocupadas: você enxerga o
                      hoje, mas também se organiza para os próximos dias sem
                      sobrecarregar a mente.
                    </p>
                  </div>
                  <div className="mt-3">
                    <WeeklyPlannerShell />
                  </div>
                </SoftCard>
              </div>
            </section>
          </Reveal>

          {/* Rodapé motivacional */}
          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}

export default MeuDiaClient
