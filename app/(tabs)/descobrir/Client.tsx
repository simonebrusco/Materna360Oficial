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
  { emoji: '📖', title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exup��ry' },
]

const toys = [
  { emoji: '🧩', title: 'Quebra-Cabeças', age: '2+' },
  { emoji: '🪀', title: 'Brinquedos de Corda', age: '3+' },
  { emoji: '🧸', title: 'Pelúcias Educativas', age: '0+' },
  { emoji: '🚂', title: 'Trem de Brinquedo', age: '2+' },
]

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
  const [ageFilter, setAgeFilter] = useState<string>(initialAgeFilter)
  const [placeFilter, setPlaceFilter] = useState<string>(initialPlaceFilter)

  const impressionsKeyRef = useRef<string | null>(null)
  const flashRoutineImpressionRef = useRef<string | null>(null)
  const selfCareImpressionRef = useRef<string | null>(null)

  const discoverFlags = useMemo(() => getClientFlags(flags), [flags])

  const recShelfEnabled = discoverFlags.recShelf && recShelf.enabled
  const flashRoutineEnabled = discoverFlags.flashRoutine && flashRoutine.enabled
  const selfCareEnabled = discoverFlags.selfCare && selfCare.enabled

  const profileMode = profile.mode
  const targetBuckets = profile.children.map((c) => c.age_bucket)

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
      if (placeFilter && suggestion.location !== placeFilter) {
        return false
      }
      return true
    })
  }, [suggestions, ageFilter, placeFilter])

  return (
    <div className="w-full space-y-6 py-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <SectionBoundary title="Ideias Rápidas">
        <SectionWrapper>
          <GridRhythm>
            {filteredSuggestions.map((suggestion) => (
              <Reveal key={suggestion.id}>
                <Card className="flex flex-col gap-4 p-4">
                  <div>
                    <h3 className="font-semibold text-support-1">{suggestion.title}</h3>
                    <p className="text-sm text-support-2/80">{suggestion.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStart(suggestion.id)}
                    >
                      <Play className="h-4 w-4" />
                      Começar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSaveToPlanner(suggestion)}
                      disabled={savingIdeaId === suggestion.id}
                    >
                      {savingIdeaId === suggestion.id ? 'Salvando…' : 'Salvar'}
                    </Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </GridRhythm>
        </SectionWrapper>
      </SectionBoundary>

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

      {selfCareEnabled && selfCare.items.length > 0 && (
        <SectionBoundary title="Para Você">
          <Reveal>
            <SectionWrapper>
              <div className="grid gap-4 md:grid-cols-2">
                {selfCare.items.map((item) => (
                  <Card key={item.id} className="flex flex-col gap-4 p-4">
                    <div>
                      <h3 className="font-semibold text-support-1">{item.title}</h3>
                      <p className="text-xs text-support-2">{selfCare.minutes} minutos</p>
                    </div>
                    {item.steps && item.steps.length > 0 && (
                      <ul className="space-y-1 text-xs text-support-2">
                        {item.steps.slice(0, 2).map((step, idx) => (
                          <li key={idx}>• {step}</li>
                        ))}
                      </ul>
                    )}
                    <Button size="sm" variant="outline">Fiz agora</Button>
                  </Card>
                ))}
              </div>
            </SectionWrapper>
          </Reveal>
        </SectionBoundary>
      )}
    </div>
  )
}
