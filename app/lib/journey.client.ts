'use client'

import { track } from '@/app/lib/telemetry'
import { addMJPointsOncePerDay } from '@/app/lib/mjPoints.client'

/**
 * P26 — Minha Jornada (client-only)
 * Fonte: LocalStorage (marcado silenciosamente por fluxos como Meu Dia / Meu Filho / Cuidar de Mim)
 *
 * Este módulo é propositalmente simples:
 * - leitura consistente (snapshot)
 * - helpers de mark (para padronizar escrita futura)
 * - nenhum “if premium”, nenhum UI coupling
 *
 * P26 — PRINCÍPIO DA JORNADA (ANTI-CULPA)
 *
 * A Jornada é acompanhamento silencioso, não produtividade.
 * Regras inegociáveis:
 * - A Jornada registra apenas o que ACONTECEU (conclusões/salvamentos/ações).
 * - Ausência não é registrada como “falha”.
 * - Não existe “dias perdidos”, “streak quebrado” ou qualquer penalidade.
 * - Repetição conta como continuidade (não como insistência / cobrança).
 *
 * Se uma mudança futura introduzir sensação de cobrança,
 * ela viola diretamente a P26 e deve ser revertida.
 */

export type JourneySnapshot = {
  selfcare: {
    doneToday: boolean
    count: number
    doneOn?: string
    lastSource?: string
  }
  family: {
    doneToday: boolean
    count: number
    doneOn?: string
  }
}

/** Keys atuais usados pela Jornada */
const LS = {
  selfcareDoneOn: 'journey/selfcare/doneOn',
  selfcareDoneCount: 'journey/selfcare/doneCount',
  selfcareLastSource: 'journey/selfcare/lastSource',

  familyDoneOn: 'journey/family/doneOn',
  familyDoneCount: 'journey/family/doneCount',
}

/**
 * Compat de storage:
 * Alguns hubs usam prefixo `m360:` para não “sumir” valores em refactors.
 * Regra: ler em ambos (sem prefixo e com prefixo) e escrever em ambos.
 */
const LS_PREFIX = 'm360:'

function dateKeyOfNow(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function safeGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const direct = window.localStorage.getItem(key)
    if (direct !== null) return direct
    return window.localStorage.getItem(`${LS_PREFIX}${key}`)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    // escreve nas duas chaves (compat)
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeNumber(v: string | null, fallback = 0): number {
  const n = v ? Number(v) : NaN
  return Number.isFinite(n) ? n : fallback
}

/**
 * Leitura única para a tela “Minha Jornada”.
 * “doneToday” = doneOn === hoje (dateKey)
 */
export function getJourneySnapshot(now: Date = new Date()): JourneySnapshot {
  const today = (() => {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })()

  const selfcareDoneOn = safeGet(LS.selfcareDoneOn) ?? undefined
  const selfcareCount = safeNumber(safeGet(LS.selfcareDoneCount), 0)
  const selfcareLastSource = safeGet(LS.selfcareLastSource) ?? undefined

  const familyDoneOn = safeGet(LS.familyDoneOn) ?? undefined
  const familyCount = safeNumber(safeGet(LS.familyDoneCount), 0)

  return {
    selfcare: {
      doneToday: !!selfcareDoneOn && selfcareDoneOn === today,
      count: selfcareCount,
      doneOn: selfcareDoneOn,
      lastSource: selfcareLastSource,
    },
    family: {
      doneToday: !!familyDoneOn && familyDoneOn === today,
      count: familyCount,
      doneOn: familyDoneOn,
    },
  }
}

/**
 * Helpers opcionais (padronizam escrita).
 * Regra canônica:
 * - 1x por dia por pilar (idempotente)
 * - Se já marcou hoje, não incrementa count e não pontua de novo
 *
 * Pontuação canônica (P34.1):
 * - family: 5 pts (1x/dia)
 * - selfcare: 5 pts (1x/dia)
 */

export function markJourneySelfcareDone(source?: string) {
  try {
    const dk = dateKeyOfNow()
    const alreadyDoneToday = safeGet(LS.selfcareDoneOn) === dk

    // Fonte é metadado: pode atualizar mesmo se já foi marcado hoje
    if (source) safeSet(LS.selfcareLastSource, source)

    if (!alreadyDoneToday) {
      safeSet(LS.selfcareDoneOn, dk)

      const raw = safeGet(LS.selfcareDoneCount)
      const n = safeNumber(raw, 0)
      safeSet(LS.selfcareDoneCount, String(n + 1))

      // 🎯 Pontuação (1x/dia)
      const delta = 5
      const res = addMJPointsOncePerDay('journey_selfcare', delta, dk)

      try {
        track('mj.points.added', {
          key: 'journey_selfcare',
          source: 'journey:selfcare',
          dateKey: dk,
          delta,
          totalAfter: res?.nextTotal ?? null,
          dayAfter: res?.nextDay ?? null,
        })
      } catch {}
    }

    try {
      track('journey.selfcare.done', { source: source ?? 'unknown', alreadyDoneToday })
    } catch {}
  } catch {}
}

export function markJourneyFamilyDone(source?: string) {
  try {
    const dk = dateKeyOfNow()
    const alreadyDoneToday = safeGet(LS.familyDoneOn) === dk

    if (!alreadyDoneToday) {
      safeSet(LS.familyDoneOn, dk)

      const raw = safeGet(LS.familyDoneCount)
      const n = safeNumber(raw, 0)
      safeSet(LS.familyDoneCount, String(n + 1))

      // 🎯 Pontuação (1x/dia)
      const delta = 5
      const res = addMJPointsOncePerDay('journey_family', delta, dk)

      try {
        track('mj.points.added', {
          key: 'journey_family',
          source: 'journey:family',
          dateKey: dk,
          delta,
          totalAfter: res?.nextTotal ?? null,
          dayAfter: res?.nextDay ?? null,
        })
      } catch {}
    }

    try {
      track('journey.family.done', { source: source ?? 'unknown', alreadyDoneToday })
    } catch {}
  } catch {}
}
