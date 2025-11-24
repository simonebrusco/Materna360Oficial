'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
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
          <span className="font-semibold text-[#FF1475]">
            {day}
          </span>
          . Que tal começar definindo suas três prioridades?
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
          <span className="font-semibold text-[#FF1475]">
            {day}
          </span>
          . Conte pra gente como você está agora.
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

  const [currentDateKey, setCurrentDateKey] = useState<string | null>(null)

  // Inicializa a data do dia para chaves de persistência
  useEffect(() => {
    setCurrentDateKey(getBrazilDateKey())
  }, [])

  // Greeting dinâmico
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : 'Mãe'
    const timeGreeting = getTimeGreeting(firstName)
    setGreeting(timeGreeting)

    const interval = setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName)
      setGreeting(updatedGreeting)
    }, 60_000)

    return () => clearInterval(interval)
  }, [name])

  // Track nav
  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
  }, [])

  // Reload automático na virada do dia
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

  // Carrega humor e intenção salvos para o dia atual
  useEffect(() => {
    if (!currentDateKey) return

    const moodKey = `meu-dia:${currentDateKey}:mood`
    const intentionKey = `meu-dia:${currentDateKey}:intention`

    const savedMood = load(moodKey)
    const savedIntention = load(intentionKey)

    if (typeof savedMood === 'string') {
      setSelectedMood(savedMood)
    }
    if (typeof savedIntention === 'string') {
      setSelectedDay(savedIntention)
    }
  }, [currentDateKey])

  const handleMoodSelect = (mood: string) => {
    if (!currentDateKey) {
      setSelectedMood(selectedMood === mood ? null : mood)
      return
    }

    const nextMood = selectedMood === mood ? null : mood
    setSelectedMood(nextMood)

    const moodKey = `meu-dia:${currentDateKey}:mood`
    save(moodKey, nextMood)

    if (nextMood) {
      try {
        track('meu-dia.mood.selected', {
          mood: nextMood,
          dateKey: currentDateKey,
        })
      } catch {}
    }
  }

  const handleDaySelect = (day: string) => {
    if (!currentDateKey) {
      setSelectedDay(selectedDay === day ? null : day)
      return
    }

    const nextDay = selectedDay === day ? null : day
    setSelectedDay(nextDay)

    const intentionKey = `meu-dia:${currentDateKey}:intention`
    save(intentionKey, nextDay)

    if (nextDay) {
      try {
        track('meu-dia.intention.selected', {
          intention: nextDay,
          dateKey: currentDateKey,
        })
      } catch {}
    }
  }

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
            <section className="space-y-4 mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#3A3A3A] leading-snug font-poppins">
                {greeting}
              </h2>

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
                      onClick={() => handleMoodSelect(mood.id)}
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
                        onClick={() => handleDaySelect(tag)}
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
                  <div className="mt-4 text-sm md:text-base text-[#6A6A6A] font-poppins leading-relaxed">
                    {summary.main}
                  </div>
                )
              })()}
            </section>
          </Reveal>

          {/* MAIN PLANNER CARD */}
          <div className="rounded-3xl bg-white border border-[#FFE8F2] p-6 md:p-8 shadow-sm space-y-6 md:space-y-8 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-shadow duration-200">
            {/* INTELLIGENT SUGGESTIONS */}
            <Reveal delay={200}>
              <IntelligentSuggestionsSection
                mood={selectedMood}
                intention={selectedDay}
              />
            </Reveal>

            {/* WEEKLY PLANNER SHELL */}
            <WeeklyPlannerShell />
          </div>

          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
