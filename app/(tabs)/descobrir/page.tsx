import { unstable_noStore as noStore } from 'next/cache'
import { cookies } from 'next/headers'

import DescobrirClient from './Client'
import { toFlashFilters } from './utils/filters'

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
import {
  FlashRoutine as FlashRoutineSchema,
  FlashRoutineFilters as FlashRoutineFiltersSchema,
  IdeaLite as IdeaLiteSchema,
  ProfileSummary as ProfileSummarySchema,
  QuickIdeasFilters as QuickIdeasFiltersSchema,
  RecProduct as RecProductSchema,
  SelfCare as SelfCareSchema,
} from '@/app/lib/discoverSchemas'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'
import type { ProfileChildSummary, ProfileMode } from '@/app/lib/profileTypes'
import type { ProfileSummaryT } from '@/app/lib/discoverSchemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const LOCATION_KEYS: QuickIdeasLocation[] = ['casa', 'parque', 'escola', 'area_externa']
const ENERGY_KEYS: QuickIdeasEnergy[] = ['exausta', 'normal', 'animada']
const TIME_VALUES: QuickIdeasTimeWindow[] = [5, 10, 20]
const LOCATION_LABEL: Record<QuickIdeasLocation, string> = {
  casa: 'Casa',
  parque: 'Parque',
  escola: 'Escola',
  area_externa: 'Área Externa',
}

const sanitizeLocation = (value?: string | null): QuickIdeasLocation => {
  if (!value) {
    return 'casa'
  }
  const normalized = value.trim().toLowerCase() as QuickIdeasLocation
  return LOCATION_KEYS.includes(normalized) ? normalized : 'casa'
}

const sanitizeEnergy = (value?: string | null): QuickIdeasEnergy => {
  if (!value) {
    return 'normal'
  }
  const normalized = value.trim().toLowerCase() as QuickIdeasEnergy
  return ENERGY_KEYS.includes(normalized) ? normalized : 'normal'
}

const sanitizeTime = (value?: string | null): QuickIdeasTimeWindow => {
  const numeric = Number(value)
  if (TIME_VALUES.includes(numeric as QuickIdeasTimeWindow)) {
    return numeric as QuickIdeasTimeWindow
  }
  if (numeric <= 5) {
    return 5
  }
  if (numeric <= 10) {
    return 10
  }
  return 20
}

const sanitizeAgeBucket = (value?: string | null): QuickIdeasAgeBucket => {
  if (!value) {
    return '2-3'
  }
  const normalized = value.trim() as QuickIdeasAgeBucket
  return ['0-1', '2-3', '4-5', '6-7', '8+'].includes(normalized) ? normalized : '2-3'
}

const normalizeChildId = (value?: string | null): string | null => {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

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
  children: Array<{ id?: string; name?: string | null; ageRange?: string | null }>
): ProfileChildSummary[] => {
  if (!children || children.length === 0) {
    return []
  }

  const mapped = children.map<ProfileChildSummary>((child, index) => {
    const id = child.id && child.id.trim() ? child.id.trim() : `child-${index + 1}`
    const name = child.name && child.name.trim() ? child.name.trim() : undefined
    const age_bucket = sanitizeAgeBucket(child.ageRange ?? undefined)
    return { id, name, age_bucket }
  })

  return dedupeChildren(mapped)
}

