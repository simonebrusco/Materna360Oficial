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
import IntelligentSuggestionsSection from '@/components/blocks/IntelligentSuggestionsSection'
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
    main:
      'Conte pra gente como você está e que tipo de dia você quer ter. Vamos organizar tudo a partir disso.',
  }
}

export function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Greeting
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : 'Mãe'
    const timeGreeting = getTimeGreeting(firstName)
    setGreeting(timeGreeting)

    const interval = setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName)
      setGreeting(updatedGreeting)
    }, 60000)

    return () => clearInterval(interval)
  }, [name])

  // Track nav
  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
  }, [])

  // Daily reload
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
    >
      <ClientOnly>
        <div className="px-4 py-8">
          {/* GREETING SECTION */}
          <Reveal delay={0}>
            <section className="mb-6 space-y-4 md:mb-8">
              <h2 className="font-poppins text-2xl font-semibold leading-snug text-[#3A3A3A] md:text-3xl">
                {greeting}
              </h2>

              {/* Mood Pills */}
              <div className="space-y-4 md:space-y-5">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#3A3A3A] md:text-sm">
                    Como você está?
                  </p>
                  <p className="font-poppins text-xs text-[#6A6A6A] md:text-sm">
                    Escolha como você se sente agora.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                      className={`rounded-full px-4 py-2 text-sm font-semibold font-poppins transition-all ${
                        selectedMood === mood.id
                          ? 'border-[#FF1475] bg-[#FF1475] text-white shadow-sm'
                          : 'border border-[#FFE8F2] bg-white text-[#3A3A3A] hover:border-[#FF1475]/50'
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
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#3A3A3A] md:text-sm">
                    Hoje eu quero um dia...
                  </p>
                  <p className="font-poppins text-xs text-[#6A6A6A] md:text-sm">
                    Selecione o estilo do seu dia.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setSelectedDay(
                            selectedDay === tag ? null : tag,
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold font-poppins transition-all ${
                          selectedDay === tag
                            ? 'border-[#FF1475] bg-[#FF1475] text-white shadow-sm'
                            : 'border border-[#FFE8F2] bg-white text-[#3A3A3A] hover:border-[#FF1475]/50'
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
                const summary = generateSummaryText(
                  selectedMood,
                  selectedDay,
                )
                return (
                  <div className="mt-4 font-poppins text-sm leading-relaxed text-[#6A6A6A] md:text-base">
                    {summary.main}
                  </div>
                )
              })()}
            </section>
          </Reveal>

          {/* MAIN PLANNER CARD */}
          <div className="space-y-6 rounded-3xl border border-[#FFE8F2] bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] md:space-y-8 md:p-8">
            {/* Prioridades do Dia */}
            <Reveal delay={100}>
              <DailyPriorities />
            </Reveal>

            {/* Sugestões Inteligentes */}
            <Reveal delay={200}>
              <IntelligentSuggestionsSection
                mood={selectedMood}
                intention={selectedDay}
              />
            </Reveal>

            {/* Weekly planner */}
            <WeeklyPlannerShell />
          </div>

          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
