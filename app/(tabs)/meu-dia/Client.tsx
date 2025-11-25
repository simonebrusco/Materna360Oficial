'use client'

import React, { useState, useEffect } from 'react'
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

export function MeuDiaClient() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

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
          {/* BLOCO 1 — CONTEXTO DO DIA (CARD MENOR, SEM SAUDAÇÃO) */}
          <Reveal delay={0}>
            <section>
              <div className="space-y-4 rounded-3xl bg-white/80 border border-[#FFD8E6] shadow-[0_10px_30px_rgba(0,0,0,0.10)] px-4 py-4 md:px-6 md:py-5">
                {/* Texto principal bem direto */}
                <div className="space-y-2">
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Hoje por aqui
                  </p>
                  <p className="text-sm md:text-base text-[#545454] max-w-2xl">
                    Conte pra gente como você está e que tipo de dia você quer ter.
                    O planner cuida do resto lá embaixo.
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
                          }
                          `}
                        >
                          {tag}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* BLOCO 2 — PLANNER COMO PROTAGONISTA */}
          <Reveal delay={100}>
            <SoftCard
              className="relative overflow-hidden rounded-3xl bg-white/92 border border-[#FFE8F2] p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.12)] space-y-6 md:space-y-8
                         before:absolute before:inset-x-8 before:top-0 before:h-[3px] before:rounded-full
                         before:bg-gradient-to-r before:from-[#FF1475]/10 before:via-[#9B4D96]/40 before:to-[#FF1475]/10"
            >
              {/* Título do bloco do planner */}
              <div className="relative z-10 space-y-1">
                <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                  Seu planner de hoje
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
                  Tudo o que importa em um só lugar
                </h3>
                <p className="text-xs md:text-sm text-[#6A6A6A] max-w-xl">
                  Prioridades, compromissos e inspirações conectados ao dia que você escolher no calendário.
                </p>
              </div>

              {/* CONTEÚDO DO PLANNER */}
              <div className="relative z-10 space-y-6 md:space-y-7">
                {/* Prioridades do dia */}
                <section id="prioridades">
                  <DailyPriorities />
                </section>

                {/* Calendário + visão de dia/semana + blocos (agenda, você, filho, notas, inspirações) */}
                <section id="planner-semanal">
                  <WeeklyPlannerShell />
                </section>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCO 3 — SUGESTÕES INTELIGENTES (IA) MAIS DISCRETO */}
          <Reveal delay={200}>
            <section>
              <SoftCard className="rounded-3xl bg-white/95 border border-[#FFE8F2] p-5 md:p-6 space-y-3">
                <div>
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Sugestões inteligentes
                  </p>
                  <h3 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
                    Ideias rápidas para o seu momento
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-[#6A6A6A] max-w-xl">
                    Com base em como você disse que está e no tipo de dia que escolheu,
                    eu trago algumas sugestões que podem deixar sua rotina mais leve.
                  </p>
                </div>

                <IntelligentSuggestionsSection
                  mood={selectedMood}
                  intention={selectedDay}
                />
              </SoftCard>
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
