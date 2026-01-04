'use client'

/**
 * P12 — Eu360 Signals (client-only)
 *
 * Fonte primária (P34.2 evolução):
 * - LocalStorage (key: eu360_prefs_v1)
 *   -> preferências neutras: tom / intensidade / foco
 *
 * Fallback (legado):
 * - LocalStorage (key: eu360_persona_v1)
 *
 * Objetivo:
 * - Emitir um sinal leve para calibração de UX (volume + tom + ritmo),
 *   sem parecer “teste/etiqueta” e sem criar perfil fixo nomeado.
 *
 * Importante:
 * - Este sinal não é "diagnóstico".
 * - Não decide free vs premium.
 * - A decisão final de tom/densidade/prioridade deve acontecer em experience/*.
 */

export type EuTone = 'gentil' | 'direto'

export type Eu360Signal = {
  tone: EuTone
  listLimit: number
  showLessLine: boolean

  /**
   * Preferências neutras (não são “persona”):
   * - focus: para calibrar tipo de linguagem/ênfase
   * - intensity: para calibrar volume/pressão do conteúdo
   */
  focus?: 'care' | 'organization' | 'pause'
  intensity?: 'low' | 'medium'

  /**
   * Legado: só preencher se a origem do sinal for a persona antiga,
   * para compatibilidade com telemetria/integrações já existentes.
   */
  personaId?: string
}

type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

type PersonaResultLegacy = {
  persona: PersonaId
  label?: string
  microCopy?: string
  updatedAtISO?: string
  answers?: Record<string, unknown>
}

/**
 * Novo formato (P34.2):
 * preferências neutras, sem nomear “tipo de mãe” / “persona”.
 */
type Eu360Prefs = {
  tone?: EuTone | null
  intensity?: 'low' | 'medium' | null
  focus?: 'care' | 'organization' | 'pause' | null
  updatedAtISO?: string
}

const LS_KEYS = {
  eu360Prefs: 'eu360_prefs_v1',
  eu360PersonaLegacy: 'eu360_persona_v1',
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

function clampListLimit(n: number) {
  // Mantém sinal útil, sem extremos que parecem "modo premium"
  return clampInt(n, 3, 8)
}

function isPersonaId(p: unknown): p is PersonaId {
  return p === 'sobrevivencia' || p === 'organizacao' || p === 'conexao' || p === 'equilibrio' || p === 'expansao'
}

function isEuTone(t: unknown): t is EuTone {
  return t === 'gentil' || t === 'direto'
}

function isFocus(f: unknown): f is NonNullable<Eu360Signal['focus']> {
  return f === 'care' || f === 'organization' || f === 'pause'
}

function isIntensity(i: unknown): i is NonNullable<Eu360Signal['intensity']> {
  return i === 'low' || i === 'medium'
}

/**
 * Fallback seguro quando não há prefs/legado.
 */
function defaultSignal(): Eu360Signal {
  return { tone: 'gentil', listLimit: 5, showLessLine: false, intensity: 'medium', focus: 'care' }
}

/**
 * Mapeamento leve de preferências -> sinal.
 * Importante: isso NÃO cria “perfil”; apenas calibra volume/tom.
 */
function mapPrefsToSignal(prefs: Eu360Prefs): Eu360Signal {
  const base = defaultSignal()

  const tone: EuTone = isEuTone(prefs.tone) ? prefs.tone : base.tone
  const focus = isFocus(prefs.focus) ? prefs.focus : base.focus
  const intensity = isIntensity(prefs.intensity) ? prefs.intensity : base.intensity

  // Ritmo: controla listLimit + showLessLine (sem virar “regra”)
  // - low: menos volume, mais permissão de “menos”
  // - medium: padrão
  let listLimit = 5
  let showLessLine = false

  if (intensity === 'low') {
    listLimit = 4
    showLessLine = true
  } else {
    listLimit = 5
    showLessLine = false
  }

  // Ajuste leve por foco (sem exagero)
  if (focus === 'pause') {
    showLessLine = true
    listLimit = Math.max(3, listLimit - 1)
  }

  return {
    tone,
    listLimit: clampListLimit(listLimit),
    showLessLine,
    focus,
    intensity,
  }
}

/**
 * Legado: mapeamento antigo persona -> sinal (mantido como fallback).
 */
function mapLegacyPersonaToSignal(persona: PersonaId): Eu360Signal {
  switch (persona) {
    case 'sobrevivencia':
      return { tone: 'gentil', listLimit: 3, showLessLine: true, personaId: persona, intensity: 'low', focus: 'pause' }
    case 'organizacao':
      return { tone: 'gentil', listLimit: 4, showLessLine: true, personaId: persona, intensity: 'low', focus: 'organization' }
    case 'conexao':
      return { tone: 'gentil', listLimit: 5, showLessLine: false, personaId: persona, intensity: 'medium', focus: 'care' }
    case 'equilibrio':
      return { tone: 'direto', listLimit: 6, showLessLine: false, personaId: persona, intensity: 'medium', focus: 'organization' }
    case 'expansao':
      return { tone: 'direto', listLimit: 7, showLessLine: false, personaId: persona, intensity: 'medium', focus: 'organization' }
  }
}

function readPrefsFromLS(): Eu360Prefs | null {
  const raw = safeGetLS(LS_KEYS.eu360Prefs)
  return safeParseJSON<Eu360Prefs>(raw)
}

function readLegacyPersonaFromLS(): PersonaResultLegacy | null {
  const raw = safeGetLS(LS_KEYS.eu360PersonaLegacy)
  return safeParseJSON<PersonaResultLegacy>(raw)
}

/**
 * Fonte única para o app:
 * 1) tenta prefs neutras (eu360_prefs_v1)
 * 2) fallback legado (eu360_persona_v1)
 * 3) fallback default
 */
export function getEu360Signal(): Eu360Signal {
  const prefs = readPrefsFromLS()
  if (prefs && (prefs.tone || prefs.focus || prefs.intensity)) {
    const mapped = mapPrefsToSignal(prefs)
    return {
      ...mapped,
      listLimit: clampListLimit(mapped.listLimit),
    }
  }

  const legacy = readLegacyPersonaFromLS()
  const persona = legacy?.persona
  if (isPersonaId(persona)) {
    const mapped = mapLegacyPersonaToSignal(persona)
    return {
      ...mapped,
      listLimit: clampListLimit(mapped.listLimit),
    }
  }

  const d = defaultSignal()
  return { ...d, listLimit: clampListLimit(d.listLimit) }
}
