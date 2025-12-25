// app/lib/myDayContinuity.client.ts
'use client'

import { load, save } from '@/app/lib/persist'

/**
 * P26 — Continuidade Meu Dia Leve -> Meu Dia
 *
 * Objetivo:
 * - Quando o Meu Dia Leve salva uma ação, o Meu Dia deve “abrir” no grupo certo (hoje/família/autocuidado/casa/outros)
 * - Sem UI extra, sem toast, sem cobrança
 * - Só 1 vez por save (dedupe por ts)
 * - Janela de recência: default 30 min (configurável)
 *
 * Storage:
 * - Novo padrão: persist.ts (prefixo "m360:" aplicado internamente)
 * - Compat: tenta ler chaves legadas (sem prefixo / variações) para não quebrar usuários existentes
 */

export type MeuDiaContinuityOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

export type MeuDiaContinuityPayload = {
  ts: number
  origin: MeuDiaContinuityOrigin
  source: string
}

const RECENT_SAVE_KEY = 'my_day_recent_save_v1'
const LAST_HANDLED_TS_KEY = 'meu_dia_leve_last_handled_ts_v1'

// legados possíveis (projeto já teve variações de prefixo)
const LEGACY_RECENT_KEYS = [
  'my_day_recent_save_v1',
  'm360:my_day_recent_save_v1',
  'm360.my_day_recent_save_v1',
] as const

const LEGACY_LAST_HANDLED_KEYS = [
  'meu_dia_leve_last_handled_ts_v1',
  'm360:meu_dia_leve_last_handled_ts_v1',
  'm360.meu_dia_leve_last_handled_ts_v1',
] as const

function isOrigin(v: any): v is MeuDiaContinuityOrigin {
  return v === 'today' || v === 'family' || v === 'selfcare' || v === 'home' || v === 'other'
}

function isPayload(v: unknown): v is MeuDiaContinuityPayload {
  if (!v || typeof v !== 'object') return false
  const o: any = v
  return (
    typeof o.ts === 'number' &&
    Number.isFinite(o.ts) &&
    isOrigin(o.origin) &&
    typeof o.source === 'string' &&
    !!o.source.trim()
  )
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readLegacyFirstMatch(keys: readonly string[]): string | null {
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

/**
 * Marca um save recente (chamada pelo Meu Dia Leve, Meu Filho, Cuidar de Mim, etc.)
 */
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

/**
 * Lê o save recente (sem consumir).
 * Útil para debug, se necessário.
 */
export function readRecentMyDaySave(): MeuDiaContinuityPayload | null {
  // 1) padrão novo (persist)
  try {
    const v = load<MeuDiaContinuityPayload | null>(RECENT_SAVE_KEY, null)
    if (isPayload(v)) return v
  } catch {}

  // 2) fallback legado
  const raw = readLegacyFirstMatch(LEGACY_RECENT_KEYS)
  const parsed = safeParseJSON<unknown>(raw)
  if (isPayload(parsed)) return parsed

  return null
}

function readLastHandledTs(): number {
  // 1) padrão novo (persist)
  try {
    const v = load<number | string | null>(LAST_HANDLED_TS_KEY, null)
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0
    return Number.isFinite(n) ? n : 0
  } catch {}

  // 2) fallback legado
  const raw = readLegacyFirstMatch(LEGACY_LAST_HANDLED_KEYS)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

function writeLastHandledTs(ts: number) {
  try {
    save(LAST_HANDLED_TS_KEY, ts)
  } catch {}
}

/**
 * Consome o save recente com regras:
 * - Só se estiver dentro da janela de recência (default 30min)
 * - Só se ts for maior que lastHandledTs (dedupe)
 *
 * Retorna o payload se deve aplicar continuidade; caso contrário null.
 */
export function consumeRecentMyDaySave(opts?: { windowMs?: number }): MeuDiaContinuityPayload | null {
  const windowMs = typeof opts?.windowMs === 'number' && opts.windowMs > 0 ? opts.windowMs : 30 * 60 * 1000

  const p = readRecentMyDaySave()
  if (!p) return null

  const ageMs = Date.now() - p.ts
  if (!(ageMs >= 0 && ageMs <= windowMs)) return null

  const lastHandled = readLastHandledTs()
  const isNew = Number.isFinite(p.ts) && p.ts > (Number.isFinite(lastHandled) ? lastHandled : 0)
  if (!isNew) return null

  writeLastHandledTs(p.ts)
  return p
}
