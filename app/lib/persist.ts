'use client'

const PREFIX = 'm360:'

/**
 * Safe date utilities for persistence keys
 */
export function getCurrentDateKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function getCurrentWeekKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const firstDay = new Date(year, 0, 1)
  const pastDaysOfYear = (now.getTime() - firstDay.getTime()) / 86400000
  const week = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/* ======================================================
   P26/P28 — Continuidade (recomendado: via persist.ts)
   - Padroniza em m360:* (prefixo)
   - Faz migração silenciosa das chaves antigas sem prefixo
====================================================== */

export type MeuDiaLeveRecentSave = {
  ts: number
  origin: 'today' | 'family' | 'selfcare' | 'home' | 'other'
  source: string
}

const CONTINUITY_KEYS = {
  // novas (sem prefixo; o prefixo é aplicado por save/load)
  RECENT_SAVE: 'continuity/my_day_recent_save_v1',
  LAST_HANDLED_TS: 'continuity/meu_dia_leve_last_handled_ts_v1',

  // legadas (SEM prefixo m360:)
  LEGACY_RECENT_SAVE: 'my_day_recent_save_v1',
  LEGACY_LAST_HANDLED_TS: 'm360.meu_dia_leve_last_handled_ts_v1',

  // Jornada mínima (hoje você ainda grava direto no localStorage sem prefixo)
  // Mantemos aqui helpers "recomendados" para centralizar.
  JOURNEY_SELFCARE_DONE_ON: 'journey/selfcare/doneOn',
  JOURNEY_SELFCARE_DONE_COUNT: 'journey/selfcare/doneCount',
  JOURNEY_SELFCARE_LAST_SOURCE: 'journey/selfcare/lastSource',

  JOURNEY_FAMILY_DONE_ON: 'journey/family/doneOn',
  JOURNEY_FAMILY_DONE_COUNT: 'journey/family/doneCount',
  JOURNEY_FAMILY_LAST_SOURCE: 'journey/family/lastSource',
} as const

function isMeuDiaLeveRecentSave(v: unknown): v is MeuDiaLeveRecentSave {
  if (!v || typeof v !== 'object') return false
  const o = v as any
  const okOrigin =
    o.origin === 'today' || o.origin === 'family' || o.origin === 'selfcare' || o.origin === 'home' || o.origin === 'other'
  const okTs = typeof o.ts === 'number' && Number.isFinite(o.ts)
  const okSource = typeof o.source === 'string' && !!o.source.trim()
  return okOrigin && okTs && okSource
}

/**
 * Lê uma key LEGADA (sem prefixo m360:) e, se existir, migra para a nova (m360:)
 * - removeLegacy: por padrão removemos a chave antiga após migrar
 */
function migrateLegacyIfNeeded<T>({
  legacyKey,
  newKey,
  validate,
  removeLegacy = true,
}: {
  legacyKey: string
  newKey: string
  validate?: (v: unknown) => v is T
  removeLegacy?: boolean
}): T | null {
  try {
    if (typeof window === 'undefined') return null

    // se já existe no novo, não faz nada
    const existing = load<T>(newKey)
    if (existing !== undefined) return existing ?? null

    // tenta ler legado direto (sem prefixo)
    const raw = window.localStorage.getItem(legacyKey)
    if (!raw) return null

    let parsed: unknown = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      // legado pode ter string simples (ex.: ts)
      parsed = raw
    }

    if (validate && !validate(parsed)) return null

    // salva no novo (com prefixo)
    save(newKey, parsed)

    if (removeLegacy) {
      try {
        window.localStorage.removeItem(legacyKey)
      } catch {}
    }

    return parsed as T
  } catch {
    return null
  }
}

/**
 * Salva payload de “save recente” (Meu Dia Leve -> Meu Dia)
 */
export function saveMyDayRecentSave(payload: MeuDiaLeveRecentSave): void {
  save(CONTINUITY_KEYS.RECENT_SAVE, payload)
}

/**
 * Carrega payload de “save recente” com migração silenciosa do legado:
 * - LEGACY: my_day_recent_save_v1 (sem prefixo)
 * - NEW:    m360:continuity/my_day_recent_save_v1
 */
