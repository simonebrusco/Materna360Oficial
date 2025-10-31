import { cookies } from 'next/headers'

import { getProfile } from '@/app/lib/profileServer'
import {
  FlashRoutine as FlashRoutineSchema,
  FlashRoutineFilters as FlashRoutineFiltersSchema,
  IdeaLite as IdeaLiteSchema,
  ProfileSummary as ProfileSummarySchema,
  QuickIdeasFilters as QuickIdeasFiltersSchema,
  RecProduct as RecProductSchema,
  SelfCare as SelfCareSchema,
  type AgeBucketT as AgeBucket,
  type ProfileSummaryT,
  type FlashRoutineT,
} from '@/app/lib/discoverSchemas'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'
import type { ProfileChildSummary, ProfileMode } from '@/app/lib/profileTypes'
import { getServerFlags } from '@/app/lib/flags'
import { trackTelemetry } from '@/app/lib/telemetry'
import { buildRecShelves } from '@/app/lib/recShelf'
import { selectFlashRoutine } from '@/app/lib/flashRoutine'
import { selectSelfCareItems } from '@/app/lib/selfCare'
import '@/app/lib/telemetryServer'
import DescobrirClient from './Client'

import QUICK_IDEAS_CATALOG from '@/app/cms/quickIdeas.seed.json'
import FLASH_ROUTINES_CMS from '@/app/cms/flashRoutines.seed.json'
import REC_PRODUCTS from '@/app/cms/recShelf.seed.json'
import SELF_CARE_CMS from '@/data/mindfulness/renove.json'
import { buildDailySuggestions } from '@/app/lib/quickIdeasCatalog'
import { getBrazilDateKey } from '@/app/lib/dateKey'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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

const sanitizeAgeBucket = (value?: string | null): QuickIdeasAgeBucket => {
  const valid = ['0-1', '2-3', '4-5', '6-7', '8+'] as QuickIdeasAgeBucket[]
  if (!value) return '2-3'
  const normalized = value.trim() as QuickIdeasAgeBucket
  return valid.includes(normalized) ? normalized : '2-3'
}

const sanitizeTime = (value?: string | null): number => {
  if (!value) return 15
  const num = parseInt(value.trim(), 10)
  return Number.isFinite(num) && num > 0 ? num : 15
}

const nearestQuickIdeasWindow = (minutes: number): QuickIdeasTimeWindow => {
  if (minutes <= 10) return 10
  if (minutes <= 20) return 20
  if (minutes <= 30) return 30
  if (minutes <= 60) return 60
  return 120
}

const toFlashFilters = (filters: { location: QuickIdeasLocation; energy: QuickIdeasEnergy; time_window_min: QuickIdeasTimeWindow }): unknown => ({
  locale: filters.location,
  time_window_min: filters.time_window_min,
  energy: filters.energy,
})

type SearchParams = {
  [key: string]: string | string[] | undefined
}

type SuggestionView = QuickIdea & {
  child?: {
    id: string
    name?: string
    age_bucket: QuickIdeasAgeBucket
  }
}

const normalizeChildId = (value?: string | null): string | null => {
  return value && typeof value === 'string' ? value.trim() || null : null
}

const dedupeChildren = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>()
  const result: T[] = []
  items.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      result.push(item)
    }
  })
  return result
}

const buildProfileChildren = (
  children: Array<{ id?: string; name?: string | null; age_bucket?: string | null }>
): ProfileChildSummary[] => {
  if (!children || children.length === 0) return []

  const mapped = children.map<ProfileChildSummary>((child, index) => {
    const id = child.id && typeof child.id === 'string' && child.id.trim() ? child.id.trim() : `child-${index + 1}`
    const name = child.name && typeof child.name === 'string' && child.name.trim() ? child.name.trim() : undefined
    const age_bucket = sanitizeAgeBucket(child.age_bucket ?? undefined)
    return { id, name, age_bucket }
  })

  return dedupeChildren(mapped)
}

