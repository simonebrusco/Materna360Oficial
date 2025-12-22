'use client'

import { track } from '@/app/lib/telemetry'

/**
 * P26 — Minha Jornada (client-only)
 * Fonte: LocalStorage (marcado silenciosamente por fluxos como Meu Dia / Meu Filho / Cuidar de Mim)
 *
 * Este módulo é propositalmente simples:
 * - leitura consistente (snapshot)
 * - helpers de mark (para padronizar escrita futura)
 * - nenhum “if premium”, nenhum UI coupling
 */
/**
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

/** Keys atuais já usados na P26 nos clients */
const LS = {
  selfcareDoneOn: 'journey/selfcare/doneOn',
  selfcareDoneCount: 'journey/selfcare/doneCount',
  selfcareLastSource: 'journey/selfcare/lastSource',

  familyDoneOn: 'journey/family/doneOn',
  familyDoneCount: 'journey/family/doneCount',
}

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
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
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
 * Você já tem marcas sendo feitas em alguns fluxos (Meu Dia / Meu Filho).
 * Estes helpers existem para, se você quiser, trocar os writes espalhados
 * por chamadas centralizadas sem mudar o behavior.
 */
export function markJourneySelfcareDone(source?: string) {
  try {
    const dk = dateKeyOfNow()
    safeSet(LS.selfcareDoneOn, dk)

    const raw = safeGet(LS.selfcareDoneCount)
    const n = safeNumber(raw, 0)
    safeSet(LS.selfcareDoneCount, String(n + 1))

    if (source) safeSet(LS.selfcareLastSource, source)

    try {
      track('journey.selfcare.done', { source: source ?? 'unknown' })
    } catch {}
  } catch {}
}

export function markJourneyFamilyDone(source?: string) {
  try {
    const dk = dateKeyOfNow()
    safeSet(LS.familyDoneOn, dk)

    const raw = safeGet(LS.familyDoneCount)
    const n = safeNumber(raw, 0)
    safeSet(LS.familyDoneCount, String(n + 1))

    try {
      track('journey.family.done', { source: source ?? 'unknown' })
    } catch {}
  } catch {}
}
