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
import AppIcon from '@/components/ui/AppIcon'

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

  // Reload diário (vira o dia)
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
        {/* espaçamento geral da página + respiro pro BottomNav */}
        <div className="space-y-8 md:space-y-10 pb-28">
          {/* BLOCO: SAUDAÇÃO + HUMOR + INTENÇÃO */}
          <Reveal delay={0}>
            <section>
              <div className="space-y-6 rounded-3xl bg-white/70 border border-[#FFD8E6] shadow-card px-4 py-5 md:px-5 md:py-6">
                {/* texto principal */}
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

                {/* humor */}
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

                {/* intenção do dia */}
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

                {/* resumo */}
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

          {/* SEÇÃO: SEU PLANNER DE HOJE (card resumo, mais editorial) */}
          <Reveal delay={80}>
            <SoftCard className="rounded-3xl bg-white/82 border border-[#FFD8E6] p-5 md:p-6 shadow-card">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF1475]">
                  Seu planner de hoje
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                  Veja seu dia em um único lugar
                </h3>
                <p className="text-xs md:text-sm text-[#545454] max-w-xl">
                  Aqui você reúne prioridades, compromissos e lembretes. Um
                  espaço prático pra tirar o peso da cabeça e colocar tudo no papel, com leveza.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  className="text-sm font-medium text-[#FF1475] underline underline-offset-2"
                >
                  Abrir Planner completo →
                </button>
              </div>
            </SoftCard>
          </Reveal>

          {/* MINI-HUB 2x2 — atalhos para partes do planner (inspiração no Maternar Hub) */}
          <Reveal delay={120}>
            <section aria-label="Atalhos do seu dia">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[
                  {
                    id: 'prioridades',
                    label: 'Prioridades do dia',
                    icon: 'check' as const,
                  },
                  {
                    id: 'tarefas',
                    label: 'Compromissos',
                    icon: 'calendar' as const,
                  },
                  {
                    id: 'cuidar',
                    label: 'Cuidar de mim hoje',
                    icon: 'heart' as const,
                  },
                  {
                    id: 'lembretes',
                    label: 'Lembretes rápidos',
                    icon: 'idea' as const,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="group rounded-2xl bg-white/78 border border-[#FFE8F2] shadow-card px-3 py-4 flex flex-col items-center justify-center aspect-square hover:-translate-y-[2px] hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)] transition-all duration-150"
                  >
                    <AppIcon
                      name={item.icon}
                      className="w-6 h-6 md:w-7 md:h-7 text-[#FF1475] mb-2 group-hover:scale-110 transition-transform duration-150"
                      decorative
                    />
                    <span className="text-xs md:text-[13px] font-medium text-[#3A3A3A] text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </Reveal>

          {/* BLOCO PREMIUM UNIFICADO DO PLANNER */}
          <Reveal delay={200}>
            <SoftCard
              className="relative overflow-hidden rounded-3xl bg-white/90 border border-[#FFE8F2] p-6 md:p-8 shadow-card space-y-6 md:space-y-8"
            >
              {/* Prioridades do dia */}
              <DailyPriorities />

              {/* Sugestões inteligentes da IA */}
              <IntelligentSuggestionsSection
                mood={selectedMood}
                intention={selectedDay}
              />

              {/* Planner semanal */}
              <WeeklyPlannerShell />
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}

export default MeuDiaClient
