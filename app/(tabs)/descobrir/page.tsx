import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'

import DescobrirClient from './Client'
import { toFlashFilters } from './utils/filters'
import { nearestQuickIdeasWindow } from './utils/timeWindows'

import { QUICK_IDEAS_CATALOG } from '@/app/data/quickIdeasCatalog'
import { FLASH_IDEAS_CATALOG } from '@/app/data/flashIdeas'
import { FLASH_ROUTINES_CMS } from '@/app/data/flashRoutines'
import { REC_PRODUCTS } from '@/app/data/recProducts'
import { SELF_CARE_CMS } from '@/app/data/selfCare'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { buildDailySuggestions } from '@/app/lib/quickIdeasCatalog'
import { buildRecShelves } from '@/app/lib/recShelf'
import { selectFlashRoutine } from '@/app/lib/flashRoutine'
import { selectSelfCareItems } from '@/app/lib/selfCare'
import { readProfileCookie } from '@/app/lib/profileCookie'
import { getServerFlags } from '@/app/lib/flags'
import { trackTelemetry } from '@/app/lib/telemetry'
import '@/app/lib/telemetryServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Tipos utilitários locais (evitam conflitos entre módulos)
type QuickIdeasLocation = 'casa' | 'parque' | 'escola' | 'area_externa'
type QuickIdeasEnergy = 'exausta' | 'normal' | 'animada'
type QuickIdeasAgeBucket = '0-1' | '2-3' | '4-5' | '6-7' | '8+'
type QuickIdeasTimeWindow = 2 | 5 | 10 | 15 | 20 | 30

type QuickIdea = {
  id: string
  title: string
  summary?: string
  time_total_min: number
  location: QuickIdeasLocation
  materials?: string[]
  steps?: string[]
  age_adaptations?: Record<string, string[]>
  safety_notes?: string[]
  badges?: string[]
  planner_payload?: any
  rationale?: string
}

const LOCATION_KEYS: QuickIdeasLocation[] = ['casa', 'parque', 'escola', 'area_externa']
const ENERGY_KEYS: QuickIdeasEnergy[] = ['exausta', 'normal', 'animada']
const LOCATION_LABEL: Record<QuickIdeasLocation, string> = {
  casa: 'Casa',
  parque: 'Parque',
  escola: 'Escola',
  area_externa: 'Área Externa',
}

const sanitizeLocation = (value?: string | null): QuickIdeasLocation => {
  if (!value) return 'casa'
  const normalized = value.trim().toLowerCase() as QuickIdeasLocation
  return LOCATION_KEYS.includes(normalized) ? normalized : 'casa'
}
const sanitizeEnergy = (value?: string | null): QuickIdeasEnergy => {
  if (!value) return 'normal'
  const normalized = value.trim().toLowerCase() as QuickIdeasEnergy
  return ENERGY_KEYS.includes(normalized) ? normalized : 'normal'
}
const sanitizeTime = (value?: string | null): QuickIdeasTimeWindow => {
  const n = Number(value)
  return nearestQuickIdeasWindow(n)
}
const sanitizeAgeBucket = (value?: string | null): QuickIdeasAgeBucket => {
  if (!value) return '2-3'
  const normalized = value.trim() as QuickIdeasAgeBucket
  return ['0-1', '2-3', '4-5', '6-7', '8+'].includes(normalized) ? normalized : '2-3'
}
const normalizeChildId = (value?: string | null): string | null => {
  if (!value) return null
  const t = value.trim()
  return t.length > 0 ? t : null
}

type SearchParams = { [key: string]: string | string[] | undefined }
type SuggestionView = QuickIdea & {
  child?: { id: string; name?: string; age_bucket: QuickIdeasAgeBucket }
}

const dedupeChildren = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of items) {
    if (!seen.has(it.id)) {
      seen.add(it.id)
      out.push(it)
    }
  }
  return out
}

type ProfileChildSummary = { id: string; name?: string; age_bucket: QuickIdeasAgeBucket }
type ProfileMode = 'single' | 'all'

