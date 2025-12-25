'use client'

import { save, load } from '@/app/lib/persist'

/**
 * P26 / P28 — Continuidade Meu Dia
 *
 * Este módulo é o CONTRATO ÚNICO para registrar
 * que algo foi salvo em um hub (Meu Dia Leve, Meu Filho, Cuidar de Mim)
 * e permitir que o Meu Dia reaja de forma silenciosa e contextual.
 *
 * ⚠️ Importante:
 * - Não renderiza UI
 * - Não decide comportamento
 * - Apenas registra um fato de jornada
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
 * Chave oficial (persist.ts aplica prefixo m360:)
 */
const RECENT_SAVE_KEY = 'my_day_recent_save_v1'

/**
 * Marca que o usuário acabou de salvar algo
 * que deve gerar continuidade no Meu Dia.
 *
 * Deve ser chamada:
 * - APÓS addTaskToMyDay retornar ok
 * - Nos hubs: Meu Dia Leve, Meu Filho, Cuidar de Mim
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
    // silencioso por princípio
  }
}

/**
 * Leitura segura (caso algum lugar precise no futuro)
 * Hoje o MyDayGroups já faz isso, mas deixamos disponível
 * para manter o contrato completo.
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