export function loadMyDayRecentSave(): MeuDiaLeveRecentSave | null {
  const migrated = migrateLegacyIfNeeded<MeuDiaLeveRecentSave>({
    legacyKey: CONTINUITY_KEYS.LEGACY_RECENT_SAVE,
    newKey: CONTINUITY_KEYS.RECENT_SAVE,
    validate: isMeuDiaLeveRecentSave,
  })
  if (migrated) return migrated

  const v = load<unknown>(CONTINUITY_KEYS.RECENT_SAVE)
  return isMeuDiaLeveRecentSave(v) ? v : null
}

/**
 * Salva último “ts” já tratado no Meu Dia (dedupe)
 */
export function saveMeuDiaLeveLastHandledTs(ts: number): void {
  if (!Number.isFinite(ts)) return
  save(CONTINUITY_KEYS.LAST_HANDLED_TS, ts)
}

/**
 * Carrega último “ts” já tratado, com migração silenciosa do legado:
 * - LEGACY: m360.meu_dia_leve_last_handled_ts_v1 (sem prefixo)
 * - NEW:    m360:continuity/meu_dia_leve_last_handled_ts_v1
 */
export function loadMeuDiaLeveLastHandledTs(): number {
  const migrated = migrateLegacyIfNeeded<number>({
    legacyKey: CONTINUITY_KEYS.LEGACY_LAST_HANDLED_TS,
    newKey: CONTINUITY_KEYS.LAST_HANDLED_TS,
    validate: (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v),
  })
  if (typeof migrated === 'number' && Number.isFinite(migrated)) return migrated

  const raw = load<unknown>(CONTINUITY_KEYS.LAST_HANDLED_TS, 0)
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
}

/**
 * Limpa a continuidade (útil para QA)
 */
export function clearContinuity(): void {
  try {
    remove(CONTINUITY_KEYS.RECENT_SAVE)
    remove(CONTINUITY_KEYS.LAST_HANDLED_TS)
  } catch {}
}

/* ======================================================
   Jornada mínima — helpers recomendados (opcional)
   (Você pode migrar MyDayGroups.tsx depois para usar isso)
====================================================== */

export function saveJourneySelfcareDoneOn(dateKey: string) {
  save(CONTINUITY_KEYS.JOURNEY_SELFCARE_DONE_ON, dateKey)
}

export function loadJourneySelfcareDoneOn(defaultValue = ''): string {
  return load<string>(CONTINUITY_KEYS.JOURNEY_SELFCARE_DONE_ON, defaultValue) ?? defaultValue
}

export function saveJourneySelfcareDoneCount(n: number) {
  save(CONTINUITY_KEYS.JOURNEY_SELFCARE_DONE_COUNT, n)
}

export function loadJourneySelfcareDoneCount(defaultValue = 0): number {
  const v = load<unknown>(CONTINUITY_KEYS.JOURNEY_SELFCARE_DONE_COUNT, defaultValue)
  return typeof v === 'number' && Number.isFinite(v) ? v : defaultValue
}

export function saveJourneySelfcareLastSource(source: string) {
  save(CONTINUITY_KEYS.JOURNEY_SELFCARE_LAST_SOURCE, source)
}

export function loadJourneySelfcareLastSource(defaultValue = ''): string {
  return load<string>(CONTINUITY_KEYS.JOURNEY_SELFCARE_LAST_SOURCE, defaultValue) ?? defaultValue
}

export function saveJourneyFamilyDoneOn(dateKey: string) {
  save(CONTINUITY_KEYS.JOURNEY_FAMILY_DONE_ON, dateKey)
}

export function loadJourneyFamilyDoneOn(defaultValue = ''): string {
  return load<string>(CONTINUITY_KEYS.JOURNEY_FAMILY_DONE_ON, defaultValue) ?? defaultValue
}

export function saveJourneyFamilyDoneCount(n: number) {
  save(CONTINUITY_KEYS.JOURNEY_FAMILY_DONE_COUNT, n)
}

export function loadJourneyFamilyDoneCount(defaultValue = 0): number {
  const v = load<unknown>(CONTINUITY_KEYS.JOURNEY_FAMILY_DONE_COUNT, defaultValue)
  return typeof v === 'number' && Number.isFinite(v) ? v : defaultValue
}

export function saveJourneyFamilyLastSource(source: string) {
  save(CONTINUITY_KEYS.JOURNEY_FAMILY_LAST_SOURCE, source)
}