const buildProfileChildren = (
  children: Array<{ id?: string; name?: string | null; ageRange?: string | null }>
): ProfileChildSummary[] => {
  if (!children || children.length === 0) return []
  const mapped = children.map<ProfileChildSummary>((child, idx) => {
    const id = child.id && child.id.trim() ? child.id.trim() : `child-${idx + 1}`
    const name = child.name && child.name.trim() ? child.name.trim() : undefined
    const age_bucket = sanitizeAgeBucket(child.ageRange ?? undefined)
    return { id, name, age_bucket }
  })
  return dedupeChildren(mapped)
}

export default async function DescobrirPage({ searchParams }: { searchParams?: SearchParams }) {
  if (typeof (noStore as any) === 'function') (noStore as any)()

  const jar = cookies()
  const { profile, metadata } = readProfileCookie(jar)

  const profileChildren = buildProfileChildren(profile.children ?? [])
  const fallbackChildren =
    profileChildren.length > 0
      ? profileChildren
      : [{ id: 'demo-child', name: 'Luna', age_bucket: '2-3' as QuickIdeasAgeBucket }]

  const rawModeValue = typeof searchParams?.mode === 'string' ? searchParams.mode : metadata.mode
  const normalizedMode = typeof rawModeValue === 'string' ? rawModeValue.trim().toLowerCase() : ''
  const requestedMode: ProfileMode =
    normalizedMode === 'all' && fallbackChildren.length > 1 ? 'all' : 'single'

  const searchParamChildId = normalizeChildId(
    typeof searchParams?.child === 'string' ? searchParams.child : undefined
  )
  const metadataChildId = normalizeChildId(metadata.activeChildId ?? null)
  const fallbackActiveChildId = normalizeChildId(fallbackChildren[0]?.id ?? null)
  const activeChildId: string | null = searchParamChildId ?? metadataChildId ?? fallbackActiveChildId

  const filters = {
    location: sanitizeLocation(typeof searchParams?.location === 'string' ? searchParams.location : undefined),
    energy: sanitizeEnergy(typeof searchParams?.energia === 'string' ? searchParams.energia : undefined),
    time_window_min: sanitizeTime(typeof searchParams?.tempo === 'string' ? searchParams.tempo : undefined),
  } satisfies {
    location: QuickIdeasLocation
    energy: QuickIdeasEnergy
    time_window_min: QuickIdeasTimeWindow
  }

  const serverFlags = getServerFlags({
    cookies: (name) => jar.get(name)?.value,
    searchParams,
  })

  const telemetryFlags = Object.fromEntries(
    Object.entries(serverFlags).map(([k, v]) => [k, Boolean(v)])
  ) as Record<string, boolean>

  const {
    recShelf: recShelfEnabled,
    flashRoutine: flashRoutineEnabled,
    flashRoutineAI: flashRoutineAIEnabled,
    selfCare: selfCareEnabled,
    selfCareAI: selfCareAIEnabled,
  } = serverFlags

  const ideasCatalog = FLASH_IDEAS_CATALOG as any[]
  const routinesCatalog = FLASH_ROUTINES_CMS as any[]
  const recProductsCatalog = REC_PRODUCTS as any[]
  const selfCareCatalog = SELF_CARE_CMS as any[]

  const dateKey = getBrazilDateKey()
  const telemetryCtx = {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    route: '/descobrir',
    tz: 'America/Sao_Paulo',
    dateKey,
    flags: telemetryFlags,
  }

  const profileSummary = {
    mode: requestedMode,
    activeChildId,
    children: fallbackChildren,
  }

  const BUCKET_ORDER: Record<QuickIdeasAgeBucket, number> = { '0-1': 0, '2-3': 1, '4-5': 2, '6-7': 3, '8+': 4 }
  const kids = Array.isArray(profileSummary.children) ? profileSummary.children : []

  const computedBuckets: QuickIdeasAgeBucket[] =
    profileSummary.mode === 'all'
      ? Array.from(new Set(kids.map((c) => c.age_bucket))).sort((a, b) => BUCKET_ORDER[a] - BUCKET_ORDER[b])
      : (() => {
          const active =
            (profileSummary.activeChildId ? kids.find((c) => c.id === profileSummary.activeChildId) : undefined) ??
            kids[0]
          return active ? [active.age_bucket] : []
        })()

  const targetBuckets: QuickIdeasAgeBucket[] =
    computedBuckets.length > 0 ? computedBuckets : (['2-3'] as QuickIdeasAgeBucket[])

  // Rec shelf
  let recShelfGroups: ReturnType<typeof buildRecShelves> = []
  if (recShelfEnabled) {
    try {
      recShelfGroups = buildRecShelves({
        products: recProductsCatalog,
        targetBuckets,
        location: filters.location,
        dateKey,
      })
    } catch (err: any) {
      trackTelemetry('discover_section_error', { section: 'recshelf', reason: err?.message ?? 'unknown', fatal: false }, telemetryCtx)
      recShelfGroups = []
    }
  }

  // Flash routine
  const flashFilters = toFlashFilters(filters)
  let flashRoutineResult: ReturnType<typeof selectFlashRoutine> | null = null
  let flashRoutineRoutine: any = null
  if (flashRoutineEnabled) {
    try {
      const result = selectFlashRoutine({
        ideas: ideasCatalog,
        routines: routinesCatalog,
        profile: { mode: profileSummary.mode, children: profileSummary.children },
        filters: flashFilters,
        dateKey,
      })
      if (result) {
        flashRoutineResult = result
        flashRoutineRoutine = result.routine as any
      }
    } catch (err: any) {
      trackTelemetry(
        'discover_section_error',
        { section: 'flash', reason: err?.message ?? 'unknown', fatal: false },
        { ...telemetryCtx, source: flashRoutineAIEnabled ? 'ai' : 'local' }
      )
      flashRoutineResult = null
      flashRoutineRoutine = null
    }
  }

  const flashRoutine =
    flashRoutineEnabled && flashRoutineResult && flashRoutineRoutine
      ? { routine: flashRoutineRoutine, strategy: flashRoutineResult.source, analyticsSource: 'local' as const }
      : null

  // Self care
  let selfCareSelection: ReturnType<typeof selectSelfCareItems> = { items: [], rotationKey: '', source: 'fallback' as const }
  if (selfCareEnabled) {
    try {
      selfCareSelection = selectSelfCareItems({
        items: selfCareCatalog,
        energy: filters.energy,
        minutes: filters.time_window_min as 2 | 5 | 10,
        dateKey,
      })
    } catch (err: any) {
      trackTelemetry('discover_section_error', { section: 'selfcare', reason: err?.message ?? 'unknown', fatal: false }, telemetryCtx)
      selfCareSelection = { items: [], rotationKey: '', source: 'fallback' as const }
    }
  }

  // Ideas
  let suggestions: ReturnType<typeof buildDailySuggestions> = []
  try {
    suggestions = buildDailySuggestions(profileSummary as any, filters as any, dateKey, QUICK_IDEAS_CATALOG)
  } catch (err: any) {
    trackTelemetry('discover_section_error', { section: 'ideas', reason: err?.message ?? 'unknown', fatal: false }, telemetryCtx)
    suggestions = []
  }

  const suggestionViews: SuggestionView[] = suggestions.map(({ idea, child }) => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    time_total_min: idea.time_total_min,
    location: idea.location,
    materials: idea.materials,
    steps: idea.steps,
    age_adaptations: idea.age_adaptations,
    safety_notes: idea.safety_notes,
    badges: idea.badges,
    planner_payload: idea.planner_payload,
    rationale: idea.rationale,
    child: child ? { id: child.id, name: child.name, age_bucket: child.age_bucket } : undefined,
  }))

  const initialAgeFilter = kids[0]?.age_bucket ?? '2-3'
  const initialPlaceFilter = LOCATION_LABEL[filters.location]

  return (
    <DescobrirClient
      suggestions={suggestionViews}
      filters={filters}
      dateKey={dateKey}
      profile={profileSummary as any}
      initialAgeFilter={initialAgeFilter}
      initialPlaceFilter={initialPlaceFilter}
      recShelf={{ enabled: recShelfEnabled, groups: recShelfGroups }}
      flashRoutine={{
        enabled: flashRoutineEnabled,
        aiEnabled: flashRoutineAIEnabled,
        routine: flashRoutine?.routine ?? null,
        strategy: flashRoutine?.strategy ?? null,
        analyticsSource: flashRoutine?.analyticsSource ?? 'local',
      }}
      selfCare={{
        enabled: selfCareEnabled,
        aiEnabled: selfCareAIEnabled,
        items: selfCareSelection.items,
        energy: filters.energy,
        minutes: filters.time_window_min as 2 | 5 | 10,
      }}
      flags={serverFlags}
    />
  )
}
