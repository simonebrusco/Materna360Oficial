'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import IntelligentSuggestionsSection from '@/components/blocks/IntelligentSuggestionsSection'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'

const MOOD_LABELS: Record<string, string> = {
  happy: 'Feliz',
  okay: 'Normal',
  stressed: 'Estressada',
}

function generateSummaryText(mood: string | null, day: string | null): { main: React.ReactNode; show: boolean } {
  if (mood && day) {
    return {
      show: true,
      main: (
        <>
          Hoje você está <span className="font-semibold text-[#ff005e]">{MOOD_LABELS[mood]}</span> e escolheu um dia{' '}
          <span className="font-semibold text-[#ff005e]">{day}</span>. Que tal começar definindo suas três prioridades?
        </>
      ),
    }
  }

  if (mood) {
    return {
      show: true,
      main: (
        <>
          Hoje você está <span className="font-semibold text-[#ff005e]">{MOOD_LABELS[mood]}</span>. Agora escolha que tipo de
          dia você quer ter.
        </>
      ),
    }
  }

  if (day) {
    return {
      show: true,
      main: (
        <>
          Você escolheu um dia <span className="font-semibold text-[#ff005e]">{day}</span>. Conte pra gente como você está agora.
        </>
      ),
    }
  }

  return {
    show: true,
    main: 'Conte pra gente como você está e que tipo de dia você quer ter. Vamos organizar tudo a partir disso.',
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
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const timeoutId = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <div className="bg-gradient-to-b from-[#FFF0F6] via-[#FFF8FC] to-white min-h-[100dvh]">
      <PageTemplate label="MEU DIA" title="Seu Dia Organizado" subtitle="Um espaço para planejar com leveza.">
        <ClientOnly>
          <div className="mx-auto max-w-5xl px-4 py-8">
            {/* GREETING SECTION */}
            <Reveal delay={0}>
              <section className="space-y-4 mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-[#2f3a56] leading-snug font-poppins">
                  {greeting}
                </h2>

                {/* Mood Pills */}
                <div className="space-y-4 md:space-y-5">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-[#2f3a56] uppercase tracking-wide mb-1">Como você está?</p>
                    <p className="text-xs md:text-sm text-[#545454]/70 font-poppins">Escolha como você se sente agora.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: 'happy', label: 'Feliz' },
                      { id: 'okay', label: 'Normal' },
                      { id: 'stressed', label: 'Estressada' },
                    ].map(mood => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold font-poppins transition-all ${
                          selectedMood === mood.id
                            ? 'bg-[#ffd8e6] border-[1.5px] border-[#ff005e] text-[#ff005e] shadow-sm'
                            : 'bg-white border border-[#e5e5e5] text-[#2f3a56] hover:border-[#ff005e]/30'
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
                    <p className="text-xs md:text-sm font-semibold text-[#2f3a56] uppercase tracking-wide mb-1">Hoje eu quero um dia...</p>
                    <p className="text-xs md:text-sm text-[#545454]/70 font-poppins">Selecione o estilo do seu dia.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedDay(selectedDay === tag ? null : tag)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold font-poppins transition-all ${
                          selectedDay === tag
                            ? 'bg-[#ffd8e6] border-[1.5px] border-[#ff005e] text-[#ff005e] shadow-sm'
                            : 'bg-white border border-[#e5e5e5] text-[#2f3a56] hover:border-[#ff005e]/30'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Block */}
                {(() => {
                  const summary = generateSummaryText(selectedMood, selectedDay)
                  return (
                    <div className="mt-4 text-sm md:text-base text-[#545454] font-poppins leading-relaxed">
                      {summary.main}
                    </div>
                  )
                })()}
              </section>
            </Reveal>

            {/* MAIN PLANNER CARD */}
            <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-6">
              {/* MAIN CONTENT SECTIONS - organized with consistent spacing */}

              {/* INTELLIGENT SUGGESTIONS */}
              <Reveal delay={200}>
                <IntelligentSuggestionsSection mood={selectedMood} intention={selectedDay} />
              </Reveal>

              {/* WEEKLY PLANNER SHELL */}
              <WeeklyPlannerShell />
            </div>

            {/* Footer message */}
            <div className="mt-8 md:mt-10 text-center pb-12 md:pb-16">
              <p className="text-xs md:text-sm text-[#545454] leading-relaxed font-poppins">
                Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
              </p>
            </div>
          </div>
        </ClientOnly>
      </PageTemplate>
    </div>
  )
}
