'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Play, ShoppingBag } from 'lucide-react'

import SectionBoundary from '@/components/common/SectionBoundary'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import GridRhythm from '@/components/common/GridRhythm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'

import { trackTelemetry, sample } from '@/app/lib/telemetry'

import {
  friendlyEnergyLabel,
  friendlyLocationLabel,
} from '@/app/lib/quickIdeasCatalog'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'
import type { RecShelfGroup } from '@/app/lib/recShelf'
import type { RecProductKind } from '@/app/types/recProducts'
import type { SelfCareEnergy } from '@/app/types/selfCare'
import type { ProfileChildSummary } from '@/app/lib/profileTypes'
import { getClientFlags, type DiscoverFlags } from '@/app/lib/flags'
import type { FlashRoutineT, ProfileSummaryT, SelfCareT } from '@/app/lib/discoverSchemas'

type ToastState = {
  message: string
  type: 'success' | 'error' | 'info'
}

type SuggestionCard = QuickIdea & {
  child?: ProfileChildSummary
}

type RecShelfState = {
  enabled: boolean
  groups: RecShelfGroup[]
}

type FlashRoutineState = {
  enabled: boolean
  aiEnabled: boolean
  routine: FlashRoutineT | null
  strategy: 'cms' | 'composed' | 'fallback' | null
  analyticsSource: 'local' | 'ai'
}

type SelfCareState = {
  enabled: boolean
  aiEnabled: boolean
  items: SelfCareT[]
  energy: SelfCareEnergy
  minutes: 2 | 5 | 10
}

