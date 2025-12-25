'use client'

import { save, load, remove } from '@/app/lib/persist'

/**
 * P26 / P28 — My Day Continuity
 *
 * Contrato único para registrar e consumir
 * eventos recentes de salvamento no Meu Dia.
 *
 * ⚠️ Regras:
 * - Silencioso
 * - Sem UI
 * - Sem efeito colateral se falhar
 * - Persistência via persist.ts (m360:)
 */

export type MeuDiaContinuityOrigin =
  | 'today'
  | 'family'
  | 'selfcare'
  | 'home'
  | 'other'

export type MeuDiaContinuityPayload = {
  ts: number
  origin: MeuDiaContinuityOrigin
  source: string
}

/**
 * Chave oficial
 * (persist.ts aplica prefixo m360:)
 */
const RECENT_SAVE_KEY = 'my_day_recent_save_v1'

/**
 * Marca um salvamento recente no Meu Dia.
 * Deve ser chamado APENAS quando created === true.
 */
export function markRecentMyDaySave(input: {
  origin: MeuDiaContinuityOrigin
  source: string
}) {
  try {
    const payload: MeuDiaContinuityPayload = {
      ts: Date.now(),
      origin: input.origin,
      source: input.source,
    }
    save(RECENT_SAVE_KEY, payload)
  } catch {
    // silêncio por princípio
  }
}

/**
 * Leitura simples (sem limpar).
 * Mantida para compatibilidade.
 */
export function readRecentMyDaySave(): MeuDiaContinuityPayload | null {
  try {
    const v = load<MeuDiaContinuityPayload | null>(RECENT_SAVE_KEY, null)
    if (
      v &&
      typeof v === 'object' &&
      typeof v.ts === 'number' &&
      typeof v.origin === 'string' &&
      typeof v.source === 'string'
    ) {
      return v
    }
    return null
  } catch {
    return null
  }
}

/**
 * Leitura com TTL (default: 30 min).
 * Não remove do storage.
 */
export function readRecentMyDaySaveWithTTL(
  ttlMs: number = 30 * 60 * 1000
): MeuDiaContinuityPayload | null {
  const data = readRecentMyDaySave()
  if (!data) return null

  const age = Date.now() - data.ts
  if (age < 0) return data // clock skew benigno
  if (age > ttlMs) return null

  return data
}

/**
 * Consome o evento:
 * - lê
 * - valida TTL
 * - remove da persistência
 *
 * Use no Meu Dia para aplicar foco UMA vez.
 */
export function consumeRecentMyDaySave(
  ttlMs: number = 30 * 60 * 1000
): MeuDiaContinuityPayload | null {
  try {
    const data = readRecentMyDaySaveWithTTL(ttlMs)
    if (!data) return null

    remove(RECENT_SAVE_KEY)
    return data
  } catch {
    return null
  }
}

/**
 * Limpeza manual (QA / fallback)
 */
export function clearRecentMyDaySave() {
  try {
    remove(RECENT_SAVE_KEY)
  } catch {}
}
