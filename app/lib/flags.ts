export type DiscoverFlags = {
  recShelf: boolean
  recShelfAI: boolean
  flashRoutine: boolean
  flashRoutineAI: boolean
  selfCare: boolean
  selfCareAI: boolean
}

const DEFAULTS: DiscoverFlags = {
  recShelf: false,
  recShelfAI: false,
  flashRoutine: false,
  flashRoutineAI: false,
  selfCare: false,
  selfCareAI: false,
}

type ServerFlagContext = {
  cookies?: (name: string) => string | undefined
  searchParams?: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
}

const getSearchParam = (
  context: ServerFlagContext | undefined,
  key: string
): string | null => {
  if (!context?.searchParams) {
    return null
  }

  const params = context.searchParams

  if (params instanceof URLSearchParams) {
    return params.get(key)
  }

  const value = params[key]

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return typeof value === 'string' ? value : null
}

export function getServerFlags(context?: ServerFlagContext): DiscoverFlags {
  const betaQuery = getSearchParam(context, 'beta')
  const cookieBeta = context?.cookies?.('beta') ?? null
  const isBeta = betaQuery === '1' || cookieBeta === '1'

  const fromEnv: Partial<DiscoverFlags> = {
    recShelf: process.env.FEATURE_DISCOVER_RECSHELF === '1',
    recShelfAI: process.env.FEATURE_DISCOVER_RECSHELF_AI === '1',
    flashRoutine: process.env.FEATURE_DISCOVER_FLASH === '1',
    flashRoutineAI: process.env.FEATURE_DISCOVER_FLASH_AI === '1',
    selfCare: process.env.FEATURE_DISCOVER_SELFCARE === '1',
    selfCareAI: process.env.FEATURE_DISCOVER_SELFCARE_AI === '1',
  }

  const staffBoost: Partial<DiscoverFlags> = isBeta
    ? { recShelf: true, flashRoutine: true, selfCare: true }
    : {}

  return {
    ...DEFAULTS,
    ...fromEnv,
    ...staffBoost,
  }
}

export function getClientFlags(hydrated: Partial<DiscoverFlags> | null | undefined): DiscoverFlags {
  return {
    ...DEFAULTS,
    ...(hydrated ?? {}),
  }
}

export function isEnabled(flag: 'FF_LAYOUT_V1' | 'FF_FEEDBACK_KIT' | 'FF_HOME_V1'): boolean {
  if (typeof process === 'undefined') return false

  // In dev/preview: respect env exactly (default false).
  // In production: default to true for safety.
  const isProd = process.env.NODE_ENV === 'production'

  if (flag === 'FF_LAYOUT_V1') {
    const raw = process.env.NEXT_PUBLIC_FF_LAYOUT_V1
      ? String(process.env.NEXT_PUBLIC_FF_LAYOUT_V1).toLowerCase()
      : undefined
    // Fallback to true in production if undefined or unrecognized.
    if (isProd) return raw === 'true' || raw === undefined
    return raw === 'true'
  }

  if (flag === 'FF_FEEDBACK_KIT') {
    const feedbackRaw = process.env.NEXT_PUBLIC_FF_FEEDBACK_KIT
      ? String(process.env.NEXT_PUBLIC_FF_FEEDBACK_KIT).toLowerCase()
      : undefined
    return feedbackRaw === 'true'
  }

  if (flag === 'FF_HOME_V1') {
    const homeRaw = process.env.NEXT_PUBLIC_FF_HOME_V1
      ? String(process.env.NEXT_PUBLIC_FF_HOME_V1).toLowerCase()
      : undefined
    return homeRaw === 'true'
  }

  return false
}
