'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'

export default function MinhaJornadaPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [timelineNotes, setTimelineNotes] = useState<Record<string, { humor?: string; energia?: string; nota?: string }>>({})

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const timelineKey = 'minha-jornada:timeline'
    const saved = load(timelineKey)
    if (typeof saved === 'object' && saved !== null) {
      setTimelineNotes(saved as Record<string, { humor?: string; energia?: string; nota?: string }>)
    }
  }, [isHydrated])

  const generateTimeline = () => {
    const days = []
    for (let i = 9; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days.push(dateStr)
    }
    return days
  }

  const timelineDays = generateTimeline()
  const humorEmojis: Record<string, string> = {
    'Muito bem': '😄',
    'Bem': '🙂',
    'Neutro': '😐',
    'Cansada': '😔',
    'Exausta': '😴',
  }

  return (
    <PageTemplate
      label="EU360"
      title="Minha Jornada"
      subtitle="Acompanhe sua evolução e os momentos especiais da sua maternidade."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* BLOCK 1 — Linha do Tempo da Mãe */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Sua Linha do Tempo
                </h3>
                <p className="text-sm text-[#545454]">
                  Veja como você evoluiu ao longo dos dias.
                </p>
              </div>

              {/* Horizontal Timeline */}
              <div className="mb-6 overflow-x-auto pb-3">
                <div className="flex gap-3 min-w-max md:flex-wrap md:gap-4">
                  {timelineDays.map((dateStr) => {
                    const dateObj = new Date(dateStr + 'T00:00:00')
                    const dayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][dateObj.getDay()]
                    const dayOfMonth = dateObj.getDate()
                    const entry = timelineNotes[dateStr] || {}

                    return (
                      <div
                        key={dateStr}
                        className="flex-shrink-0 w-20 rounded-2xl bg-white/60 border border-white/40 p-3 text-center hover:bg-white/80 transition-all duration-200 cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-[#2f3a56] mb-2">
                          {dayOfWeek} {dayOfMonth}
                        </p>
                        {entry.humor && (
                          <p className="text-lg mb-1">
                            {humorEmojis[entry.humor] || '😊'}
                          </p>
                        )}
                        {entry.energia && (
                          <p className="text-xs text-[#545454]">
                            {entry.energia === 'Alta' && '⚡'}
                            {entry.energia === 'Média' && '🔋'}
                            {entry.energia === 'Baixa' && '😴'}
                          </p>
                        )}
                        {entry.nota && (
                          <p className="text-xs text-primary font-medium mt-1 truncate">
                            {entry.nota}
                          </p>
                        )}
                        {!entry.humor && !entry.energia && !entry.nota && (
                          <p className="text-xs text-[#545454]">—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Helper Text */}
              <div className="rounded-2xl bg-[#FFE5EF]/40 p-3 text-sm text-[#545454]">
                Tudo o que você registra ajuda você a ver sua própria evolução.
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Linha do Tempo da Criança */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  A Jornada do Seu Filho
                </h3>
                <p className="text-sm text-[#545454]">
                  Acompanhe os marcos e momentos especiais.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Marcos do Desenvolvimento',
                    description: 'Crescimento, descobertas e avanços.',
                  },
                  {
                    title: 'Momentos Importantes',
                    description: 'Registre algo especial que aconteceu.',
                  },
                  {
                    title: 'Notas do Dia da Criança',
                    description: 'O que chamou atenção hoje?',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#545454]">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary ml-3">→</span>
                  </div>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Insights da Semana (IA Placeholder) */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Insights da Semana
                </h3>
                <p className="text-sm text-[#545454]">
                  Padrões e descobertas que ajudam no seu dia a dia.
                </p>
              </div>

              {/* Insight Placeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-[#FFE5EF]/40 p-4">
                  <p className="text-xs text-[#545454] font-medium mb-2">
                    Seu padrão da semana
                  </p>
                  <p className="text-sm font-semibold text-[#2f3a56]">
                    — (placeholder)
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FFE5EF]/40 p-4">
                  <p className="text-xs text-[#545454] font-medium mb-2">
                    Quando você esteve melhor
                  </p>
                  <p className="text-sm font-semibold text-[#2f3a56]">
                    — (placeholder)
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FFE5EF]/40 p-4">
                  <p className="text-xs text-[#545454] font-medium mb-2">
                    Principais desafios
                  </p>
                  <p className="text-sm font-semibold text-[#2f3a56]">
                    — (placeholder)
                  </p>
                </div>
              </div>

              {/* Emotional Trend Placeholder */}
              <div className="mb-6 p-6 rounded-2xl bg-[#FFE5EF]/40 flex items-center justify-center h-40">
                <div className="text-center">
                  <AppIcon
                    name="chart"
                    size={32}
                    className="text-primary/40 mx-auto mb-2"
                    decorative
                  />
                  <p className="text-sm text-[#545454]">
                    Gráfico de tendências da semana
                  </p>
                </div>
              </div>

              {/* IA Note */}
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#FFE5EF]/40 to-white p-4">
                <h4 className="text-sm font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                  <AppIcon name="idea" size={16} className="text-primary" decorative />
                  Em breve
                </h4>
                <p className="text-sm text-[#545454]">
                  Em breve, você verá análises inteligentes sobre sua evolução.
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Conquistas & Memórias */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Conquistas e Memórias
                </h3>
                <p className="text-sm text-[#545454]">
                  Celebre as pequenas vitórias e momentos afetivos.
                </p>
              </div>

              <div className="space-y-4">
                {/* Minhas Conquistas Recentes */}
                <div className="rounded-2xl border border-white/40 bg-white/60 p-4">
                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                    Minhas Conquistas Recentes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['🏆', '⭐', '💪', '🎯'].map((emoji, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] flex items-center justify-center text-lg"
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#545454] mt-3">
                    Registre suas pequenas vitórias aqui.
                  </p>
                </div>

                {/* Memórias da Semana */}
                <div className="rounded-2xl border border-white/40 bg-white/60 p-4">
                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                    Memórias da Semana
                  </h4>
                  <div className="space-y-2">
                    {['Momento 1', 'Momento 2', 'Momento 3'].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/50"
                      >
                        <span className="text-primary text-lg">💝</span>
                        <p className="text-sm text-[#545454]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* O que quero lembrar */}
                <div className="rounded-2xl border border-white/40 bg-white/60 p-4">
                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                    O que quero lembrar
                  </h4>
                  <textarea
                    placeholder="Escreva algo que você não quer esquecer…"
                    className="w-full min-h-[80px] rounded-xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
