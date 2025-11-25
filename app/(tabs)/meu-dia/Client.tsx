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
          <span className="font-semibold text-[#FF1475]">{day}</span>. Agora é
          só usar o planner aqui embaixo pra organizar o que realmente importa
          hoje.
        </>
      ),
    }
  }

  return { show: false, main: null }
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
          {/* BLOCO 1 — SAUDAÇÃO, AGORA MAIS ENXUTO E CENTRALIZADO */}
          <Reveal delay={0}>
            <section>
              <div className="max-w-3xl mx-auto space-y-5 rounded-3xl bg-white/85 border border-[#FFD8E6] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-4 py-4 md:px-6 md:py-5">
                {/* Texto principal */}
                <div className="space-y-1.5">
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Hoje por aqui
                  </p>
                  <h2 className="text-xl md:text-2xl font-semibold text-[#3A3A3A] leading-snug">
                    {greeting}
                  </h2>
                  <p className="text-xs md:text-sm text-[#545454] max-w-xl">
                    Conte pra gente como você está e que tipo de dia você quer
                    ter. O planner cuida do resto lá embaixo.
                  </p>
                </div>

                {/* Humor */}
                <div className="space-y-2.5 md:space-y-3">
                  <div>
                    <p className="text-[11px] md:text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide mb-0.5">
                      Como você está?
                    </p>
                    <p className="text-[11px] md:text-xs text-[#6A6A6A]">
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
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
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
                <div className="space-y-2.5 md:space-y-3">
                  <div>
                    <p className="text-[11px] md:text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide mb-0.5">
                      Hoje eu quero um dia...
                    </p>
                    <p className="text-[11px] md:text-xs text-[#6A6A6A]">
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
                          className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
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

                {/* Resumo — só quando tiver humor + intenção */}
                {(() => {
                  const summary = generateSummaryText(
                    selectedMood,
                    selectedDay,
                  )
                  return (
                    summary.show && (
                      <div className="pt-1 text-xs md:text-sm text-[#6A6A6A] leading-relaxed border-t border-[#FFE8F2] mt-1">
                        {summary.main}
                      </div>
                    )
                  )
                })()}
              </div>
            </section>
          </Reveal>

          {/* BLOCO 2 — PLANNER COMPLETO */}
          <Reveal delay={100}>
            <SoftCard
              className="relative overflow-hidden rounded-3xl bg-white/92 border border-[#FFE8F2] p-5 md:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.12)] space-y-6 md:space-y-7
                         before:absolute before:inset-x-8 before:top-0 before:h-[3px] before:rounded-full
                         before:bg-gradient-to-r before:from-[#FF1475]/10 before:via-[#9B4D96]/40 before:to-[#FF1475]/10"
            >
              <div className="relative z-10 space-y-1">
                <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                  Seu planner de hoje
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
                  Tudo o que importa em um só lugar
                </h3>
                <p className="text-xs md:text-sm text-[#6A6A6A] max-w-xl">
                  Prioridades, compromissos e lembretes em um único fluxo. Use
                  este espaço pra tirar o peso da cabeça e organizar o dia com
                  leveza.
                </p>
              </div>

              <div className="relative z-10 space-y-6 md:space-y-7">
                <section id="prioridades">
                  <DailyPriorities />
                </section>

                <section id="sugestoes">
                  <IntelligentSuggestionsSection
                    mood={selectedMood}
                    intention={selectedDay}
                  />
                </section>

                <section id="planner-semanal">
                  <WeeklyPlannerShell />
                </section>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}

export default MeuDiaClient
