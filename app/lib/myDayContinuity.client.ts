'use client'

import { load, save, remove } from '@/app/lib/persist'

/**
 * P26 — Continuidade Meu Dia Leve -> Meu Dia
 * Fonte oficial: persist.ts (prefixo m360: aplicado internamente)
 *
 * Regras:
 * - mark: grava payload com ts (sempre)
 * - read: lê sem limpar
 * - consume: lê + valida janela de recência + de-dupe via lastHandled + limpa
 *
 * Compat (legado):
 * - tenta ler também de chaves antigas no localStorage cru, se não encontrar no persist.
 * - não faz “migrar tudo” aqui; só lê/limpa o essencial.
 */

export type MeuDiaContinuityOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

export type MeuDiaContinuityPayload = {
  ts: number
  origin: MeuDiaContinuityOrigin
  source: string
}

const RECENT_SAVE_KEY = 'my_day_recent_save_v1'
const LAST_HANDLED_TS_KEY = 'meu_dia_leve_last_handled_ts_v1'

// Janela padrão (Meu Dia abre "no lugar certo" se foi salvo recentemente)
const DEFAULT_RECENT_WINDOW_MS = 30 * 60 * 1000 // 30 min

// Legado que pode existir no storage “cru”
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

function isOrigin(v: any): v is MeuDiaContinuityOrigin {
  return v === 'today' || v === 'family' || v === 'selfcare' || v === 'home' || v === 'other'
}

function isPayload(v: unknown): v is MeuDiaContinuityPayload {
  if (!v || typeof v !== 'object') return false
  const o: any = v
  return typeof o.ts === 'number' && Number.isFinite(o.ts) && isOrigin(o.origin) && typeof o.source === 'string' && !!o.source.trim()
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
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

function readLegacyRecentSave(): MeuDiaContinuityPayload | null {
  const raw = readLegacyLSFirstMatch(LEGACY_RECENT_SAVE_KEYS)
  const parsed = safeParseJSON<unknown>(raw)
  return isPayload(parsed) ? parsed : null
}

function readLegacyLastHandledTs(): number {
  const raw = readLegacyLSFirstMatch(LEGACY_LAST_HANDLED_KEYS)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

function writeLastHandledTs(ts: number) {
  try {
    save(LAST_HANDLED_TS_KEY, ts)
  } catch {}
}

function readLastHandledTs(): number {
  try {
    const v = load<number | string | null>(LAST_HANDLED_TS_KEY, null)
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    // fallback legado
    return readLegacyLastHandledTs()
  }
}

/**
 * Marca um "save recente" (Meu Dia Leve -> Meu Dia).
 * Isso é o que o hub Meu Dia Leve deve chamar depois de salvar uma tarefa.
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
 * Lê o payload (sem limpar). Útil para debug.
 * Tenta persist primeiro, depois legado.
 */
export function readRecentMyDaySave(): MeuDiaContinuityPayload | null {
  try {
    const v = load<MeuDiaContinuityPayload | null>(RECENT_SAVE_KEY, null)
    if (isPayload(v)) return v
  } catch {}

  return readLegacyRecentSave()
}

/**
 * Consume = lê + valida recência + de-dupe + (opcional) limpa.
 * Retorna null se:
 * - não existe
 * - está fora da janela
 * - já foi "handled" (ts <= lastHandled)
 *
 * Por padrão, limpa a chave RECENT_SAVE_KEY quando:
 * - expirou (fora da janela), ou
 * - foi consumida com sucesso
 *
 * Observação: lastHandled é sempre atualizado quando consumido com sucesso.
 */
export function consumeRecentMyDaySave(opts?: {
  recentWindowMs?: number
  clearOnConsume?: boolean
  clearOnExpired?: boolean
}): MeuDiaContinuityPayload | null {
  const recentWindowMs = opts?.recentWindowMs ?? DEFAULT_RECENT_WINDOW_MS
  const clearOnConsume = opts?.clearOnConsume ?? true
  const clearOnExpired = opts?.clearOnExpired ?? true

  try {
    const payload = readRecentMyDaySave()
    if (!isPayload(payload)) return null

    const lastHandled = readLastHandledTs()
    const isNew = payload.ts > (Number.isFinite(lastHandled) ? lastHandled : 0)
    if (!isNew) return null

    const ageMs = Date.now() - payload.ts
    const isRecent = ageMs >= 0 && ageMs <= recentWindowMs

    if (!isRecent) {
      if (clearOnExpired) {
        try {
          remove(RECENT_SAVE_KEY)
        } catch {}
      }
      return null
    }

    // sucesso: marca handled
    writeLastHandledTs(payload.ts)

    // limpa se quiser
    if (clearOnConsume) {
      try {
        remove(RECENT_SAVE_KEY)
      } catch {}
    }

    return payload
  } catch {
    return null
  }
}