export default async function DescobrirPage({ searchParams }: { searchParams?: SearchParams }) {
  noStore()

  const jar = cookies()
  const { profile, metadata } = readProfileCookie(jar)

  const profileChildren = buildProfileChildren(profile.children ?? [])
  const fallbackChildren =
    profileChildren.length > 0
      ? profileChildren
      : [
          {
            id: 'demo-child',
            name: 'Luna',
            age_bucket: '2-3' as QuickIdeasAgeBucket,
          },
        ]

  const rawModeValue =
    typeof searchParams?.mode === 'string' ? searchParams.mode : metadata.mode
  const normalizedMode =
    typeof rawModeValue === 'string' ? rawModeValue.trim().toLowerCase() : ''
  const requestedMode: ProfileMode =
    normalizedMode === 'all' && fallbackChildren.length > 1 ? 'all' : 'single'

  const searchParamChildId = normalizeChildId(
    typeof searchParams?.child === 'string' ? searchParams.child : undefined
  )
  const metadataChildId = normalizeChildId(metadata.activeChildId ?? null)
  const fallbackActiveChildId = normalizeChildId(fallbackChildren[0]?.id ?? null)

  const activeChildId: string | null =
    searchParamChildId ?? metadataChildId ?? fallbackActiveChildId

  const activeChild =
    (activeChildId ? fallbackChildren.find((child) => child.id === activeChildId) : null) ??
    fallbackChildren[0]

  const filters = QuickIdeasFiltersSchema.parse({
    location: sanitizeLocation(typeof searchParams?.location === 'string' ? searchParams.location : undefined),
    time_window_min: sanitizeTime(typeof searchParams?.tempo === 'string' ? searchParams.tempo : undefined),
    energy: sanitizeEnergy(typeof searchParams?.energia === 'string' ? searchParams.energia : undefined),
  })

  const serverFlags = getServerFlags({
    cookies: (name) => jar.get(name)?.value,
    searchParams,
  })

  const {
    recShelf: recShelfEnabled,
    flashRoutine: flashRoutineEnabled,
    flashRoutineAI: flashRoutineAIEnabled,
    selfCare: selfCareEnabled,
    selfCareAI: selfCareAIEnabled,
  } = serverFlags

  const ideasCatalog = IdeaLiteSchema.array().parse(FLASH_IDEAS_CATALOG)
  const routinesCatalog = FlashRoutineSchema.array().parse(FLASH_ROUTINES_CMS)
  const recProductsCatalog = RecProductSchema.array().parse(REC_PRODUCTS)
  const selfCareCatalog = SelfCareSchema.array().parse(SELF_CARE_CMS)

  const dateKey = getBrazilDateKey()

  const targetBuckets: QuickIdeasAgeBucket[] =
    requestedMode === 'all'
      ? fallbackChildren.map((child) => child.age_bucket)
      : [(activeChild?.age_bucket ?? '2-3') as QuickIdeasAgeBucket]

  const recShelfGroups = recShelfEnabled
    ? buildRecShelves({
        products: recProductsCatalog,
        targetBuckets,
        location: filters.location,
        dateKey,
      })
    : []

  const profileSummary: ProfileSummaryT = ProfileSummarySchema.parse({
    mode: requestedMode,
    activeChildId,
    children: fallbackChildren,
  })

  const flashFilters = FlashRoutineFiltersSchema.parse(toFlashFilters(filters))

  const flashRoutineResult = flashRoutineEnabled
    ? selectFlashRoutine({
        ideas: ideasCatalog,
        routines: routinesCatalog,
        profile: { mode: profileSummary.mode, children: profileSummary.children },
        filters: flashFilters,
        dateKey,
      })
    : null

  const flashRoutineRoutine = flashRoutineResult
    ? FlashRoutineSchema.parse(flashRoutineResult.routine)
    : null

  const flashRoutine = flashRoutineEnabled && flashRoutineResult && flashRoutineRoutine
    ? {
        routine: flashRoutineRoutine,
        strategy: flashRoutineResult.source,
        analyticsSource: 'local' as const,
      }
    : null

  const selfCareSelection = selfCareEnabled
    ? selectSelfCareItems({
        items: selfCareCatalog,
        energy: filters.energy,
        minutes: filters.time_window_min as 2 | 5 | 10,
        dateKey,
      })
    : { items: [], rotationKey: '', source: 'fallback' as const }

  const suggestions = buildDailySuggestions(
    profileSummary,
    filters,
    dateKey,
    QUICK_IDEAS_CATALOG
  )

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
    child: child
      ? {
          id: child.id,
          name: child.name,
          age_bucket: child.age_bucket,
        }
      : undefined,
  }))

  const initialAgeFilter = fallbackChildren[0]?.age_bucket ?? '2-3'
  const initialPlaceFilter = LOCATION_LABEL[filters.location]

  return (
    <DescobrirClient
      suggestions={suggestionViews}
      filters={filters}
      dateKey={dateKey}
      profile={profileSummary}
      initialAgeFilter={initialAgeFilter}
      initialPlaceFilter={initialPlaceFilter}
      recProducts={recProducts}
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
