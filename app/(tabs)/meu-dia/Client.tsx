'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
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

function scrollToSection(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

          {/* BLOCO 2 — ATALHOS EM GRID (ESTILO HOME / HUB) */}
          <Reveal delay={60}>
            <section aria-label="Atalhos rápidos do planner de hoje">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('prioridades')}
                  className="rounded-3xl bg-white/90 border border-[#FFE8F2] px-3 py-3 md:px-4 md:py-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition-shadow"
                >
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Foco
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-[#2F3A56]">
                    Prioridades de hoje
                  </p>
                  <p className="mt-1 text-[11px] md:text-xs text-[#6A6A6A]">
                    Toque para definir até três prioridades.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('sugestoes')}
                  className="rounded-3xl bg-white/90 border border-[#FFE8F2] px-3 py-3 md:px-4 md:py-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition-shadow"
                >
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Inspiração
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-[#2F3A56]">
                    Sugestões do momento
                  </p>
                  <p className="mt-1 text-[11px] md:text-xs text-[#6A6A6A]">
                    Ideias e conteúdos baseados no seu humor e intenção do dia.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('planner-semanal')}
                  className="rounded-3xl bg-white/90 border border-[#FFE8F2] px-3 py-3 md:px-4 md:py-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition-shadow"
                >
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Rotina
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-[#2F3A56]">
                    Compromissos & semana
                  </p>
                  <p className="mt-1 text-[11px] md:text-xs text-[#6A6A6A]">
                    Veja hoje e os próximos dias em uma visão leve.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('sugestoes')}
                  className="rounded-3xl bg-white/90 border border-[#FFE8F2] px-3 py-3 md:px-4 md:py-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition-shadow"
                >
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Cuidado
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-[#2F3A56]">
                    Um carinho pra você
                  </p>
                  <p className="mt-1 text-[11px] md:text-xs text-[#6A6A6A]">
                    Use as sugestões para encontrar um respiro no seu dia.
                  </p>
                </button>
              </div>
            </section>
          </Reveal>

          {/* BLOCO 3 — GRID COM OS CARDS ORIGINAIS (SEM DUPLICAR LAYOUT) */}
          <Reveal delay={100}>
            <section className="space-y-4">
              <div className="px-1">
                <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                  Seu planner de hoje
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
                  Veja seu dia em um único lugar
                </h3>
                <p className="text-xs md:text-sm text-[#6A6A6A] max-w-xl">
                  Acompanhe prioridades, inspirações e compromissos com a
                  sensação de tela inicial, mas com a profundidade do Planner
                  Materna360.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div id="prioridades" className="h-full">
                  <DailyPriorities />
                </div>

                <div id="sugestoes" className="h-full">
                  <IntelligentSuggestionsSection
                    mood={selectedMood}
                    intention={selectedDay}
                  />
                </div>

                <div id="planner-semanal" className="md:col-span-2">
                  <WeeklyPlannerShell />
                </div>
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
