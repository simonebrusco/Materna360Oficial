'use client'

/**
 * P12 — Eu360 Signals (client-only)
 * Fonte única: LocalStorage (key: eu360_persona_v1)
 *
 * Objetivo:
 * - Traduzir a persona do Eu360 em um sinal leve para o app:
 *   - tone: 'gentil' | 'direto'
 *   - listLimit: limite sugerido de itens visíveis (ritmo)
 *   - showLessLine: se mostramos microcopy "hoje pode ser menos"
 *
 * Importante:
 * - Este sinal não é "diagnóstico".
 * - É apenas calibração de UX: volume + tom + ritmo.
 */

export type EuTone = 'gentil' | 'direto'

export type Eu360Signal = {
  tone: EuTone
  listLimit: number
  showLessLine: boolean
  personaId?: string
}

type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

type PersonaResult = {
  persona: PersonaId
  label?: string
  microCopy?: string
  updatedAtISO?: string
  answers?: Record<string, unknown>
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

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min
  return Math.max(min, Math.min(max, x))
}

/**
 * Mapeamento oficial do ritmo por persona.
 * Você pode ajustar esses números sem risco de quebrar tipagem/UI.
 */
function mapPersonaToSignal(persona: PersonaId): Eu360Signal {
  switch (persona) {
    case 'sobrevivencia':
      return {
        tone: 'gentil',
        listLimit: 3,
        showLessLine: true,
        personaId: persona,
      }
    case 'organizacao':
      return {
        tone: 'gentil',
        listLimit: 4,
        showLessLine: true,
        personaId: persona,
      }
    case 'conexao':
      return {
        tone: 'gentil',
        listLimit: 5,
        showLessLine: false,
        personaId: persona,
      }
    case 'equilibrio':
      return {
        tone: 'direto',
        listLimit: 6,
        showLessLine: false,
        personaId: persona,
      }
    case 'expansao':
      return {
        tone: 'direto',
        listLimit: 7,
        showLessLine: false,
        personaId: persona,
      }
  }
}

/**
 * Fallback seguro quando não há persona salva ainda.
 * Mantém experiência leve (sem “excesso”).
 */
function defaultSignal(): Eu360Signal {
  return { tone: 'gentil', listLimit: 5, showLessLine: false }
}

export function getEu360Signal(): Eu360Signal {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  const parsed = safeParseJSON<PersonaResult>(raw)

  const persona = parsed?.persona
  if (
    persona !== 'sobrevivencia' &&
    persona !== 'organizacao' &&
    persona !== 'conexao' &&
    persona !== 'equilibrio' &&
    persona !== 'expansao'
  ) {
    return defaultSignal()
  }

  const mapped = mapPersonaToSignal(persona)

  // Segurança extra: garante limites aceitáveis mesmo que alguém altere o LS manualmente
  return {
    ...mapped,
    listLimit: clampInt(mapped.listLimit, 1, 12),
  }
}
