'use client'

/**
 * P9.3 — Sinal leve do Eu360 (client-only)
 * Lê a persona salva no Eu360 (LS: eu360_persona_v1) e traduz em um sinal simples:
 * - light | ok | heavy
 *
 * Sem diagnóstico, sem score, sem histórico clínico.
 * Apenas ajuste de densidade e tom em outras áreas do app.
 */

export type Eu360DaySignal = 'light' | 'ok' | 'heavy'

type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

type PersonaResult = {
  persona: PersonaId
  label: string
  microCopy: string
  updatedAtISO: string
  answers: Record<string, unknown>
}

const LS_KEYS = {
  eu360Persona: 'eu360_persona_v1',
} as const

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function personaToSignal(persona: PersonaId): Eu360DaySignal {
  // Mapeamento intencionalmente simples e não clínico
  if (persona === 'sobrevivencia') return 'heavy'
  if (persona === 'organizacao') return 'ok'
  if (persona === 'conexao') return 'ok'
  if (persona === 'equilibrio') return 'light'
  return 'light' // expansao
}

export function getEu360DaySignal(): Eu360DaySignal {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  const parsed = safeParseJSON<PersonaResult>(raw)

  const persona = parsed?.persona
  if (!persona) return 'ok'

  return personaToSignal(persona)
}
