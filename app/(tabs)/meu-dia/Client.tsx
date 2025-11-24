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

  // Greeting dinâmico
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

  // Telemetria de navegação
  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
  }, [])

  // Reload diário (vira o dia, reseta o estado visual)
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
        <div className="px-4 py-8">
          {/* GREETING + MOOD SECTION */}
          <Reveal delay={0}>
            <section className="space-y-6 mb-6 md:mb-8">
              {/* Hero de saudação em formato de card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFD8E6] via-[#FFE8F2] to-[#FFD8E6] px-5 py-5 md:px-6 md:py-6 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]/80">
                      Hoje por aqui
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-[#2F3A56] leading-snug font-poppins">
                      {greeting}
                    </h2>
                    <p className="text-xs md:text-sm text-[#545454] max-w-md">
                      Vamos organizar seu dia com leveza, priorizando o que
                      realmente importa pra você e pra sua família.
                    </p>
                  </div>

                  {/* Bolinha decorativa estilo app de produtividade */}
                  <div className="mt-1 h-9 w-9 rounded-full border border-white/70 bg-white/60 shadow-card flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-[#FF1475]" />
                  </div>
                </div>
              </div>

              {/* Mood Pills */}
              <div className="space-y-4 md:space-y-5">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide mb-1">
                    Como você está?
                  </p>
                  <p className="text-xs md:text-sm text-[#6A6A6A] font-poppins">
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
                      className={`px-4 py-2 rounded-full text-sm font-semibold font-poppins transition-all ${
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

              {/* Day Tags */}
              <div className="space-y-4 md:space-y-5">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide mb-1">
                    Hoje eu quero um dia...
                  </p>
                  <p className="text-xs md:text-sm text-[#6A6A6A] font-poppins">
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
                        className={`px-4 py-2 rounded-full text-sm font-semibold font-poppins transition-all ${
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

              {/* Summary Block */}
              {(() => {
                const summary = generateSummaryText(selectedMood, selectedDay)
                return (
                  summary.show && (
                    <div className="mt-2 text-sm md:text-base text-[#6A6A6A] font-poppins leading-relaxed">
                      {summary.main}
                    </div>
                  )
                )
              })()}
            </section>
          </Reveal>

          {/* MAIN PLANNER CARD */}
          <SoftCard
            className="relative overflow-hidden rounded-3xl bg-white/90 border border-[#FFE8F2] p-6 md:p-8 shadow-card space-y-6 md:space-y-8
                       before:absolute before:inset-x-6 before:top-0 before:h-[3px] before:rounded-full
                       before:bg-gradient-to-r before:from-[#FF1475]/10 before:via-[#9B4D96]/40 before:to-[#FF1475]/10
                       hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-shadow duration-200"
          >
            <Reveal delay={150}>
              <DailyPriorities />
            </Reveal>

            <Reveal delay={200}>
              <IntelligentSuggestionsSection
                mood={selectedMood}
                intention={selectedDay}
              />
            </Reveal>

            <Reveal delay={250}>
              <WeeklyPlannerShell />
            </Reveal>
          </SoftCard>

          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}

export default MeuDiaClient