export default async function DescobrirPage({ searchParams }: { searchParams?: SearchParams }) {
  const jar = cookies()
  const serverProfile = await getProfile(jar)

  const profileChildren = buildProfileChildren(serverProfile.children ?? [])
  const fallbackChildren =
    profileChildren.length > 0
      ? profileChildren
      : [{ id: 'demo-child', name: 'Luna', age_bucket: '2-3' as QuickIdeasAgeBucket }]

  const rawModeValue = typeof searchParams?.mode === 'string' ? searchParams.mode : serverProfile.mode
  const normalizedMode = typeof rawModeValue === 'string' ? rawModeValue.trim().toLowerCase() : ''
  const requestedMode: ProfileMode =
    normalizedMode === 'all' && fallbackChildren.length > 1 ? 'all' : 'single'

  const searchParamChildId = normalizeChildId(typeof searchParams?.child === 'string' ? searchParams.child : undefined)
  const metadataChildId = normalizeChildId(serverProfile.activeChildId ?? null)
  const fallbackActiveChildId = normalizeChildId(fallbackChildren[0]?.id ?? null)
  const activeChildId: string | null = searchParamChildId ?? metadataChildId ?? fallbackActiveChildId

  const parsedFilters = QuickIdeasFiltersSchema.parse({
    location: sanitizeLocation(typeof searchParams?.location === 'string' ? searchParams.location : undefined),
    time_window_min: sanitizeTime(typeof searchParams?.tempo === 'string' ? searchParams.tempo : undefined),
    energy: sanitizeEnergy(typeof searchParams?.energia === 'string' ? searchParams.energia : undefined),
  })

  const filters = {
    location: parsedFilters.location,
    energy: parsedFilters.energy,
    time_window_min: nearestQuickIdeasWindow(parsedFilters.time_window_min),
  } satisfies {
    location: QuickIdeasLocation
    energy: QuickIdeasEnergy
    time_window_min: QuickIdeasTimeWindow
  }

  const serverFlags = getServerFlags({
    cookies: (name: string) => jar.get(name)?.value,
    searchParams,
  })

  const telemetryFlags = Object.fromEntries(
    Object.entries(serverFlags).map(([key, value]) => [key, Boolean(value)])
  ) as Record<string, boolean>

  const { recShelf: recShelfEnabled, flashRoutine: flashRoutineEnabled, flashRoutineAI: flashRoutineAIEnabled, selfCare: selfCareEnabled, selfCareAI: selfCareAIEnabled } =
    serverFlags

  const ideasCatalog = IdeaLiteSchema.array().parse(QUICK_IDEAS_CATALOG)
  const routinesCatalog = FlashRoutineSchema.array().parse(FLASH_ROUTINES_CMS)
  const recProductsCatalog = RecProductSchema.array().parse(REC_PRODUCTS)
  const selfCareCatalog = SelfCareSchema.array().parse(SELF_CARE_CMS)

  const dateKey = getBrazilDateKey()

  const telemetryCtx = {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    route: '/descobrir',
    tz: 'America/Sao_Paulo',
    dateKey,
    flags: telemetryFlags,
  }

  const profileSummary: ProfileSummaryT = ProfileSummarySchema.parse({
    mode: requestedMode,
    activeChildId,
    children: fallbackChildren,
  })

  const validatedProfile = profileSummary

  const BUCKET_ORDER: Record<AgeBucket, number> = { '0-1': 0, '2-3': 1, '4-5': 2, '6-7': 3, '8+': 4 }
  const children = Array.isArray(validatedProfile.children) ? validatedProfile.children : []

  const computedBuckets: AgeBucket[] =
    validatedProfile.mode === 'all'
      ? Array.from(new Set(children.map((c) => c.age_bucket))).sort((a, b) => BUCKET_ORDER[a] - BUCKET_ORDER[b])
      : (() => {
          const active =
            (validatedProfile.activeChildId ? children.find((c) => c.id === validatedProfile.activeChildId) : undefined) ??
            children[0]
          return active ? [active.age_bucket] : []
        })()

  const targetBuckets: AgeBucket[] = computedBuckets.length > 0 ? computedBuckets : (['2-3'] as AgeBucket[])

  let recShelfGroups: ReturnType<typeof buildRecShelves> = []
  if (recShelfEnabled) {
    try {
      recShelfGroups = buildRecShelves({
        products: recProductsCatalog,
        targetBuckets,
        location: filters.location,
        dateKey,
      })
    } catch (error) {
      trackTelemetry(
        'discover_section_error',
        { section: 'recshelf', reason: error instanceof Error ? error.message : 'unknown', fatal: false },
        telemetryCtx
      )
      recShelfGroups = []
    }
  }

  const flashFilters = FlashRoutineFiltersSchema.parse(toFlashFilters(filters))

  let flashRoutineResult: ReturnType<typeof selectFlashRoutine> | null = null
  let flashRoutineRoutine: FlashRoutineT | null = null
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
        flashRoutineRoutine = FlashRoutineSchema.parse(result.routine)
      }
    } catch (error) {
      trackTelemetry(
        'discover_section_error',
        { section: 'flash', reason: error instanceof Error ? error.message : 'unknown', fatal: false },
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

  let selfCareSelection: ReturnType<typeof selectSelfCareItems> = { items: [], rotationKey: '', source: 'fallback' as const }
  if (selfCareEnabled) {
    try {
      selfCareSelection = selectSelfCareItems({
        items: selfCareCatalog,
        energy: filters.energy,
        minutes: filters.time_window_min as 2 | 5 | 10,
        dateKey,
      })
    } catch (error) {
      trackTelemetry(
        'discover_section_error',
        { section: 'selfcare', reason: error instanceof Error ? error.message : 'unknown', fatal: false },
        telemetryCtx
      )
      selfCareSelection = { items: [], rotationKey: '', source: 'fallback' as const }
    }
  }

  let suggestions: ReturnType<typeof buildDailySuggestions> = []
  try {
    suggestions = buildDailySuggestions(profileSummary, filters, dateKey, QUICK_IDEAS_CATALOG)
  } catch (error) {
    trackTelemetry(
      'discover_section_error',
      { section: 'ideas', reason: error instanceof Error ? error.message : 'unknown', fatal: false },
      telemetryCtx
    )
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

  const initialAgeFilter = children[0]?.age_bucket ?? '2-3'
  const initialPlaceFilter = LOCATION_LABEL[filters.location]

  return (
    <DescobrirClient
      suggestions={suggestionViews}
      filters={filters}
      dateKey={dateKey}
      profile={profileSummary}
      initialAgeFilter={initialAgeFilter}
      initialPlaceFilter={initialPlaceFilter}
      recShelf={{
        enabled: recShelfEnabled,
        groups: recShelfGroups,
      }}
      flashRoutine={{
        enabled: flashRoutineEnabled,
        aiEnabled: flashRoutineAIEnabled,
        routine: flashRoutineRoutine,
        strategy: flashRoutineResult?.source ?? null,
        analyticsSource: flashRoutineResult?.source === 'ai' ? 'ai' : 'local',
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
