'use client'

const PREFIX = 'm360:'

/* ======================================================
   UTILIDADES DE DATA
====================================================== */

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
   CORE — SAVE / LOAD / REMOVE
====================================================== */

export function save(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined') return
    const prefixedKey = `${PREFIX}${key}`
    window.localStorage.setItem(prefixedKey, JSON.stringify(value))
  } catch {}
}

export function load<T = unknown>(key: string, defaultValue?: T): T | undefined {
  try {
    if (typeof window === 'undefined') return defaultValue
    const prefixedKey = `${PREFIX}${key}`
    const item = window.localStorage.getItem(prefixedKey)
    if (!item) return defaultValue
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

export function remove(key: string): void {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(`${PREFIX}${key}`)
  } catch {}
}

/* ======================================================
   EXPORT / LIMPEZA
====================================================== */

export function clearAll(): void {
  try {
    if (typeof window === 'undefined') return
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {}
}

export function exportData(): Record<string, unknown> {
  try {
    if (typeof window === 'undefined') return {}
    const out: Record<string, unknown> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(PREFIX)) {
        const clean = k.slice(PREFIX.length)
        try {
          out[clean] = JSON.parse(window.localStorage.getItem(k) || '{}')
        } catch {
          out[clean] = window.localStorage.getItem(k)
        }
      }
    }
    return out
  } catch {
    return {}
  }
}

/* ======================================================
   CONVENIÊNCIA — LISTAS
====================================================== */

export function appendItem<T>(key: string, item: T): void {
  try {
    const list = load<T[]>(key, []) ?? []
    list.push(item)
    save(key, list)
  } catch {}
}

export function loadItems<T>(key: string): T[] {
  return load<T[]>(key, []) ?? []
}

/* ======================================================
   CONTINUIDADE — MEU DIA LEVE → MEU DIA (P26)
   👉 Fonte oficial: m360:
   👉 Fallback automático para legado
====================================================== */

export type MeuDiaLeveRecentSave = {
  ts: number
  origin: 'today' | 'family' | 'selfcare' | 'home' | 'other'
  source: string
}

const RECENT_SAVE_KEY = 'my_day_recent_save_v1'
const LAST_HANDLED_TS_KEY = 'meu_dia_leve_last_handled_ts_v1'

// chaves antigas que podem existir no localStorage cru
const LEGACY_RECENT_SAVE_KEYS = [
  'my_day_recent_save_v1',
  'm360:my_day_recent_save_v1',
  'm360.my_day_recent_save_v1',
] as const

const LEGACY_LAST_HANDLED_KEYS = [
  'meu_dia_leve_last_handled_ts_v1',
  'm360.meu_dia_leve_last_handled_ts_v1',
  'm360:meu_dia_leve_last_handled_ts_v1',
] as const

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readLegacyFirst(keys: readonly string[]): string | null {
  try {
    if (typeof window === 'undefined') return null
    for (const k of keys) {
      const v = window.localStorage.getItem(k)
      if (v) return v
    }
    return null
  } catch {
    return null
  }
}

export function loadMyDayRecentSave(): MeuDiaLeveRecentSave | null {
  // 1) novo padrão
  const v = load<MeuDiaLeveRecentSave | null>(RECENT_SAVE_KEY, null)
  if (v && typeof v.ts === 'number') return v

  // 2) legado
  const raw = readLegacyFirst(LEGACY_RECENT_SAVE_KEYS)
  const parsed = safeParseJSON<MeuDiaLeveRecentSave>(raw)
  if (parsed && typeof parsed.ts === 'number') return parsed

  return null
}

export function loadMeuDiaLeveLastHandledTs(): number {
  // 1) novo padrão
  const v = load<number | string | null>(LAST_HANDLED_TS_KEY, null)
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0
  if (Number.isFinite(n)) return n

  // 2) legado
  const raw = readLegacyFirst(LEGACY_LAST_HANDLED_KEYS)
  const ln = raw ? Number(raw) : 0
  return Number.isFinite(ln) ? ln : 0
}

export function saveMeuDiaLeveLastHandledTs(ts: number): void {
  if (!Number.isFinite(ts)) return
  save(LAST_HANDLED_TS_KEY, ts)
}
