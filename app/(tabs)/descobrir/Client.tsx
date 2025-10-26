'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Copy, Play, Share2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

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
  QuickIdeasBadge,
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'
import type { RecShelfGroup, RecShelfItem } from '@/app/lib/recShelf'
import type { RecProductKind } from '@/app/types/recProducts'
import type { SelfCareEnergy } from '@/app/types/selfCare'
import type { ProfileChildSummary } from '@/app/lib/profileTypes'
import { getClientFlags, type DiscoverFlags } from '@/app/lib/flags'
import type { FlashRoutineT, ProfileSummaryT, SelfCareT } from '@/app/lib/discoverSchemas'

const activities = [
  { id: 1, emoji: '🎨', title: 'Pintura com Dedos', age: '1-3', place: 'Casa' },
  { id: 2, emoji: '🌳', title: 'Caça ao Tesouro no Parque', age: '4+', place: 'Parque' },
  { id: 3, emoji: '📚', title: 'Leitura em Ciranda', age: '0-7', place: 'Casa' },
  { id: 4, emoji: '⚽', title: 'Jogos no Parquinho', age: '3-7', place: 'Parque' },
  { id: 5, emoji: '🧬', title: 'Experiências Científicas', age: '5+', place: 'Casa' },
  { id: 6, emoji: '🎭', title: 'Coreografia em Família', age: '2-6', place: 'Casa' },
  { id: 7, emoji: '����', title: 'Aula de Culinária', age: '4+', place: 'Escola' },
  { id: 8, emoji: '🏗️', title: 'Construção com Blocos', age: '2-4', place: 'Casa' },
]

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

type ToastState = {
  message: string
  type: 'success' | 'error' | 'info'
}

type SuggestionChild = ProfileChildSummary

type SuggestionCard = QuickIdea & {
  child?: SuggestionChild
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

type RecShelfCardProps = {
  item: RecShelfItem
  profileMode: 'single' | 'all'
  onSave: (item: RecShelfItem) => Promise<void>
  onBuy: (item: RecShelfItem) => void
  savingProductId: string | null
}

type QuickIdeaFiltersSummary = {
  location: QuickIdeasLocation
  time_window_min: QuickIdeasTimeWindow
  energy: QuickIdeasEnergy
}

type DescobrirClientProps = {
  suggestions: SuggestionCard[]
  filters: QuickIdeaFiltersSummary
  dateKey: string
  profile: ProfileSummaryT
  initialAgeFilter?: string | null
  initialPlaceFilter?: string | null
  recShelf: RecShelfState
  flashRoutine: FlashRoutineState
  selfCare: SelfCareState
  flags: DiscoverFlags
}

const badgeLabels: Record<QuickIdeasBadge, string> = {
  curta: 'curta',
  'sem_bagunça': 'sem bagunça',
  ao_ar_livre: 'ao ar livre',
  motor_fino: 'motor fino',
  motor_grosso: 'motor grosso',
  linguagem: 'linguagem',
  sensorial: 'sensorial',
}

const badgeClassName =
  'inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs font-semibold text-support-2/80 shadow-soft'

const bucketLabels: Record<QuickIdeasAgeBucket, string> = {
  '0-1': '0-1 anos',
  '2-3': '2-3 anos',
  '4-5': '4-5 anos',
  '6-7': '6-7 anos',
  '8+': '8+ anos',
}

const shelfLabels: Record<RecProductKind, { icon: string; title: string }> = {
  book: { icon: '📚', title: 'Livros que Inspiram' },
  toy: { icon: '🧸', title: 'Brinquedos Inteligentes' },
  course: { icon: '💻', title: 'Cursos para Aprender Juntos' },
  printable: { icon: '🖨��', title: 'Printables para Brincar' },
}

const sanitizeStringList = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return []
  }
  const seen = new Set<string>()
  return values
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => {
      if (!entry) {
        return false
      }
      const key = entry.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

const coerceIntWithin = (value: unknown, fallback: number, min: number, max?: number): number => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }
  const rounded = Math.round(numeric)
  if (max === undefined) {
    return Math.max(min, rounded)
  }
  return Math.min(Math.max(min, rounded), max)
}

