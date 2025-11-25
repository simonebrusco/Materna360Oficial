'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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

const QUICK_WIDGETS = [
  {
    id: 'prioridades',
    label: 'Prioridades de hoje',
    description: 'Defina o que realmente precisa acontecer.',
    icon: 'target' as const,
    href: '#planner-completo',
  },
  {
    id: 'compromissos',
    label: 'Compromissos & tarefas',
    description: 'Veja o que já está marcado para o dia.',
    icon: 'calendar' as const,
    href: '#planner-completo',
  },
  {
    id: 'cuidar-de-mim',
    label: 'Cuidar de mim hoje',
    description: 'Um atalho para o seu autocuidado.',
    icon: 'heart' as const,
    href: '/cuidar/autocuidado-inteligente?from=meu-dia',
  },
  {
    id: 'lembretes',
    label: 'Lembretes rápidos',
    description: 'Anote o que não pode esquecer.',
    icon: 'note' as const,
    href: '#planner-completo',
  },
]

export function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

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

  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
  }, [])

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
        <div className="space-y-8 md:space-y-10 pb-24">
          {/* BLOCO: SAUDAÇÃO + HUMOR + INTENÇÃO */}
          <Reveal delay={0}>
            <section>
              <div className="space-y-6 rounded-3xl bg-white/80 border border-[#FFD8E6] shadow-card px-4 py-5 md:px-5 md:py-6">
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

          {/* CARD RESUMO DO PLANNER */}
          <Reveal delay={80}>
            <SoftCard className="relative overflow-hidden rounded-3xl bg-white/90 border border-[#FFE8F2] p-6 md:p-7 shadow-card">
              <div className="pointer-events-none absolute -top-10 -left-12 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.18)] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.18)] blur-3xl" />

              <div className="relative z-10 space-y-3 md:space-y-4">
                <p className="text-[11px] md:text-xs font-semibold tracking-[0.2em] uppercase text-[#FF1475]">
                  Seu Planner de hoje
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#2F3A56] leading-snug">
                  Veja seu dia em um único lugar
                </h3>
                <p className="text-xs md:text-sm text-[#545454] max-w-xl">
                  Aqui você reúne prioridades, compromissos e lembretes. Um
                  espaço pra tirar o peso da cabeça e colocar tudo no papel,
                  com leveza.
                </p>

                <div className="mt-3">
                  <Link
                    href="#planner-completo"
                    onClick={() =>
                      track('meu-dia.planner_overview_click', {
                        source: 'overview-card',
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#FF1475] hover:opacity-90 transition-all"
                  >
                    <span>Abrir Planner completo</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* GRID 2x2 — WIDGETS DO DIA */}
          <Reveal delay={120}>
            <section aria-label="Atalhos do seu dia">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {QUICK_WIDGETS.map((widget) => (
                  <Link
                    key={widget.id}
                    href={widget.href}
                    onClick={() =>
                      track('meu-dia.widget_click', {
                        widgetId: widget.id,
                      })
                    }
                    className="group relative overflow-hidden rounded-3xl bg-white/85 border border-[#FFE8F2] px-3 py-3 md:px-4 md:py-4 shadow-[0_10px_26px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)]"
                  >
                    <div className="absolute -top-8 -right-8 h-16 w-16 rounded-full bg-[rgba(255,20,117,0.08)] blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="inline-flex items-center justify-between gap-2">
                        <AppIcon
                          name={widget.icon}
                          className="h-5 w-5 md:h-6 md:w-6 text-[#FF1475] group-hover:scale-110 transition-transform duration-150"
                          decorative
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] md:text-sm font-semibold text-[#2F3A56] leading-snug">
                          {widget.label}
                        </p>
                        <p className="text-[10px] md:text-[11px] text-[#6A6A6A] leading-snug">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>

          {/* PLANNER COMPLETO */}
          <Reveal delay={180}>
            <section id="planner-completo" aria-label="Planner completo do dia">
              <SoftCard className="relative overflow-hidden rounded-3xl bg-white/95 border border-[#FFD8E6] p-6 md:p-8 shadow-card space-y-6 md:space-y-8">
                <header className="space-y-1">
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF1475]">
                    Planejar o seu dia
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                    Organize prioridades, compromissos e lembretes
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454] max-w-xl">
                    Use este espaço para definir o que é essencial hoje. Um
                    passo de cada vez já faz muita diferença.
                  </p>
                </header>

                <Reveal delay={200}>
                  <DailyPriorities />
                </Reveal>

                <Reveal delay={240}>
                  <IntelligentSuggestionsSection
                    mood={selectedMood}
                    intention={selectedDay}
                  />
                </Reveal>

                <Reveal delay={280}>
                  <WeeklyPlannerShell />
                </Reveal>
              </SoftCard>
            </section>
          </Reveal>

          <MotivationalFooter routeKey="meu-dia" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}

export default MeuDiaClient
