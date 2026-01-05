'use client'

/**
 * Eu360 Signals (client-only)
 *
 * Fonte principal: LocalStorage (key: eu360_prefs_v1)
 * Compat: eu360_persona_v1 (legado)
 *
 * Objetivo:
 * - Traduzir o “estado atual” e preferências do Eu360 em sinal leve para UX:
 *   - stateId: 5 estados (derivados do q1)
 *   - tone: 'gentil' | 'direto'
 *   - listLimit: limite sugerido de itens (ritmo/volume)
 *   - showLessLine: microcopy “hoje pode ser menos”
 *
 * Importante:
 * - Isso NÃO é diagnóstico e NÃO é placar.
 * - É calibração de experiência: volume + tom + ritmo.
 */

export type EuTone = 'gentil' | 'direto'

export type Eu360Signal = {
  tone: EuTone
  listLimit: number
  showLessLine: boolean
  stateId?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
}

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

type Eu360PreferencesLS = {
  toneLabel?: string
  microCopy?: string
  focusHint?: string
  helpStyle?: 'diretas' | 'guiadas' | 'explorar'
  updatedAtISO?: string
  answers?: QuestionnaireAnswers
}

type LegacyPersonaLS = {
  persona?: string
  label?: string
  microCopy?: string
  updatedAtISO?: string
  answers?: Record<string, unknown>
}

const LS_KEYS = {
  // Novo
  eu360Prefs: 'eu360_prefs_v1',
  // Legado (compat)
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
 * Clamp emocional do listLimit:
 * - evita extremos (muito baixo / muito alto)
 * - mantém utilidade de ritmo sem virar “mecanismo”
 */
function clampListLimit(n: number) {
  return clampInt(n, 3, 8)
}

function defaultSignal(): Eu360Signal {
  return { tone: 'gentil', listLimit: 5, showLessLine: false }
}

/**
 * Mapeamento dos 5 ESTADOS (q1) -> sinal
 * Intenção:
 * - exausta/cansada: menor volume, tom gentil, “pode ser menos”
 * - oscilando: tom gentil, volume médio
 * - equilibrada: tom mais claro, volume um pouco maior
 * - energia: tom direto, volume maior (sem empuxo visível — só ritmo)
 */
function mapStateToSignal(state: NonNullable<QuestionnaireAnswers['q1']>): Eu360Signal {
  switch (state) {
    case 'exausta':
      return { stateId: 'exausta', tone: 'gentil', listLimit: 3, showLessLine: true }
    case 'cansada':
      return { stateId: 'cansada', tone: 'gentil', listLimit: 4, showLessLine: true }
    case 'oscilando':
      return { stateId: 'oscilando', tone: 'gentil', listLimit: 5, showLessLine: false }
    case 'equilibrada':
      return { stateId: 'equilibrada', tone: 'direto', listLimit: 6, showLessLine: false }
    case 'energia':
      return { stateId: 'energia', tone: 'direto', listLimit: 7, showLessLine: false }
  }
}

/**
 * Ajuste fino pelo “estilo de ajuda” (q5 / helpStyle), sem mudar o estado.
 * - diretas: reduz um pouco volume
 * - explorar: permite um pouco mais volume
 */
function applyHelpStyleTuning(base: Eu360Signal, helpStyle?: Eu360PreferencesLS['helpStyle']): Eu360Signal {
  if (!helpStyle) return base

  if (helpStyle === 'diretas') {
    return { ...base, listLimit: clampListLimit(base.listLimit - 1) }
  }
  if (helpStyle === 'explorar') {
    return { ...base, listLimit: clampListLimit(base.listLimit + 1) }
  }
  return base
}

/**
 * Fallback compat para legado (quando ainda não existe eu360_prefs_v1)
 * Mantém o app funcional, mas sem forçar uma “persona” na UI.
 */
function legacyFallbackSignal(): Eu360Signal {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  const parsed = safeParseJSON<LegacyPersonaLS>(raw)

  const persona = (parsed?.persona ?? '').toLowerCase()
  // Mapeamento conservador: mantém o app estável
  if (persona.includes('sobre')) return { tone: 'gentil', listLimit: 3, showLessLine: true }
  if (persona.includes('org')) return { tone: 'gentil', listLimit: 4, showLessLine: true }
  if (persona.includes('con')) return { tone: 'gentil', listLimit: 5, showLessLine: false }
  if (persona.includes('equi')) return { tone: 'direto', listLimit: 6, showLessLine: false }
  if (persona.includes('exp')) return { tone: 'direto', listLimit: 7, showLessLine: false }

  return defaultSignal()
}

export function getEu360Signal(): Eu360Signal {
  // 1) Novo (preferido)
  const rawPrefs = safeGetLS(LS_KEYS.eu360Prefs)
  const prefs = safeParseJSON<Eu360PreferencesLS>(rawPrefs)

  const state = prefs?.answers?.q1
  const helpStyle = prefs?.helpStyle ?? prefs?.answers?.q5

  if (state) {
    const base = mapStateToSignal(state)
    const tuned = applyHelpStyleTuning(base, helpStyle)
    return {
      ...tuned,
      listLimit: clampListLimit(tuned.listLimit),
    }
  }

  // 2) Legado (compat)
  const legacy = legacyFallbackSignal()
  return { ...legacy, listLimit: clampListLimit(legacy.listLimit) }
}