export function loadJourneyFamilyLastSource(defaultValue = ''): string {
  return load<string>(CONTINUITY_KEYS.JOURNEY_FAMILY_LAST_SOURCE, defaultValue) ?? defaultValue
}

/**
 * Save a value to localStorage with m360: prefix
 * @param key - Key name (e.g., "planner:2024-W01", "diary:2024-01-15")
 * @param value - Value to save (any JSON-serializable type)
 */
export function save(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined') return
    const prefixedKey = `${PREFIX}${key}`
    const jsonValue = JSON.stringify(value)
    window.localStorage.setItem(prefixedKey, jsonValue)
  } catch (error) {
    console.error(`Failed to save localStorage key "${key}":`, error)
  }
}

/**
 * Load a value from localStorage with m360: prefix
 * @param key - Key name
 * @param defaultValue - Value to return if key not found or JSON parse fails
 * @returns Parsed value or defaultValue
 */
export function load<T = unknown>(key: string, defaultValue?: T): T | undefined {
  try {
    if (typeof window === 'undefined') return defaultValue
    const prefixedKey = `${PREFIX}${key}`
    const item = window.localStorage.getItem(prefixedKey)
    if (!item) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Failed to load localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Remove a key from localStorage with m360: prefix
 * @param key - Key name
 */
export function remove(key: string): void {
  try {
    if (typeof window === 'undefined') return
    const prefixedKey = `${PREFIX}${key}`
    window.localStorage.removeItem(prefixedKey)
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error)
  }
}

/**
 * Clear all m360: prefixed keys from localStorage
 */
export function clearAll(): void {
  try {
    if (typeof window === 'undefined') return
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * Export all m360: prefixed data as an object
 * Useful for debugging or data export
 */
export function exportData(): Record<string, unknown> {
  try {
    if (typeof window === 'undefined') return {}
    const data: Record<string, unknown> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PREFIX)) {
        const cleanKey = key.slice(PREFIX.length)
        try {
          data[cleanKey] = JSON.parse(window.localStorage.getItem(key) || '{}')
        } catch {
          // Keep invalid JSON as string
          data[cleanKey] = window.localStorage.getItem(key)
        }
      }
    }
    return data
  } catch (error) {
    console.error('Failed to export localStorage data:', error)
    return {}
  }
}

/**
 * Convenience: Save an array item (append to list)
 * @param key - List key
 * @param item - Item to append
 */
export function appendItem<T>(key: string, item: T): void {
  try {
    const list = load<T[]>(key, []) ?? []
    list.push(item)
    save(key, list)
  } catch (error) {
    console.error(`Failed to append item to "${key}":`, error)
  }
}

/**
 * Convenience: Load an array of items
 * @param key - List key
 * @returns Array of items or empty array
 */
export function loadItems<T>(key: string): T[] {
  return load<T[]>(key, []) ?? []
}

/**
 * Convenience: Save a timestamped entry (e.g., diary entries)
 * @param key - Key prefix
 * @param entry - Entry object (will add timestamp if not present)
 */
export function saveEntry<T extends Record<string, unknown>>(key: string, entry: T): void {
  try {
    const withTimestamp = {
      ...entry,
      ts: (entry as any).ts || Date.now(),
    }
    save(key, withTimestamp)
  } catch (error) {
    console.error(`Failed to save entry to "${key}":`, error)
  }
}

/**
 * Convenience: Get entries for a date range
 * @param prefix - Key prefix (e.g., "diary" for keys like "diary:2024-01-15")
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Object mapping dates to entries
 */
export function getEntriesByDateRange(prefix: string, startDate: string, endDate: string): Record<string, unknown> {
  try {
    if (typeof window === 'undefined') return {}
    const result: Record<string, unknown> = {}
    const fullPrefix = `${PREFIX}${prefix}:`
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(fullPrefix)) {
        const dateStr = key.slice(fullPrefix.length)
        const dateTime = new Date(dateStr).getTime()
        if (dateTime >= startTime && dateTime <= endTime) {
          try {
            result[dateStr] = JSON.parse(window.localStorage.getItem(key) || '{}')
          } catch {
            result[dateStr] = window.localStorage.getItem(key)
          }
        }
      }
    }
    return result
  } catch (error) {
    console.error('Failed to get entries by date range:', error)
    return {}
  }
}
