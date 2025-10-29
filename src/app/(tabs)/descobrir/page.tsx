import { unstable_noStore as noStore } from 'next/cache'
import { cookies } from 'next/headers'

import DescobrirClient from './Client'
import { toFlashFilters } from './utils/filters'

import { nearestQuickIdeasWindow } from './utils/timeWindows'

import { FLASH_IDEAS_CATALOG } from '@/data/flashIdeas'
import { FLASH_ROUTINES_CMS } from '@/data/flashRoutines'


import { QUICK_IDEAS_CATALOG } from '@/data/quickIdeasCatalog'
import { FLASH_IDEAS_CATALOG } from '@/data/flashIdeas'
import { FLASH_ROUTINES_CMS } from '@/data/flashRoutines'
import { REC_PRODUCTS } from '@/data/recProducts'

import { SELF_CARE_CMS } from '@/data/selfCare'
import { getBrazilDateKey } from '@/lib/dateKey'
import { buildDailySuggestions } from '@/lib/quickIdeasCatalog'
import { buildRecShelves } from '@/lib/recShelf'

import { getRecShelfWithFallback, getQuickIdeasWithFallback } from '@/lib/cmsFallback'


import { selectFlashRoutine } from '@/lib/flashRoutine'
import { selectSelfCareItems } from '@/lib/selfCare'
import { readProfileCookie } from '@/lib/profileCookie'
import { getServerFlags } from '@/lib/flags'

import { trackTelemetry } from '@/lib/telemetry'


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


} from '@/lib/discoverSchemas'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,

  QuickIdeaCatalogEntry,


} from '@/types/quickIdeas'
import type { ProfileChildSummary, ProfileMode } from '@/lib/profileTypes'

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
  return nearestQuickIdeasWindow(numeric)
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

  const parsedFilters = QuickIdeasFiltersSchema.parse({
    location: sanitizeLocation(
      typeof searchParams?.location === 'string' ? searchParams.location : undefined
    ),
    time_window_min: sanitizeTime(
      typeof searchParams?.tempo === 'string' ? searchParams.tempo : undefined
    ),
    energy: sanitizeEnergy(
      typeof searchParams?.energia === 'string' ? searchParams.energia : undefined
    ),
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
    cookies: (name) => jar.get(name)?.value,
    searchParams,
  })

  const telemetryFlags = Object.fromEntries(
    Object.entries(serverFlags).map(([key, value]) => [key, Boolean(value)])
  ) as Record<string, boolean>

  const {
    recShelf: recShelfEnabled,
    flashRoutine: flashRoutineEnabled,
    flashRoutineAI: flashRoutineAIEnabled,
    selfCare: selfCareEnabled,
    selfCareAI: selfCareAIEnabled,
  } = serverFlags

  const ideasCatalog = IdeaLiteSchema.array().parse(FLASH_IDEAS_CATALOG)
  const routinesCatalog = FlashRoutineSchema.array().parse(FLASH_ROUTINES_CMS)
  const [recShelfRaw, quickIdeasRaw] = await Promise.all([
    getRecShelfWithFallback(),
    getQuickIdeasWithFallback(),
  ])
  const recProductsCatalog = RecProductSchema.array().parse(recShelfRaw)
  const quickIdeasCatalog = (Array.isArray(quickIdeasRaw) ? quickIdeasRaw : []) as QuickIdeaCatalogEntry[]
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
