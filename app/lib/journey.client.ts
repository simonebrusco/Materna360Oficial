'use client'

/**
 * P26 — Minha Jornada (client-only)
 * Fonte única: localStorage
 *
 * Jornada ≠ tarefas
 * Jornada = marcas simbólicas do dia
 *
 * Leitura simples, silenciosa e estável.
 */

export type JourneySnapshot = {
  selfcare: {
    doneToday: boolean
    count: number
  }
  family: {
    doneToday: boolean
    count: number
  }
}

/* =========================
   Helpers
========================= */

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

function safeGetNumber(key: string): number {
  const raw = safeGet(key)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

/* =========================
   API pública
========================= */

export function getJourneySnapshot(): JourneySnapshot {
  const today = dateKeyOfNow()

  const selfcareDoneOn = safeGet('journey/selfcare/doneOn')
  const familyDoneOn = safeGet('journey/family/doneOn')

  return {
    selfcare: {
      doneToday: selfcareDoneOn === today,
      count: safeGetNumber('journey/selfcare/doneCount'),
    },
    family: {
      doneToday: familyDoneOn === today,
      count: safeGetNumber('journey/family/doneCount'),
    },
  }
}