const books = [
  { emoji: '📖', title: 'O Menino do Pijama Listrado', author: 'John Boyne' },
  { emoji: '📖', title: "Charlotte's Web", author: 'E.B. White' },
  { emoji: '📖', title: 'As Aventuras de Pinóquio', author: 'Carlo Collodi' },
  { emoji: '📖', title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exupéry' },
]

const toys = [
  { emoji: '🧩', title: 'Quebra-Cabeças', age: '2+' },
  { emoji: '🪀', title: 'Brinquedos de Corda', age: '3+' },
  { emoji: '🧸', title: 'Pelúcias Educativas', age: '0+' },
  { emoji: '🚂', title: 'Trem de Brinquedo', age: '2+' },
]

const badgeLabels: Record<string, string> = {
  curta: 'Curta',
  sem_bagunça: 'Sem bagunça',
  ao_ar_livre: 'Ao ar livre',
  motor_fino: 'Motor fino',
  motor_grosso: 'Motor grosso',
  linguagem: 'Linguagem',
  sensorial: 'Sensorial',
}

const badgeClassName = 'inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'

type DescobrirClientProps = {
  suggestions: SuggestionCard[]
  filters: {
    location: QuickIdeasLocation
    energy: QuickIdeasEnergy
    time_window_min: QuickIdeasTimeWindow
  }
  dateKey: string
  profile: ProfileSummaryT
  initialAgeFilter: QuickIdeasAgeBucket
  initialPlaceFilter: string
  recShelf: RecShelfState
  flashRoutine: FlashRoutineState
  selfCare: SelfCareState
  flags: DiscoverFlags
}

export default function DescobrirClient({
  suggestions,
  filters,
  dateKey,
  profile,
  initialAgeFilter,
  initialPlaceFilter,
  recShelf,
  flashRoutine,
  selfCare,
  flags,
}: DescobrirClientProps) {
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [ageFilter, setAgeFilter] = useState<QuickIdeasAgeBucket | null>(initialAgeFilter)
  const [placeFilter, setPlaceFilter] = useState<string | null>(initialPlaceFilter)
  const [showActivities, setShowActivities] = useState(false)

  const impressionsKeyRef = useRef<string | null>(null)
  const flashRoutineImpressionRef = useRef<string | null>(null)
  const selfCareImpressionRef = useRef<string | null>(null)

  const discoverFlags = useMemo(() => getClientFlags(flags), [flags])

  const recShelfEnabled = discoverFlags.recShelf && recShelf.enabled
  const flashRoutineEnabled = discoverFlags.flashRoutine && flashRoutine.enabled
  const selfCareEnabled = discoverFlags.selfCare && selfCare.enabled

  const profileMode = profile.mode
  const targetBuckets = profile.children.map((c) => c.age_bucket)

  const friendlyFilters = useMemo(() => {
    const parts: string[] = []
    if (ageFilter) parts.push(`${ageFilter} anos`)
    if (placeFilter) parts.push(placeFilter)
    return parts.length > 0 ? parts.join(' • ') : 'nenhum'
  }, [ageFilter, placeFilter])

  // Track rec shelf impressions
  useEffect(() => {
    if (!recShelfEnabled || recShelf.groups.length === 0) {
      return
    }
    if (impressionsKeyRef.current === recShelf.groups.map(g => `${g.kind}:${g.items.length}`).join('|')) {
      return
    }
    impressionsKeyRef.current = recShelf.groups.map(g => `${g.kind}:${g.items.length}`).join('|')
    
    if (!sample(0.2)) {
      return
    }
    
    const kinds = recShelf.groups.map((group) => group.kind).slice(0, 4)
    trackTelemetry(
      'discover_rec_impression',
      {
        shelves: recShelf.groups.length,
        ageBuckets: targetBuckets,
        kinds,
      }
    )
  }, [recShelfEnabled, recShelf.groups])

  // Track flash routine impressions
  useEffect(() => {
    if (!flashRoutineEnabled || !flashRoutine.routine) {
      return
    }
    
    const key = `${dateKey}::${flashRoutine.routine.id}::${flashRoutine.analyticsSource}`
    if (flashRoutineImpressionRef.current === key) {
      return
    }
    
    flashRoutineImpressionRef.current = key
    if (!sample(0.2)) {
      return
    }
    
    trackTelemetry(
      'discover_flash_impression',
      {
        routineId: flashRoutine.routine.id,
        source: flashRoutine.analyticsSource,
      }
    )
  }, [flashRoutineEnabled, flashRoutine.routine, flashRoutine.analyticsSource, dateKey])

  // Track self care impressions
  useEffect(() => {
    if (!selfCareEnabled || selfCare.items.length === 0) {
      return
    }
    
    const key = selfCare.items.map((item) => item.id).join('|')
    if (selfCareImpressionRef.current === key) {
      return
    }
    
    selfCareImpressionRef.current = key
    if (!sample(0.2)) {
      return
    }
    
    trackTelemetry(
      'discover_selfcare_impression',
      {
        count: selfCare.items.length,
        minutes: selfCare.minutes,
        energy: selfCare.energy,
      }
    )
  }, [selfCareEnabled, selfCare.items, selfCare.minutes, selfCare.energy])

  const handleStart = (id: string) => {
    setExpandedIdeaId((current) => (current === id ? null : id))
  }

  const handleSaveToPlanner = async (suggestion: SuggestionCard) => {
    setSavingIdeaId(suggestion.id)
    try {
      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Ideia: ${suggestion.title}`,
          dateISO: dateKey,
          timeISO: '15:00',
          category: 'Lanche',
          link: '/descobrir',
          payload: {
            type: 'idea',
            id: suggestion.id,
            title: suggestion.title,
            duration_min: suggestion.time_total_min ?? 5,
            materials: suggestion.materials || [],
          },
          tags: ['atividade', 'quick-idea', suggestion.location],
        }),
      })

      if (!response.ok) {
        throw new Error('Não foi possível salvar no Planner.')
      }

      trackTelemetry('planner_save_ok', { type: 'idea', id: suggestion.id })
      setToast({ message: 'Sugestão salva no Planner!', type: 'success' })
    } catch (error) {
      console.error('[Descobrir] Planner save failed:', error)
      trackTelemetry(
        'discover_section_error',
        {
          section: 'ideas',
          reason: error instanceof Error ? error.message : 'unknown',
        }
      )
      setToast({
        message: error instanceof Error ? error.message : 'Erro ao salvar no Planner.',
        type: 'error',
      })
    } finally {
      setSavingIdeaId(null)
    }
  }

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((suggestion) => {
      if (ageFilter && suggestion.child?.age_bucket !== ageFilter) {
        return false
      }
      if (placeFilter && suggestion.location !== placeFilter.toLowerCase().replace(' ', '_').replace('á', 'a')) {
        return false
      }
      return true
    })
  }, [suggestions, ageFilter, placeFilter])

  return (
    <main className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 pb-28 sm:px-6 md:px-8 md:pb-32">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Reveal>
        <SectionWrapper
          title={<span className="inline-flex items-center gap-2">🎨<span>Descobrir</span></span>}
        >
          <p className="text-sm text-support-2 md:text-base">
            Explorando ideias personalizadas para cada momento do dia.
          </p>
        </SectionWrapper>
      </Reveal>

      <Reveal delay={80}>
        <SectionWrapper
          title={<span className="inline-flex items-center gap-2">🔍<span>Filtros Inteligentes</span></span>}
          description="Combine idade e local para criar experiências personalizadas em segundos."
        >
          <Card className="p-7">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Idade</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['0-1', '2-3', '4-5', '6-7', '8+'] as QuickIdeasAgeBucket[]).map((age) => {
                    const isActive = ageFilter === age
                    return (
                      <button
                        key={age}
                        onClick={() => setAgeFilter(isActive ? null : age)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-gentle ${
                          isActive
                            ? 'bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                            : 'bg-white/80 text-support-1 shadow-soft hover:shadow-elevated'
                        }`}
                      >
                        {age} anos
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Local</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Casa', 'Parque', 'Escola', 'Área Externa'].map((place) => {
                    const isActive = placeFilter === place
                    return (
                      <button
                        key={place}
                        onClick={() => setPlaceFilter(isActive ? null : place)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-gentle ${
                          isActive
                            ? 'bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                            : 'bg-white/80 text-support-1 shadow-soft hover:shadow-elevated'
                        }`}
                      >
                        {place}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="primary" onClick={() => setShowActivities(true)} className="flex-1 sm:flex-none">
                ✨ Gerar Ideias
              </Button>
              {(ageFilter || placeFilter || showActivities) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setAgeFilter(null)
                    setPlaceFilter(null)
                    setShowActivities(false)
                  }}
                  className="sm:w-auto"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>
        </SectionWrapper>
      </Reveal>

      <Reveal delay={200}>
        <SectionWrapper title={<span className="inline-flex items-center gap-2">🌟<span>Sugestão do Dia</span></span>}>
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            Filtros ativos: {friendlyFilters}
          </div>
          <div className="flex flex-col gap-4">
            {filteredSuggestions.length === 0 ? (
              <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary/12 via-white/90 to-white p-7">
                <p className="text-sm text-support-2 md:text-base">
                  Ainda não temos sugestões para estes filtros. Ajuste as preferências para descobrir novas ideias.
                </p>
              </Card>
            ) : (
              filteredSuggestions.map((suggestion, index) => (
                <Reveal key={suggestion.id} delay={index * 60}>
                  <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary/12 via-white/90 to-white p-7 md:flex-row">
                    <div className="text-5xl" aria-hidden>
                      🌟
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
                          Sugestão personalizada
                          {profileMode === 'all' && suggestion.child
                            ? ` • para ${suggestion.child.name ?? 'Criança'} (${suggestion.child.age_bucket})`
                            : ''}
                        </span>
                        <span className="text-xs text-support-2/80">
                          ⏱ {suggestion.time_total_min} min • {friendlyLocationLabel(suggestion.location)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-support-1 md:text-xl">{suggestion.title}</h3>
                        <p className="text-sm text-support-2 md:text-base">{suggestion.summary}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-support-2/80">
                        {suggestion.badges.slice(0, 2).map((badge) => (
                          <span key={badge} className={badgeClassName}>
                            {badgeLabels[badge] || badge}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" className="sm:w-auto" onClick={() => handleStart(suggestion.id)}>
                          Começar agora
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="sm:w-auto"
                          onClick={() => void handleSaveToPlanner(suggestion)}
                          disabled={savingIdeaId === suggestion.id}
                        >
                          {savingIdeaId === suggestion.id ? 'Salvando…' : 'Salvar no Planner'}
                        </Button>
                      </div>

                      {expandedIdeaId === suggestion.id && (
                        <div className="space-y-4 rounded-2xl border border-white/60 bg-white/92 p-4 shadow-soft">
                          <div>
                            <h4 className="text-sm font-semibold text-support-1">Materiais</h4>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-support-2/90">
                              {suggestion.materials.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-support-1">Passo a passo</h4>
                            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-support-2/90">
                              {suggestion.steps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Reveal>
              ))
            )}
          </div>
        </SectionWrapper>
      </Reveal>

      <SectionWrapper title={<span className="inline-flex items-center gap-2">📚<span>Livros Recomendados</span></span>}>
        <GridRhythm className="grid-cols-1 sm:grid-cols-2">
          {books.map((book, idx) => (
            <Reveal key={book.title} delay={idx * 70} className="h-full">
              <Card className="h-full">
                <div className="text-3xl">{book.emoji}</div>
                <h3 className="mt-3 text-base font-semibold text-support-1">{book.title}</h3>
                <p className="mt-2 text-xs text-support-2 GridRhythm-descriptionClamp">por {book.author}</p>
                <Button variant="primary" size="sm" className="mt-6 w-full">
                  Ver Detalhes
                </Button>
              </Card>
            </Reveal>
          ))}
        </GridRhythm>
      </SectionWrapper>

      <SectionWrapper title={<span className="inline-flex items-center gap-2">🧸<span>Brinquedos Sugeridos</span></span>}>
        <GridRhythm className="grid-cols-1 sm:grid-cols-2">
          {toys.map((toy, idx) => (
            <Reveal key={toy.title} delay={idx * 70} className="h-full">
              <Card className="h-full">
                <div className="text-3xl">{toy.emoji}</div>
                <h3 className="mt-3 text-base font-semibold text-support-1">{toy.title}</h3>
                <p className="mt-2 text-xs text-support-2">A partir de {toy.age}</p>
                <Button variant="primary" size="sm" className="mt-6 w-full">
                  Ver Mais
                </Button>
              </Card>
            </Reveal>
          ))}
        </GridRhythm>
      </SectionWrapper>

      {flashRoutineEnabled && flashRoutine.routine && (
        <SectionBoundary title="Rotina Flash">
          <Reveal>
            <SectionWrapper>
              <Card className="flex flex-col gap-4 p-6">
                <div>
                  <h3 className="text-lg font-semibold">{flashRoutine.routine.title}</h3>
                  <p className="text-sm text-support-2">{flashRoutine.routine.totalMin} minutos</p>
                </div>
                {flashRoutine.routine.steps && flashRoutine.routine.steps.length > 0 && (
                  <ol className="space-y-2 text-sm">
                    {flashRoutine.routine.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-semibold text-primary">{idx + 1}.</span>
                        <span>{typeof step === 'string' ? step : step.title}</span>
                      </li>
                    ))}
                  </ol>
                )}
                <Button variant="primary">Começar Rotina</Button>
              </Card>
            </SectionWrapper>
          </Reveal>
        </SectionBoundary>
      )}

      <Reveal delay={260}>
        <SectionWrapper title={<span className="inline-flex items-center gap-2">💚<span>Para Você</span></span>}>
          <Card className="p-7">
            <GridRhythm className="grid-cols-1 sm:grid-cols-2">
              {['Autocuidado para Mães', 'Mindfulness Infantil', 'Receitas Saudáveis', 'Dicas de Sono'].map((item) => (
                <div key={item}>
                  <Button variant="outline" size="sm" className="w-full">
                    {item}
                  </Button>
                </div>
              ))}
            </GridRhythm>
          </Card>
        </SectionWrapper>
      </Reveal>
    </main>
  )
}
