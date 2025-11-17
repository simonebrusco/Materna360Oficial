'use client'

import { useState, useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { MoodQuickSelector } from '@/components/blocks/MoodQuickSelector'
import { MoodSparkline } from '@/components/blocks/MoodSparkline'
import { CheckInCard } from '@/components/blocks/CheckInCard'
import { EmotionalDiary } from '@/components/blocks/EmotionalDiary'
import { WeeklyEmotionalSummary } from '@/app/(tabs)/eu360/components/WeeklyEmotionalSummary'
import WeeklyInsights from '@/components/insights/WeeklyInsights'
import CoachSuggestionCard from '@/components/coach/CoachSuggestionCard'
import { useProfile } from '@/app/hooks/useProfile'
import { generateCoachSuggestion } from '@/app/lib/coachMaterno.client'
import { isEnabled } from '@/app/lib/flags.client'
import { ClientOnly } from '@/components/common/ClientOnly'
import { trackTelemetry } from '@/app/lib/telemetry'
import { save, load } from '@/app/lib/persist'

interface EmotionalCard {
  id: string
  icon: string
  title: string
  subtitle: string
}

const EMOTIONAL_CARDS: EmotionalCard[] = [
  {
    id: 'humor-diario',
    icon: 'smile',
    title: 'Humor Diário',
    subtitle: 'Como você está se sentindo hoje?',
  },
  {
    id: 'intensidade-emocional',
    icon: 'heart',
    title: 'Intensidade Emocional',
    subtitle: 'Identifique a força da sua emoção.',
  },
  {
    id: 'niveis-energia',
    icon: 'zap',
    title: 'Níveis de Energia',
    subtitle: 'Observe sua energia ao longo do dia.',
  },
  {
    id: 'humor-semana',
    icon: 'chart-line',
    title: 'Humor da Semana',
    subtitle: 'Seu padrão emocional nos últimos dias.',
  },
  {
    id: 'checkin-rapido',
    icon: 'circle',
    title: 'Check-in Rápido',
    subtitle: 'Um momento para respirar e perceber.',
  },
  {
    id: 'diario-emocional',
    icon: 'book-open',
    title: 'Diário Emocional',
    subtitle: 'Um espaço seguro para expressar seus sentimentos.',
  },
  {
    id: 'gratidao',
    icon: 'heart',
    title: 'Gratidão',
    subtitle: 'Pequenos momentos que iluminam o dia.',
  },
  {
    id: 'coach-sugestao',
    icon: 'sparkles',
    title: 'Sugestão do Coach',
    subtitle: 'Um lembrete gentil para seu bem-estar.',
  },
  {
    id: 'insights-emocionais',
    icon: 'lightbulb',
    title: 'Insights Emocionais',
    subtitle: 'O que seus registros revelam.',
  },
  {
    id: 'resumo-semana',
    icon: 'calendar',
    title: 'Resumo Emocional da Semana',
    subtitle: 'Veja sua evolução emocional de forma clara.',
  },
]

export default function ComoEstouHojePage() {
  const { name } = useProfile()
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [gratitude, setGratitude] = useState('')
  const [gratitudes, setGratitudes] = useState<string[]>([])
  const [energyLevel, setEnergyLevel] = useState<number>(3)

  useEffect(() => {
    const savedGratitudes = load<string[]>('eu360:gratitudes', [])
    if (Array.isArray(savedGratitudes)) {
      setGratitudes(savedGratitudes)
    }

    const savedEnergy = load<number>('meu-dia:energy-level', 3)
    if (typeof savedEnergy === 'number') {
      setEnergyLevel(savedEnergy)
    }
  }, [])

  const handleAddGratitude = () => {
    if (!gratitude.trim()) return

    const updated = [gratitude, ...gratitudes]
    setGratitudes(updated)
    setGratitude('')

    save('eu360:gratitudes', updated)

    try {
      trackTelemetry('gratitude.added', {
        tab: 'como-estou-hoje',
      })
    } catch {}
  }

  const handleEnergyChange = (value: number) => {
    setEnergyLevel(value)
    save('meu-dia:energy-level', value)

    try {
      trackTelemetry('energy.level_changed', {
        tab: 'como-estou-hoje',
        value,
      })
    } catch {}
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Escute seu corpo, suas emoções e o seu ritmo."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl">
        {EMOTIONAL_CARDS.map((card, index) => (
          <Reveal key={card.id} delay={index * 50}>
            <SoftCard
              className={`rounded-3xl p-5 sm:p-6 flex flex-col h-full cursor-pointer transition-all duration-200 ${
                expandedCard === card.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'
              }`}
              onClick={() => toggleCard(card.id)}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] flex items-center justify-center">
                  <AppIcon
                    name={card.icon as any}
                    size={24}
                    className="text-primary"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#2f3a56] mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#545454]">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              {/* Expand/Collapse Indicator */}
              <div className="flex justify-end mt-auto">
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                  {expandedCard === card.id ? 'Fechar' : 'Acessar'}{' '}
                  <AppIcon
                    name={expandedCard === card.id ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    decorative
                  />
                </span>
              </div>

              {/* Expanded Content */}
              {expandedCard === card.id && (
                <div className="mt-6 pt-6 border-t border-white/60 space-y-4" onClick={(e) => e.stopPropagation()}>
                  {card.id === 'humor-diario' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Selecione seu humor atual
                      </p>
                      <MoodQuickSelector />
                    </div>
                  )}

                  {card.id === 'intensidade-emocional' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Qual é a intensidade da sua emoção?
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#545454]">Leve</span>
                          <span className="text-xs text-[#545454]">Intensa</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          defaultValue="2"
                          className="w-full h-2 bg-[#FFD8E6] rounded-full appearance-none cursor-pointer accent-primary"
                          aria-label="Intensidade emocional"
                        />
                        <p className="text-xs text-[#545454] italic">
                          Use este espaço para medir como você se sente de forma mais objetiva.
                        </p>
                      </div>
                    </div>
                  )}

                  {card.id === 'niveis-energia' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Como está sua energia agora?
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#545454]">Esgotada</span>
                          <span className="text-xs text-[#545454]">Recarregada</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={energyLevel}
                          onChange={(e) => handleEnergyChange(Number(e.target.value))}
                          className="w-full h-2 bg-[#FFD8E6] rounded-full appearance-none cursor-pointer accent-primary"
                          aria-label="Níveis de energia"
                        />
                        <div className="flex gap-2 mt-2">
                          {[0, 1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              onClick={() => handleEnergyChange(level)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                energyLevel === level
                                  ? 'bg-primary text-white'
                                  : 'bg-[#FFE5EF] text-[#2f3a56] hover:bg-[#FFD8E6]'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {card.id === 'humor-semana' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Padrão de humor na semana
                      </p>
                      <MoodSparkline />
                    </div>
                  )}

                  {card.id === 'checkin-rapido' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Faça um check-in rápido
                      </p>
                      <div onClick={(e) => e.stopPropagation()}>
                        <CheckInCard />
                      </div>
                    </div>
                  )}

                  {card.id === 'diario-emocional' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Expresse seus sentimentos
                      </p>
                      <div onClick={(e) => e.stopPropagation()}>
                        <EmotionalDiary />
                      </div>
                    </div>
                  )}

                  {card.id === 'gratidao' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Registre suas gratidões
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={gratitude}
                          onChange={(e) => setGratitude(e.target.value)}
                          placeholder="Pelo que você é grata hoje?"
                          className="flex-1 rounded-full border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#2f3a56] shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddGratitude()}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleAddGratitude}
                          className="sm:w-auto"
                        >
                          ＋ Adicionar
                        </Button>
                      </div>
                      {gratitudes.length > 0 ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {gratitudes.map((item, idx) => (
                            <div
                              key={`${item}-${idx}`}
                              className="rounded-2xl bg-[#FFE5EF]/60 p-3 text-sm text-[#2f3a56] shadow-soft"
                            >
                              &quot;{item}&quot;
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#545454]">
                          Comece a registrar suas gratidões do dia!
                        </p>
                      )}
                    </div>
                  )}

                  {card.id === 'coach-sugestao' && (
                    <ClientOnly>
                      {isEnabled('FF_COACH_V1') && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CoachSuggestionCard
                            resolve={() =>
                              Promise.resolve(generateCoachSuggestion())
                            }
                            onView={(id: string) => {
                              try {
                                trackTelemetry('coach.card_view', {
                                  id,
                                  tab: 'como-estou-hoje',
                                })
                              } catch {}
                            }}
                            onApply={(id: string) => {
                              try {
                                trackTelemetry('coach.suggestion_apply', {
                                  id,
                                  tab: 'como-estou-hoje',
                                })
                              } catch {}
                            }}
                            onSave={(id: string) => {
                              try {
                                trackTelemetry('coach.save_for_later', {
                                  id,
                                  tab: 'como-estou-hoje',
                                })
                              } catch {}
                            }}
                            onWhyOpen={(id: string) => {
                              try {
                                trackTelemetry('coach.why_seen_open', {
                                  id,
                                  tab: 'como-estou-hoje',
                                })
                              } catch {}
                            }}
                          />
                        </div>
                      )}
                    </ClientOnly>
                  )}

                  {card.id === 'insights-emocionais' && (
                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm text-[#545454] font-medium">
                        Revelações dos seus registros
                      </p>
                      <WeeklyInsights />
                    </div>
                  )}

                  {card.id === 'resumo-semana' && (
                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm text-[#545454] font-medium">
                        Sua evolução emocional
                      </p>
                      <WeeklyEmotionalSummary />
                    </div>
                  )}
                </div>
              )}
            </SoftCard>
          </Reveal>
        ))}
      </div>
    </PageTemplate>
  )
}
