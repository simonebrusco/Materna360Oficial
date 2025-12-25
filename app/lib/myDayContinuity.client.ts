// app/lib/myDayContinuity.client.ts
'use client'

import { load, remove, save } from '@/app/lib/persist'

export type MeuDiaContinuityOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

export type MeuDiaContinuityPayload = {
  ts: number
  origin: MeuDiaContinuityOrigin
  source: string
}

const RECENT_SAVE_KEY = 'my_day_recent_save_v1'
const LAST_HANDLED_TS_KEY = 'meu_dia_leve_last_handled_ts_v1'

// Legado (pode existir no localStorage cru; não quebra usuários antigos)
const LEGACY_RECENT_SAVE_KEYS = [
  'my_day_recent_save_v1',
  'm360:my_day_recent_save_v1',
  'm360.my_day_recent_save_v1',
] as const

const LEGACY_LAST_HANDLED_KEYS = [
  'm360.meu_dia_leve_last_handled_ts_v1',
  'm360:meu_dia_leve_last_handled_ts_v1',
  'meu_dia_leve_last_handled_ts_v1',
] as const

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function isPayload(v: unknown): v is MeuDiaContinuityPayload {
  if (!v || typeof v !== 'object') return false
  const o = v as any
  const okOrigin =
    o.origin === 'today' ||
    o.origin === 'family' ||
    o.origin === 'selfcare' ||
    o.origin === 'home' ||
    o.origin === 'other'
  const okTs = typeof o.ts === 'number' && Number.isFinite(o.ts)
  const okSource = typeof o.source === 'string' && !!o.source.trim()
  return okOrigin && okTs && okSource
}

function readLegacyLSFirstMatch(keys: readonly string[]): string | null {
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

export function markRecentMyDaySave(input: { origin: MeuDiaContinuityOrigin; source: string }) {
  try {
    const payload: MeuDiaContinuityPayload = {
      ts: Date.now(),
      origin: input.origin,
      source: input.source,
    }
    save(RECENT_SAVE_KEY, payload)
  } catch {}
}

export function readRecentMyDaySave(): MeuDiaContinuityPayload | null {
  // 1) novo padrão (persist.ts)
  try {
    const v = load<MeuDiaContinuityPayload | null>(RECENT_SAVE_KEY, null)
    if (isPayload(v)) return v
  } catch {}

  // 2) legado: localStorage cru
  const raw = readLegacyLSFirstMatch(LEGACY_RECENT_SAVE_KEYS)
  const parsed = safeParseJSON<unknown>(raw)
  if (isPayload(parsed)) return parsed

  return null
}

export function readLastHandledTs(): number {
  // 1) novo padrão (persist.ts)
  try {
    const v = load<number | string | null>(LAST_HANDLED_TS_KEY, null)
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0
    return Number.isFinite(n) ? n : 0
  } catch {}

  // 2) legado: localStorage cru
  const raw = readLegacyLSFirstMatch(LEGACY_LAST_HANDLED_KEYS)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

export function writeLastHandledTs(ts: number) {
  try {
    save(LAST_HANDLED_TS_KEY, ts)
  } catch {}
}

/**
 * Consome a continuidade de forma “silenciosa”:
 * - valida payload
 * - aplica janela de recência (default 30 min)
 * - dedupe por ts (lastHandled)
 * - marca lastHandled
 * - remove RECENT_SAVE_KEY (para evitar re-trigger)
 */
export function consumeRecentMyDaySave(opts?: { windowMs?: number }): MeuDiaContinuityPayload | null {
  try {
    const payload = readRecentMyDaySave()
    if (!isPayload(payload)) return null

    const lastHandled = readLastHandledTs()
    const isNew = payload.ts > (Number.isFinite(lastHandled) ? lastHandled : 0)
    if (!isNew) return null

    const ageMs = Date.now() - payload.ts
    const windowMs = opts?.windowMs ?? 30 * 60 * 1000
    const isRecent = ageMs >= 0 && ageMs <= windowMs
    if (!isRecent) return null

    writeLastHandledTs(payload.ts)

    // limpa sinal para não repetir (dedupe já resolve, mas isso reduz ruído)
    try {
      remove(RECENT_SAVE_KEY)
    } catch {}

    return payload
  } catch {
    return null
  }
}