function RecShelfCarouselCard({ item, profileMode, onSave, onBuy, savingProductId }: RecShelfCardProps) {
  const [imageError, setImageError] = useState(false)

  const bucketChips = profileMode === 'all' ? item.matchedBuckets : [item.primaryBucket]
  const criticalFlag = item.safetyFlags?.find((flag) => {
    const normalized = flag.toLowerCase()
    return normalized.includes('peças pequenas') || normalized.includes('engasgo')
  })
  const safetyTooltip = item.safetyFlags?.join(' • ')
  const isSaving = savingProductId === item.id

  return (
    <Card
      role="listitem"
      className="relative flex min-w-[260px] max-w-[260px] snap-start flex-col overflow-hidden bg-white/90 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white shadow-soft">
          Parceria
        </span>
        {criticalFlag && (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-primary shadow-soft"
            title={safetyTooltip}
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Cuidados
          </span>
        )}
        {imageError ? (
          <div className="flex h-full w-full items-center justify-center bg-secondary/40 text-xs font-semibold text-support-2/80">
            Imagem indisponível
          </div>
        ) : (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 260px, 70vw"
            className="object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-support-1">{item.title}</h3>
          {item.subtitle && <p className="mt-1 text-sm text-support-2/90">{item.subtitle}</p>}
          {item.priceHint && (
            <span className="mt-1 inline-block text-xs font-semibold text-primary/80">{item.priceHint}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-support-2/80">
          {bucketChips.map((bucket) => (
            <span
              key={`${item.id}-${bucket}`}
              className="rounded-full bg-secondary/40 px-3 py-1 font-semibold text-support-2 shadow-soft"
            >
              {bucketLabels[bucket]}
            </span>
          ))}
          {item.skills?.slice(0, 3).map((skill) => (
            <span
              key={`${item.id}-skill-${skill}`}
              className="rounded-full border border-white/60 bg-white/80 px-3 py-1 font-semibold text-support-2/80 shadow-soft"
            >
              {skill}
            </span>
          ))}
        </div>
        {item.reasons && item.reasons.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-xs text-support-2/90">
            {item.reasons.slice(0, 3).map((reason) => (
              <li key={`${item.id}-reason-${reason}`}>{reason}</li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button variant="primary" size="sm" className="w-full" onClick={() => onBuy(item)}>
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Comprar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void onSave(item)}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando…' : 'Salvar no Planner'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function DescobrirClient({
  suggestions,
  filters,
  dateKey,
  profile,
  initialAgeFilter = null,
  initialPlaceFilter = null,
  recShelf,
  flashRoutine,
  selfCare,
  flags,
}: DescobrirClientProps) {
  const [ageFilter, setAgeFilter] = useState<string | null>(initialAgeFilter)
  const [placeFilter, setPlaceFilter] = useState<string | null>(initialPlaceFilter)
  const [showActivities, setShowActivities] = useState(false)
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null)
  const [savingProductId, setSavingProductId] = useState<string | null>(null)
  const [savingRoutine, setSavingRoutine] = useState(false)
  const [savingSelfCareId, setSavingSelfCareId] = useState<string | null>(null)
  const [completingSelfCareId, setCompletingSelfCareId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const discoverFlags = useMemo(() => getClientFlags(flags), [flags])

  const targetBuckets = useMemo(() => {
    const children = Array.isArray(profile.children) ? profile.children : []
    if (profile.mode === 'all') {
      const buckets = Array.from(new Set(children.map((child) => child.age_bucket))) as QuickIdeasAgeBucket[]
      return buckets.length > 0 ? buckets : (['2-3'] as QuickIdeasAgeBucket[])
    }
    const activeChild =
      children.find((child) => child.id === profile.activeChildId) ?? children[0]
    return activeChild ? [activeChild.age_bucket] : (['2-3'] as QuickIdeasAgeBucket[])
  }, [profile])

  const telemetryFlags = useMemo(() => {
    return {
      recShelf: !!discoverFlags.recShelf,
      recShelfAI: !!discoverFlags.recShelfAI,
      flashRoutine: !!discoverFlags.flashRoutine,
      flashRoutineAI: !!discoverFlags.flashRoutineAI,
      selfCare: !!discoverFlags.selfCare,
      selfCareAI: !!discoverFlags.selfCareAI,
    } satisfies Record<string, boolean>
  }, [discoverFlags])

  const telemetryCtx = useMemo(() => {
    return {
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      route: '/descobrir',
      tz: 'America/Sao_Paulo',
      dateKey,
      flags: telemetryFlags,
    }
  }, [dateKey, telemetryFlags])

  const profileMode = profile.mode
  const impressionsKeyRef = useRef<string | null>(null)
  const flashRoutineImpressionRef = useRef<string | null>(null)
  const selfCareImpressionRef = useRef<string | null>(null)

  const recShelfEnabled = discoverFlags.recShelf && recShelf.enabled
  const flashRoutineEnabled = discoverFlags.flashRoutine && flashRoutine.enabled
  const selfCareEnabled = discoverFlags.selfCare && selfCare.enabled

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesAge = !ageFilter || activity.age.includes(ageFilter.replace('+', ''))
      const matchesPlace = !placeFilter || activity.place === placeFilter
      return matchesAge && matchesPlace
    })
  }, [ageFilter, placeFilter])

  const friendlyFilters = useMemo(() => {
    const parts = [
      friendlyLocationLabel(filters.location),
      `${filters.time_window_min} min`,
      friendlyEnergyLabel(filters.energy),
    ]
    return parts.join(' • ')
  }, [filters])

  const recShelfImpressionKey = useMemo(() => {
    if (!recShelfEnabled || recShelf.groups.length === 0) {
      return ''
    }
    return recShelf.groups.map((group) => `${group.kind}:${group.items.length}`).join('|')
  }, [recShelfEnabled, recShelf.groups])

  useEffect(() => {
    if (!recShelfEnabled || recShelf.groups.length === 0) {
      return
    }
    if (impressionsKeyRef.current === recShelfImpressionKey) {
      return
    }
    impressionsKeyRef.current = recShelfImpressionKey
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
      },
      telemetryCtx
    )
  }, [recShelfEnabled, recShelf.groups, recShelfImpressionKey, targetBuckets, telemetryCtx])

  const showRecShelf = recShelfEnabled && recShelf.groups.length > 0
  const showSelfCare = selfCareEnabled && selfCare.items.length > 0
  const routine = flashRoutineEnabled ? flashRoutine.routine : null
  const routineId = routine?.id ?? null
  const analyticsSource = flashRoutine.analyticsSource ?? 'local'
  const stableDateKey = dateKey

  const flashRoutineImpressionKey = useMemo(() => {
    if (!routineId) {
      return null
    }

    return `${stableDateKey}::${routineId}::${analyticsSource}`
  }, [stableDateKey, routineId, analyticsSource])

  const RoutineEmptyState = () => (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-support-2/80">
      Rotina indisponível para este contexto. Tente ajustar tempo ou local.
    </div>
  )

  useEffect(() => {
    if (!flashRoutineImpressionKey || !routine) {
      return
    }

    if (flashRoutineImpressionRef.current === flashRoutineImpressionKey) {
      return
    }

    flashRoutineImpressionRef.current = flashRoutineImpressionKey
    if (!sample(0.2)) {
      return
    }

    trackTelemetry(
      'discover_flash_impression',
      {
        routineId: routine.id,
        source: analyticsSource,
      },
      { ...telemetryCtx, source: analyticsSource }
    )
  }, [flashRoutineImpressionKey, routine, analyticsSource, telemetryCtx])

  useEffect(() => {
    if (!showSelfCare) {
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
      },
      telemetryCtx
    )
  }, [showSelfCare, selfCare, telemetryCtx])

  const handleStart = (id: string) => {
    setExpandedIdeaId((current) => (current === id ? null : id))
  }

  const handleSaveToPlanner = async (suggestion: SuggestionCard) => {
    setSavingIdeaId(suggestion.id)
    try {
      const ideaDuration = coerceIntWithin(
        suggestion.planner_payload?.duration_min ?? suggestion.time_total_min ?? 5,
        suggestion.time_total_min ?? 5,
        1
      )
      const ideaPayload = {
        type: 'idea' as const,
        id: suggestion.id,
        title: suggestion.title,
        duration_min: ideaDuration,
        materials: sanitizeStringList(suggestion.planner_payload?.materials),
      }

      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Ideia: ${suggestion.title}`,
          dateISO: dateKey,
          timeISO: '15:00',
          category: 'Lanche',
          link: '/descobrir',
          payload: ideaPayload,
          tags: ['atividade', 'quick-idea', suggestion.location],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível salvar no Planner.')
      }

      trackTelemetry('planner_save_ok', { type: 'idea', id: suggestion.id }, telemetryCtx)
      setToast({ message: 'Sugestão salva no Planner!', type: 'success' })
    } catch (error) {
      console.error('[QuickIdeas] Planner save failed:', error)
      trackTelemetry(
        'discover_section_error',
        {
          section: 'ideas',
          reason: error instanceof Error ? error.message : 'unknown',
        },
        telemetryCtx
      )
      setToast({
        message: error instanceof Error ? error.message : 'Erro ao salvar no Planner.',
        type: 'error',
      })
    } finally {
      setSavingIdeaId(null)
    }
  }

  const handleShare = async (suggestion: SuggestionCard) => {
    const baseText = `${suggestion.title}\n${suggestion.summary}\n\nPassos rápidos:\n${suggestion.steps
      .slice(0, 3)
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n')}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: suggestion.title,
          text: baseText,
        })
        return
      }

      await navigator.clipboard.writeText(baseText)
      setToast({ message: 'Detalhes copiados para compartilhar!', type: 'info' })
    } catch (error) {
      console.error('[QuickIdeas] Share failed:', error)
      setToast({ message: 'Não foi possível compartilhar agora.', type: 'error' })
    }
  }

  const handleCopySteps = async (suggestion: SuggestionCard) => {
    const text = suggestion.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: 'Passos copiados!', type: 'info' })
    } catch (error) {
      console.error('[QuickIdeas] Copy steps failed:', error)
      setToast({ message: 'Não foi possível copiar os passos.', type: 'error' })
    }
  }

  const handleBuyProduct = (product: RecShelfItem) => {
    trackTelemetry('discover_rec_click_buy', {
      id: product.id,
      kind: product.kind,
      retailer: product.retailer,
    })

    if (typeof window !== 'undefined') {
      const targetUrl = product.trackedAffiliateUrl || product.affiliateUrl
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSaveProduct = async (product: RecShelfItem) => {
    setSavingProductId(product.id)
    trackTelemetry('discover_rec_save_planner', { id: product.id, kind: product.kind })

    try {
      const affiliateUrlCandidate = (product.trackedAffiliateUrl || product.affiliateUrl || '').trim()
      let affiliateUrl: string
      try {
        affiliateUrl = new URL(affiliateUrlCandidate).toString()
      } catch {
        throw new Error('Link do produto inválido para salvar no Planner.')
      }

      let imageUrl: string
      try {
        imageUrl = new URL(product.imageUrl).toString()
      } catch {
        throw new Error('Imagem do produto inválida para salvar no Planner.')
      }

      const productPayload = {
        type: 'product' as const,
        id: product.id,
        title: product.title,
        kind: product.kind,
        imageUrl,
        retailer: typeof product.retailer === 'string' ? product.retailer.trim() : product.retailer,
        affiliateUrl,
      }

      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Produto: ${product.title}`,
          dateISO: dateKey,
          timeISO: '09:00',
          category: 'Descobrir',
          link: '/descobrir',
          payload: productPayload,
          tags: ['produto', product.kind],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível salvar no Planner.')
      }

      setToast({ message: 'Produto salvo no Planner!', type: 'success' })
    } catch (error) {
      console.error('[RecShelf] Planner save failed:', error)
      setToast({
        message: error instanceof Error ? error.message : 'Erro ao salvar no Planner.',
        type: 'error',
      })
    } finally {
      setSavingProductId(null)
    }
  }

  const handleStartFlashRoutine = () => {
    if (!flashRoutineEnabled || !routine) {
      return
    }
    trackTelemetry('discover_flash_start', {
      id: routine.id,
      total: routine.totalMin,
      source: flashRoutine.analyticsSource,
    })
    setToast({ message: 'Rotina iniciada! Aproveite os próximos minutos juntos.', type: 'info' })
  }

  const handleSaveFlashRoutine = async () => {
    if (!flashRoutineEnabled || !routine) {
      return
    }
    setSavingRoutine(true)
    trackTelemetry('discover_flash_save_planner', {
      id: routine.id,
      source: flashRoutine.analyticsSource,
    })

    try {
      const totalMin = coerceIntWithin(routine.totalMin, routine.totalMin, 5, 60)
      const routineSteps = routine.steps.slice(0, 3).map((step, index) => {
        const title = typeof step.title === 'string' ? step.title.trim() : ''
        if (!title) {
          throw new Error(`Passo ${index + 1} da rotina sem título.`)
        }
        const minutes = coerceIntWithin(step.minutes, Math.max(5, Math.floor(totalMin / 3)), 1, 30)
        const ideaId = typeof step.ideaId === 'string' && step.ideaId.trim() ? step.ideaId.trim() : undefined
        return {
          title,
          minutes,
          ideaId,
        }
      })

      if (routineSteps.length !== 3) {
        throw new Error('Rotina incompleta para salvar no Planner.')
      }

      const routinePayload = {
        type: 'routine' as const,
        id: routine.id,
        title: routine.title,
        totalMin,
        steps: routineSteps,
        materials: sanitizeStringList(routine.materials),
        safetyNotes: sanitizeStringList(routine.safetyNotes ?? []),
      }

      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Flash Routine: ${routine.title}`,
          dateISO: dateKey,
          timeISO: '09:30',
          category: 'Descobrir',
          link: '/descobrir',
          payload: routinePayload,
          tags: ['rotina', routine.locale],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível salvar no Planner.')
      }

      setToast({ message: 'Rotina salva no Planner!', type: 'success' })
    } catch (error) {
      console.error('[FlashRoutine] Planner save failed:', error)
      trackTelemetry('discover_flash_error', {
        action: 'save_planner',
        id: routine.id,
      })
      setToast({
        message: error instanceof Error ? error.message : 'Erro ao salvar a rotina.',
        type: 'error',
      })
    } finally {
      setSavingRoutine(false)
    }
  }

  const handleSelfCareDone = async (item: SelfCareT) => {
    setCompletingSelfCareId(item.id)
    trackTelemetry('discover_selfcare_done', {
      id: item.id,
      minutes: item.minutes,
      energy: selfCare.energy,
    })

    try {
      const response = await fetch('/api/cuidese/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, minutes: item.minutes, energy: selfCare.energy, dateKey }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível registrar no Cuide-se.')
      }

      setToast({ message: 'Autocuidado concluído! 💛', type: 'success' })
    } catch (error) {
      console.error('[SelfCare] Done failed:', error)
      trackTelemetry('discover_selfcare_error', { action: 'done', id: item.id })
      setToast({
        message: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        type: 'error',
      })
    } finally {
      setCompletingSelfCareId(null)
    }
  }

  const handleSelfCareSave = async (item: SelfCareT) => {
    setSavingSelfCareId(item.id)
    trackTelemetry('discover_selfcare_save_planner', { id: item.id, minutes: item.minutes })

    try {
      const steps = sanitizeStringList(item.steps).slice(0, 6)
      if (steps.length < 2) {
        throw new Error('Autocuidado sem passos suficientes para salvar no Planner.')
      }

      const selfCarePayload = {
        type: 'selfcare' as const,
        id: item.id,
        title: item.title,
        minutes: item.minutes,
        steps,
      }

      const response = await fetch('/api/planner/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Autocuidado: ${item.title}`,
          dateISO: dateKey,
          timeISO: '10:00',
          category: 'Cuide-se',
          link: '/descobrir',
          payload: selfCarePayload,
          tags: ['selfcare', `${item.minutes}min`],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Não foi possível salvar no Planner.')
      }

      setToast({ message: 'Salvo no Planner!', type: 'success' })
    } catch (error) {
      console.error('[SelfCare] Save failed:', error)
      trackTelemetry('discover_selfcare_error', { action: 'save_planner', id: item.id })
      setToast({
        message: error instanceof Error ? error.message : 'Erro ao salvar no Planner.',
        type: 'error',
      })
    } finally {
      setSavingSelfCareId(null)
    }
  }

  return (
    <main className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 sm:px-6 md:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(62%_62%_at_50%_0%,rgba(255,216,230,0.5),transparent)]"
      />

      <Reveal>
        <SectionWrapper
          className="relative"
          header={
            <header className="SectionWrapper-header">
              <span className="SectionWrapper-eyebrow">Inspirações</span>
              <h1 className="SectionWrapper-title inline-flex items-center gap-2">
                <span aria-hidden>🎨</span>
                <span>Descobrir</span>
              </h1>
              <p className="SectionWrapper-description max-w-2xl">
                Ideias de atividades, brincadeiras e descobertas para nutrir a curiosidade de cada fase da infância.
              </p>
            </header>
          }
        >
          {null}
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
                  {['0-1', '2-3', '4-5', '6-7', '8+'].map((age) => {
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

      {showActivities && (
        <Reveal delay={140}>
          <SectionWrapper title={`Atividades ${filteredActivities.length > 0 ? `(${filteredActivities.length})` : ''}`}>
            {filteredActivities.length > 0 ? (
              <GridRhythm className="grid-cols-1 sm:grid-cols-2">
                {filteredActivities.map((activity, idx) => (
                  <Reveal key={activity.id} delay={idx * 70} className="h-full">
                    <Card className="h-full">
                      <div className="text-4xl">{activity.emoji}</div>
                      <h3 className="mt-3 text-lg font-semibold text-support-1">{activity.title}</h3>
                      <div className="mt-3 flex gap-3 text-xs text-support-2">
                        <span>👧 {activity.age} anos</span>
                        <span>📍 {activity.place}</span>
                      </div>
                      <Button variant="primary" size="sm" className="mt-6 w-full">
                        Salvar no Planejador
                      </Button>
                    </Card>
                  </Reveal>
                ))}
              </GridRhythm>
            ) : (
              <Card className="py-12 text-center">
                <p className="text-sm text-support-2">
                  Nenhuma atividade encontrada com esses filtros. Experimente ajustar as combinações.
                </p>
              </Card>
            )}
          </SectionWrapper>
        </Reveal>
      )}

      <Reveal delay={200}>
        <SectionWrapper title={<span className="inline-flex items-center gap-2">🌟<span>Sugestão do Dia</span></span>}>
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            Filtros ativos: {friendlyFilters}
          </div>
          <div className="flex flex-col gap-4">
            {suggestions.length === 0 ? (
              <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary/12 via-white/90 to-white p-7">
                <p className="text-sm text-support-2 md:text-base">
                  Ainda não temos sugestões para estes filtros. Ajuste as preferências para descobrir novas ideias.
                </p>
              </Card>
            ) : (
              suggestions.map((suggestion, index) => (
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
                            {badgeLabels[badge]}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="sm:w-auto"
                          onClick={() => handleStart(suggestion.id)}
                        >
                          <Play className="h-4 w-4" aria-hidden />
                          {expandedIdeaId === suggestion.id ? 'Ocultar passos' : 'Começar agora'}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="sm:w-auto"
                          onClick={() => void handleShare(suggestion)}
                        >
                          <Share2 className="h-4 w-4" aria-hidden />
                          Compartilhar
                        </Button>
                      </div>

                      {expandedIdeaId === suggestion.id && (
                        <div className="space-y-4 rounded-2xl border border-white/60 bg-white/92 p-4 shadow-soft">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-support-1">Materiais</h4>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                                onClick={() => void handleCopySteps(suggestion)}
                              >
                                <Copy className="h-3.5 w-3.5" aria-hidden /> Copiar passos
                              </button>
                            </div>
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

                          {suggestion.safety_notes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-primary">Cuidados</h4>
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-support-2/90">
                                {suggestion.safety_notes.map((note, idx) => (
                                  <li key={idx}>{note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
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

      {flashRoutineEnabled && (
        <Reveal delay={220}>
          <SectionWrapper
            title={
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>⚡</span>
                <span>Flash Routine</span>
              </span>
            }
            description="Sequência rápida de 15 a 20 minutos para fortalecer a conexão."
          >
            <Card className="flex flex-col gap-4 bg-white/92 p-7 shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-support-1 md:text-xl">
                    {routine?.title ?? 'Rotina sugerida'}
                  </h3>
                  <p className="text-sm text-support-2/90">
                    {routine ? `${routine.totalMin} minutos • ${friendlyLocationLabel(routine.locale)}` : 'Rotina indisponível no momento'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {routine && (
                    <span className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold text-support-2 shadow-soft">
                      {bucketLabels[routine.ageBucket]}
                    </span>
                  )}
                  <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white shadow-soft">
                    Parceria
                  </span>
                </div>
              </div>

              {!routine || !Array.isArray(routine.steps) || routine.steps.length === 0 ? (
                <RoutineEmptyState />
              ) : (
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                  <ol className="space-y-3 text-sm text-support-1">
                    {routine.steps.map((step, index) => (
                      <li key={`${routine.id ?? 'routine'}-step-${index}`} className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{step.title}</p>
                          {typeof step.minutes === 'number' && (
                            <p className="text-xs text-support-2/80">≈ {step.minutes} minutos</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {routine?.materials?.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-support-1">Materiais</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {routine.materials.map((material, index) => (
                      <span
                        key={`${routine.id ?? 'routine'}-material-${index}`}
                        className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold text-support-2/80 shadow-soft"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {routine?.safetyNotes?.length ? (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <AlertTriangle className="h-4 w-4" aria-hidden /> Cuidados
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-support-2/90">
                    {routine.safetyNotes.map((note, idx) => (
                      <li key={`${routine.id ?? 'routine'}-safety-${idx}`}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={handleStartFlashRoutine} disabled={!routine} aria-disabled={!routine}>
                  {routine ? `Começar rotina (${routine.totalMin}’)` : 'Rotina indisponível'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSaveFlashRoutine()}
                  disabled={!routine || savingRoutine}
                  aria-disabled={!routine || savingRoutine}
                >
                  {savingRoutine ? 'Salvando…' : 'Salvar no Planner'}
                </Button>
              </div>
            </Card>
          </SectionWrapper>
        </Reveal>
      )}

      {showSelfCare && (
        <Reveal delay={240}>
          <SectionWrapper
            title={
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>💛</span>
                <span>Cuide-se rápido</span>
              </span>
            }
            description={`Sugestões de ${selfCare.minutes} minutos para energia ${selfCare.energy}.`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {selfCare.items.map((item) => (
                <Card key={item.id} className="flex flex-col gap-4 bg-white/92 p-6 shadow-soft">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-support-1">{item.title}</h3>
                      <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {item.minutes} minutos
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleSelfCareDone(item)}
                      disabled={completingSelfCareId === item.id}
                    >
                      {completingSelfCareId === item.id ? 'Registrando…' : 'Fiz agora'}
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                    <ul className="space-y-2 text-sm text-support-1">
                      {item.steps.slice(0, 2).map((step, idx) => (
                        <li key={`${item.id}-step-${idx}`} className="flex gap-2">
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                      {item.steps.length > 2 && (
                        <li className="text-xs text-support-2/80">+ {item.steps.length - 2} passo(s) extras no Planner</li>
                      )}
                    </ul>
                  </div>

                  {item.tip && (
                    <p className="text-xs font-semibold text-primary/80">{item.tip}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSelfCareSave(item)}
                      disabled={savingSelfCareId === item.id}
                    >
                      {savingSelfCareId === item.id ? 'Salvando…' : 'Salvar no Planner'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </SectionWrapper>
        </Reveal>
      )}

      {showRecShelf ? (
        recShelf.groups.map((group, shelfIndex) => {
          const shelfMeta = shelfLabels[group.kind]
          return (
            <Reveal key={group.kind} delay={220 + shelfIndex * 60}>
              <SectionWrapper
                title={
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden>{shelfMeta.icon}</span>
                    <span>{shelfMeta.title}</span>
                  </span>
                }
              >
                <div className="-mx-4 overflow-hidden sm:mx-0">
                  <div
                    className="flex gap-4 overflow-x-auto pb-4 pl-4 sm:pl-0"
                    role="list"
                    aria-label={`Recomendações de ${shelfMeta.title}`}
                  >
                    {group.items.map((item, idx) => (
                      <Reveal key={item.id} delay={idx * 40} className="h-full">
                        <RecShelfCarouselCard
                          item={item}
                          profileMode={profileMode}
                          onBuy={handleBuyProduct}
                          onSave={handleSaveProduct}
                          savingProductId={savingProductId}
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              </SectionWrapper>
            </Reveal>
          )
        })
      ) : (
        <>
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

          <SectionWrapper title={<span className="inline-flex items-center gap-2">��<span>Brinquedos Sugeridos</span></span>}>
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
        </>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
