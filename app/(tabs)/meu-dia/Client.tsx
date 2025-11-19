'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
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

  const dailyMessage = DAILY_MESSAGES[getDailyIndex(new Date(), DAILY_MESSAGES.length)]

  return (
    <div className="bg-gradient-to-b from-[#FFF0F6] via-[#FFF8FC] to-white min-h-[100dvh]">
      <PageTemplate label="MEU DIA" title="Seu Dia Organizado" subtitle="Um espaço para planejar com leveza.">
        <ClientOnly>
          <div className="mx-auto max-w-[1040px] px-4 md:px-6">
            {/* GREETING SECTION */}
            <Reveal delay={0}>
              <section className="space-y-4 mb-6 md:mb-8" suppressHydrationWarning>
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

            {/* RESUMO DO DIA */}
            <Reveal delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 space-y-6 md:space-y-0 md:items-stretch">
                <div className="flex h-full">
                  <div className="rounded-[22px] border border-black/5 bg-gradient-to-br from-pink-50 to-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6 w-full flex flex-col">
                    <div className="space-y-3">
                      <p className="text-xs md:text-sm font-semibold text-[#ff005e] uppercase tracking-wide font-poppins">Meu Dia em 1 Minuto</p>
                      <div className="space-y-2">
                        <p className="text-sm text-[#545454] font-poppins">
                          Você tem tudo que precisa dentro de você. Hoje é um novo dia para honrar seu tempo.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <AppIcon name="heart" className="w-5 h-5 text-[#ff005e]" />
                          <span className="text-xs font-semibold text-[#ff005e] font-poppins">Sempre no seu tempo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex h-full">
                  <div className="rounded-[22px] border border-black/5 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6 w-full flex items-center gap-4">
                    <AppIcon name="sparkles" className="w-8 h-8 text-[#ff005e] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#ff005e] uppercase tracking-wide mb-1 font-poppins">Frase do Dia</p>
                      <p className="text-sm md:text-base font-medium text-[#2f3a56] leading-relaxed font-poppins">&quot;{dailyMessage}&quot;</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* INTELLIGENT SUGGESTIONS */}
            <Reveal delay={200}>
              <IntelligentSuggestionsSection mood={selectedMood} intention={selectedDay} />
            </Reveal>

            {/* WEEKLY PLANNER SHELL */}
            <div className="mt-6 md:mt-8 space-y-6 md:space-y-8">
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
