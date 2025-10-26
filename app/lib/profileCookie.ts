import { cookies, type ReadonlyRequestCookies } from 'next/headers'

import { cookies as getCookies } from 'next/headers'

import { resolveAgeRange, type Child, type Profile, type AgeRange, AGE_RANGE_VALUES } from '@/app/lib/ageRange'

 type CookieStore = ReturnType<typeof getCookies>

export type ProfileCookieState = {
  profile: Profile
  metadata: {
    activeChildId?: string
    mode?: 'single' | 'all'
  }
  raw: Record<string, unknown>
}

export const PROFILE_COOKIE_NAME = 'm360_profile'

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const parseProfileCookie = (value?: string | null): Record<string, unknown> => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch (error) {
    console.error('[ProfileCookie] Failed to parse profile cookie:', error)
  }

  return {}
}

const normalizeChildRecord = (raw: unknown, fallbackIndex: number): Child | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>

  const id =
    toTrimmedString(
      typeof record.id === 'string'
        ? record.id
        : typeof record.childId === 'string'
          ? record.childId
          : typeof record.identifier === 'string'
            ? record.identifier
            : undefined
    ) ?? `child-${fallbackIndex}`

  const name =
    toTrimmedString(
      typeof record.name === 'string'
        ? record.name
        : typeof record.nome === 'string'
          ? record.nome
          : undefined
    ) ?? undefined

  const genderSource =
    typeof record.gender === 'string'
      ? record.gender
      : typeof record.genero === 'string'
        ? record.genero
        : undefined

  let gender: 'm' | 'f' | undefined
  if (genderSource) {
    const normalized = genderSource.trim().toLowerCase()
    if (normalized === 'm' || normalized === 'masculino' || normalized === 'menino') {
      gender = 'm'
    } else if (normalized === 'f' || normalized === 'feminino' || normalized === 'menina') {
      gender = 'f'
    }
  }

  const ageRangeCandidate =
    typeof record.ageRange === 'string'
      ? record.ageRange
      : typeof record.faixaEtaria === 'string'
        ? record.faixaEtaria
        : typeof record.faixaEtariaPreferida === 'string'
          ? record.faixaEtariaPreferida
          : undefined

  const birthdateCandidate =
    typeof record.birthdateISO === 'string'
      ? record.birthdateISO
      : typeof record.birthdate === 'string'
        ? record.birthdate
        : typeof record.dataNascimento === 'string'
          ? record.dataNascimento
          : typeof record.nascimento === 'string'
            ? record.nascimento
            : undefined

  const birthdateISO = toTrimmedString(birthdateCandidate)
  const resolvedAgeRange: AgeRange | null = resolveAgeRange({
    id,
    name,
    gender,
    ageRange: (AGE_RANGE_VALUES as readonly string[]).includes(ageRangeCandidate ?? '')
      ? (ageRangeCandidate as AgeRange)
      : undefined,
    birthdateISO,
  })

  return {
    id,
    name,
    gender,
    ageRange: resolvedAgeRange ?? ((AGE_RANGE_VALUES as readonly string[]).includes(ageRangeCandidate ?? '')
      ? (ageRangeCandidate as AgeRange)
      : null),
    birthdateISO: birthdateISO ?? undefined,
  }
}

export const normalizeProfileRecord = (record: Record<string, unknown>): Profile => {
  const motherName =
    toTrimmedString(record['motherName']) ?? toTrimmedString(record['nomeMae']) ?? undefined

  const childrenSource = Array.isArray(record['children'])
    ? (record['children'] as unknown[])
    : Array.isArray(record['filhos'])
      ? (record['filhos'] as unknown[])
      : []

  const seenIds = new Set<string>()
  const children: Child[] = []

  childrenSource.forEach((entry, index) => {
    const normalized = normalizeChildRecord(entry, index + 1)
    if (normalized && !seenIds.has(normalized.id)) {
      seenIds.add(normalized.id)
      children.push(normalized)
    }
  })

  return {
    motherName,
    children,
  }
}

const extractMetadata = (record: Record<string, unknown>) => {
  const activeChildId =
    toTrimmedString(
      typeof record['activeChildId'] === 'string'
        ? record['activeChildId']
        : typeof record['active_child_id'] === 'string'
          ? record['active_child_id']
          : undefined
    ) ?? undefined

  const rawMode = toTrimmedString(record['mode'])?.toLowerCase()
  const mode = rawMode === 'all' || rawMode === 'single' ? (rawMode as 'single' | 'all') : undefined

  return { activeChildId, mode }
}

export const readProfileCookie = (
  jar: CookieStore = getCookies()
): ProfileCookieState => {
  const rawProfile = jar.get(PROFILE_COOKIE_NAME)?.value ?? null
  const record = parseProfileCookie(rawProfile)
  const profile = normalizeProfileRecord(record)
  const metadata = extractMetadata(record)

  return {
    profile,
    metadata,
    raw: record,
  }
}
