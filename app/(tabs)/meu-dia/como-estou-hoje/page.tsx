'use client'

import { useState, useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { MoodQuickSelector } from '@/components/blocks/MoodQuickSelector'
import { MoodSparkline } from '@/components/blocks/MoodSparkline'
import { ClientOnly } from '@/components/common/ClientOnly'
import { trackTelemetry } from '@/app/lib/telemetry'
import { save, load } from '@/app/lib/persist'

interface EmotionalCard {
  id: string
  icon: string
  title: string
  subtitle: string
  cta: string
}

const EMOTIONAL_CARDS: EmotionalCard[] = [
  {
    id: 'checkin-rapido',
    icon: 'circle-check',
    title: 'Check-in Rápido',
    subtitle: 'Como você está se sentindo agora?',
    cta: 'Registrar →',
  },
  {
    id: 'humor-semana',
    icon: 'chart-line',
    title: 'Humor da Semana',
    subtitle: 'Veja seus padrões emocionais ao longo dos dias.',
    cta: 'Ver resumo →',
  },
  {
    id: 'niveis-energia',
    icon: 'zap',
    title: 'Níveis de Energia',
    subtitle: 'Está esgotada, tranquila ou recarregada?',
    cta: 'Registrar →',
  },
  {
    id: 'notas-dia',
    icon: 'book-open',
    title: 'Notas do Dia',
    subtitle: 'Desabafe ou registre algo importante.',
    cta: 'Escrever →',
  },
]

export default function ComoEstouHojePage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [notes, setNotes] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    const savedEnergy = load<number>('meu-dia:energy-level', 3)
    if (typeof savedEnergy === 'number') {
      setEnergyLevel(savedEnergy)
    }

    const savedNotes = load<string>('meu-dia:notes', '')
    if (typeof savedNotes === 'string') {
      setNotes(savedNotes)
    }
  }, [])

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

  const handleNotesChange = (value: string) => {
    setNotes(value)
    save('meu-dia:notes', value)
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
    try {
      trackTelemetry('como_estou_hoje.card_toggled', {
        cardId,
        expanded: expandedCard !== cardId,
      })
    } catch {}
  }

  if (!isHydrated) {
    return (
      <PageTemplate
        label="MEU DIA"
        title="Como Estou Hoje"
        subtitle="Escute o que o seu corpo e seu coração estão dizendo."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl">
          {EMOTIONAL_CARDS.map(() => (
            <div className="rounded-3xl p-5 sm:p-6 bg-white/50 h-40 animate-pulse" />
          ))}
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Escute o que o seu corpo e seu coração estão dizendo."
    >
      <ClientOnly>
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
                    <p className="text-sm text-[#545454]">{card.subtitle}</p>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex justify-end mt-auto">
                  <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                    {card.cta}
                  </span>
                </div>

                {/* Expanded Content */}
                {expandedCard === card.id && (
                  <div
                    className="mt-6 pt-6 border-t border-white/60 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {card.id === 'checkin-rapido' && (
                      <div className="space-y-4">
                        <p className="text-sm text-[#545454] font-medium">
                          Selecione seu humor atual
                        </p>
                        <MoodQuickSelector />
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

                    {card.id === 'niveis-energia' && (
                      <div className="space-y-4">
                        <p className="text-sm text-[#545454] font-medium">
                          Como está sua energia agora?
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#545454]">
                              Esgotada
                            </span>
                            <span className="text-xs text-[#545454]">
                              Recarregada
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={energyLevel}
                            onChange={(e) =>
                              handleEnergyChange(Number(e.target.value))
                            }
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

                    {card.id === 'notas-dia' && (
                      <div className="space-y-4">
                        <p className="text-sm text-[#545454] font-medium">
                          Deixe sua nota
                        </p>
                        <div className="space-y-3">
                          <textarea
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Escreva seus pensamentos, sentimentos ou o que for importante para você hoje..."
                            className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#2f3a56] shadow-soft placeholder-[#999] focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                            rows={4}
                          />
                          <p className="text-xs text-[#999]">
                            Seus registros são privados e seguros.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </SoftCard>
            </Reveal>
          ))}
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
