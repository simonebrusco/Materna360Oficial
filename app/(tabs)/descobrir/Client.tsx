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
  printable: { icon: '🖨️', title: 'Printables para Brincar' },
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

type RecShelfCardProps = {
  item: RecShelfItem
  profileMode: 'one' | 'all'
  onSave: (product: RecShelfItem) => Promise<void>
  onBuy: (product: RecShelfItem) => void
  savingProductId: string | null
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
  initialAgeFilter,
  initialPlaceFilter,
  recShelf,
  flashRoutine,
  selfCare,
  flags,
}: DescobrirClientProps) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null)
  const [savingProductId, setSavingProductId] = useState<string | null>(null)
  const [savingRoutine, setSavingRoutine] = useState(false)
  const [savingSelfCareId, setSavingSelfCareId] = useState<string | null>(null)
  const [completingSelfCareId, setCompletingSelfCareId] = useState<string | null>(null)
  const [ageFilter, setAgeFilter] = useState<QuickIdeasAgeBucket>(initialAgeFilter)
  const [placeFilter, setPlaceFilter] = useState<string>(initialPlaceFilter)

  const recShelfEnabled = recShelf.enabled && recShelf.groups.length > 0
  const flashRoutineEnabled = flashRoutine.enabled && flashRoutine.routine !== null
  const selfCareEnabled = selfCare.enabled && selfCare.items.length > 0

  const discoverFlags = useMemo(() => getClientFlags(flags), [flags])

  const targetBuckets = useMemo(() => {
    const children = Array.isArray(profile.children) ? profile.children : []
    if (profile.mode === 'all') {
      const buckets = Array.from(new Set(children.map((child) => child.age_bucket))) as QuickIdeasAgeBucket[]
      return buckets.length > 0 ? buckets : (['2-3'] as QuickIdeasAgeBucket[])
    }
    const activeChild = children.find((child) => child.id === profile.activeChildId) ?? children[0]
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

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'

  const telemetryCtx = useMemo(() => {
    return {
      appVersion,
      route: '/descobrir',
      tz: 'America/Sao_Paulo',
      dateKey,
      flags: telemetryFlags,
    }
  }, [appVersion, dateKey, telemetryFlags])

  const profileMode = profile.mode

  const recShelfImpressionKey = useMemo(() => {
    return recShelf.groups.map((g) => `${g.kind}:${g.items.length}`).join('|')
  }, [recShelf.groups])

  const impressionsKeyRef = useRef<string>('')

  useEffect(() => {
    if (!recShelfEnabled) {
      return
    }

    const currentKey = recShelfImpressionKey
    if (currentKey === impressionsKeyRef.current) {
      return
    }

    impressionsKeyRef.current = recShelfImpressionKey

    trackTelemetry('discover_rec_impression', { groups: recShelf.groups.length }, telemetryCtx)
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

  const flashRoutineImpressionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!flashRoutineImpressionKey || !routine) {
      return
    }

    const key = flashRoutineImpressionKey

    if (key === flashRoutineImpressionRef.current) {
      return
    }

    flashRoutineImpressionRef.current = flashRoutineImpressionKey

    trackTelemetry('discover_flash_impression', { routineId: routine.id }, { ...telemetryCtx, source: analyticsSource })
  }, [flashRoutineImpressionKey, routine, analyticsSource, telemetryCtx])

  const selfCareImpressionRef = useRef<string>('')

  useEffect(() => {
    if (!showSelfCare) {
      return
    }

    const key = selfCare.items.map((i) => i.id).join(',')

    if (key === selfCareImpressionRef.current) {
      return
    }

    selfCareImpressionRef.current = key

    trackTelemetry('discover_selfcare_impression', { count: selfCare.items.length }, telemetryCtx)
  }, [showSelfCare, selfCare, telemetryCtx])

  const handleStart = (ideaId: string) => {
    setExpandedIdeaId((prev) => (prev === ideaId ? null : ideaId))
  }

  const handleShare = async (suggestion: SuggestionCard) => {
    const baseText = `${suggestion.title}\n\n${suggestion.summary}\n\nMateriais: ${suggestion.materials.join(', ')}`

    try {
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
    trackTelemetry(
      'discover_rec_click_buy',
      {
        id: product.id,
        kind: product.kind,
        retailer: product.retailer,
      },
      telemetryCtx
    )

    if (typeof window !== 'undefined') {
      const targetUrl = product.trackedAffiliateUrl || product.affiliateUrl
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSaveProduct = async (product: RecShelfItem) => {
    setSavingProductId(product.id)
    trackTelemetry(
      'discover_rec_save_planner',
      { id: product.id, kind: product.kind },
      telemetryCtx
    )

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

      trackTelemetry('planner_save_ok', { type: 'product', id: product.id }, telemetryCtx)
      setToast({ message: 'Produto salvo no Planner!', type: 'success' })
    } catch (error) {
      console.error('[RecShelf] Planner save failed:', error)
      trackTelemetry(
        'discover_section_error',
        {
          section: 'recshelf',
          reason: error instanceof Error ? error.message : 'unknown',
        },
        telemetryCtx
      )
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
    trackTelemetry(
      'discover_flash_start',
      { routineId: routine.id },
      { ...telemetryCtx, source: analyticsSource }
    )
    setToast({ message: 'Rotina iniciada! Aproveite os próximos minutos juntos.', type: 'info' })
  }

  const handleSaveFlashRoutine = async () => {
    if (!flashRoutineEnabled || !routine) {
      return
    }
    setSavingRoutine(true)
    trackTelemetry(
      'discover_flash_save_planner',
      { routineId: routine.id },
      { ...telemetryCtx, source: analyticsSource }
    )

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

      trackTelemetry('planner_save_ok', { type: 'routine', id: routine.id }, telemetryCtx)
      setToast({ message: 'Rotina salva no Planner!', type: 'success' })
    } catch (error) {
      console.error('[FlashRoutine] Planner save failed:', error)
      trackTelemetry(
        'discover_section_error',
        {
          section: 'flash',
          reason: error instanceof Error ? error.message : 'unknown',
        },
        { ...telemetryCtx, source: analyticsSource }
      )
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
    trackTelemetry(
      'discover_selfcare_done',
      { id: item.id, minutes: item.minutes },
      telemetryCtx
    )

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
      trackTelemetry(
        'discover_section_error',
        {
          section: 'selfcare',
          reason: error instanceof Error ? error.message : 'unknown',
        },
        telemetryCtx
      )
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
    trackTelemetry(
      'discover_selfcare_save_planner',
      { id: item.id, minutes: item.minutes },
      telemetryCtx
    )

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

      trackTelemetry('planner_save_ok', { type: 'selfcare', id: item.id }, telemetryCtx)
      setToast({ message: 'Salvo no Planner!', type: 'success' })
    } catch (error) {
      console.error('[SelfCare] Save failed:', error)
      trackTelemetry(
        'discover_section_error',
        {
          section: 'selfcare',
          reason: error instanceof Error ? error.message : 'unknown',
        },
        telemetryCtx
      )
      setToast({
        message: error instanceof Error ? error.message : 'Erro ao salvar no Planner.',
        type: 'error',
      })
    } finally {
      setSavingSelfCareId(null)
    }
  }

  const handleSaveToPlanner = async (suggestion: SuggestionCard) => {
    setSavingIdeaId(suggestion.id)
    trackTelemetry(
      'discover_idea_save_planner',
      { id: suggestion.id },
      telemetryCtx
    )

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
          title: suggestion.title,
          dateISO: dateKey,
          timeISO: '10:00',
          category: 'Descobrir',
          link: '/descobrir',
          payload: ideaPayload,
          tags: ['ideia', `${ideaDuration}min`],
        }),
      })

      if (!response.ok) {
        throw new Error('Não foi possível salvar no Planner.')
      }

      trackTelemetry('planner_save_ok', { type: 'idea', id: suggestion.id }, telemetryCtx)
      setToast({ message: 'Ideia salva no Planner!', type: 'success' })
    } catch (error) {
      console.error('[QuickIdeas] Planner save failed:', error)
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
      if (ageFilter && suggestion.age_bucket !== ageFilter) {
        return false
      }
      if (placeFilter && suggestion.location !== placeFilter) {
        return false
      }
      return true
    })
  }, [suggestions, ageFilter, placeFilter])

  const friendlyFilters = useMemo(() => {
    const parts: string[] = []
    if (ageFilter) parts.push(bucketLabels[ageFilter])
    if (placeFilter) parts.push(friendlyLocationLabel(placeFilter as QuickIdeasLocation))
    return parts.length > 0 ? parts.join(' • ') : 'nenhum'
  }, [ageFilter, placeFilter])

  return (
    <main className="flex flex-col gap-8 pb-24 pt-6 md:gap-12 md:pb-32">
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
                {routine ? (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-support-1">{routine.title}</h3>
                      <p className="text-sm text-support-2/90">{routine.totalMin} minutos</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={handleStartFlashRoutine}>
                        <Play className="h-4 w-4" aria-hidden />
                        Iniciar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleSaveFlashRoutine()}
                        disabled={savingRoutine}
                      >
                        {savingRoutine ? 'Salvando…' : 'Salvar'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <RoutineEmptyState />
                )}
              </div>
            </Card>
          </SectionWrapper>
        </Reveal>
      )}

      {showRecShelf && (
        <Reveal delay={240}>
          <SectionWrapper title={<span className="inline-flex items-center gap-2">📚<span>Recomendações Especiais</span></span>}>
            <div className="space-y-6">
              {recShelf.groups.map((group) => (
                <div key={group.kind}>
                  <h3 className="mb-4 text-base font-semibold text-support-1">
                    {shelfLabels[group.kind]?.icon} {shelfLabels[group.kind]?.title}
                  </h3>
                  <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                    {group.items.map((item) => (
                      <RecShelfCarouselCard
                        key={item.id}
                        item={item}
                        profileMode={profileMode}
                        onSave={handleSaveProduct}
                        onBuy={handleBuyProduct}
                        savingProductId={savingProductId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        </Reveal>
      )}

      {showSelfCare && (
        <Reveal delay={260}>
          <SectionWrapper title={<span className="inline-flex items-center gap-2">💚<span>Para Você</span></span>}>
            <Card className="p-7">
              <GridRhythm className="grid-cols-1 sm:grid-cols-2">
                {selfCare.items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-white/80 p-4 shadow-soft">
                    <div>
                      <h4 className="text-sm font-semibold text-support-1">{item.title}</h4>
                      <p className="text-xs text-support-2/80">{item.minutes} minutos</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1"
                        onClick={() => void handleSelfCareDone(item)}
                        disabled={completingSelfCareId === item.id}
                      >
                        {completingSelfCareId === item.id ? 'Marcando…' : 'Feito!'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => void handleSelfCareSave(item)}
                        disabled={savingSelfCareId === item.id}
                      >
                        {savingSelfCareId === item.id ? 'Salvando…' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </GridRhythm>
            </Card>
          </SectionWrapper>
        </Reveal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
