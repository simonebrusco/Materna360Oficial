'use client'

/**
 * Eu360 Signals (client-only)
 *
 * Fonte (preferencial): LocalStorage (key: eu360_prefs_v1)
 * Fallback legado: LocalStorage (key: eu360_persona_v1)
 *
 * Objetivo:
 * - Emitir sinais “crus” de UX para o app (Meu Dia / Planner):
 *   - tone: 'gentil' | 'direto'
 *   - listLimit: limite sugerido de itens visíveis (ritmo)
 *   - showLessLine: se mostramos microcopy "hoje pode ser menos"
 *
 * Importante:
 * - Não é diagnóstico.
 * - Não decide free vs premium.
 * - Apenas calibra volume + tom + ritmo.
 */

export type EuTone = 'gentil' | 'direto'

export type Eu360Signal = {
  tone: EuTone
  listLimit: number
  showLessLine: boolean
  stateId?: Eu360StateId
  helpStyle?: 'diretas' | 'guiadas' | 'explorar'
}

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

export type Eu360StateId =
  | 'cansaco_acumulado'
  | 'sobrecarga_emocional'
  | 'reorganizacao'
  | 'equilibrio_conexao'
  | 'mais_energia'

type Eu360PreferencesLS = {
  // estes campos existem no Eu360Client atual
  toneLabel?: string
  microCopy?: string
  focusHint?: string
  helpStyle?: 'diretas' | 'guiadas' | 'explorar'
  updatedAtISO?: string
  answers?: QuestionnaireAnswers
}

// legado (não vamos depender disso, mas mantemos fallback)
type LegacyPersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'
type LegacyPersonaLS = {
  persona: LegacyPersonaId
  label?: string
  microCopy?: string
  updatedAtISO?: string
  answers?: Record<string, unknown>
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

/**
 * Clamp emocional do listLimit:
 * - Evita extremos.
 * - Mantém o sinal útil para ritmo, sem virar “feature”.
 */
function clampListLimit(n: number) {
  return clampInt(n, 3, 8)
}

/* ======================================================
   1) Derivação do ESTADO atual a partir das respostas
====================================================== */

function deriveStateFromAnswers(answers: QuestionnaireAnswers): Eu360StateId {
  const q1 = answers.q1
  const q3 = answers.q3
  const q4 = answers.q4
  const q6 = answers.q6

  const heavy =
    q1 === 'exausta' ||
    q1 === 'cansada' ||
    q4 === 'sobrevivencia' ||
    q6 === 'passar' ||
    q6 === 'basico'

  const emotionalOverload =
    q3 === 'emocional' ||
    q3 === 'tudo' ||
    q1 === 'oscilando'

  const reorg =
    q4 === 'organizar' ||
    q3 === 'organizacao' ||
    q3 === 'tempo' ||
    q6 === 'organizada'

  const balanceConnection =
    q4 === 'conexao' ||
    q4 === 'equilibrio' ||
    q3 === 'conexao' ||
    q6 === 'momento'

  const energy =
    q1 === 'energia' ||
    q4 === 'alem' ||
    q6 === 'avancar'

  // prioridade intencional: primeiro alívio, depois leitura, depois ritmo
  if (heavy) return 'cansaco_acumulado'
  if (emotionalOverload) return 'sobrecarga_emocional'
  if (reorg) return 'reorganizacao'
  if (balanceConnection) return 'equilibrio_conexao'
  if (energy) return 'mais_energia'

  return 'reorganizacao'
}

/* ======================================================
   2) Mapeamento: estado -> sinal do app
====================================================== */

function mapStateToSignal(stateId: Eu360StateId): Eu360Signal {
  switch (stateId) {
    case 'cansaco_acumulado':
      return { tone: 'gentil', listLimit: 3, showLessLine: true, stateId }
    case 'sobrecarga_emocional':
      return { tone: 'gentil', listLimit: 4, showLessLine: true, stateId }
    case 'reorganizacao':
      return { tone: 'gentil', listLimit: 5, showLessLine: false, stateId }
    case 'equilibrio_conexao':
      return { tone: 'direto', listLimit: 6, showLessLine: false, stateId }
    case 'mais_energia':
      return { tone: 'direto', listLimit: 7, showLessLine: false, stateId }
  }
}

/**
 * Ajuste fino por “estilo de ajuda”
 * - diretas: menos itens
 * - explorar: um pouco mais de opções (sem exagero)
 */
function applyHelpStyle(signal: Eu360Signal, helpStyle?: Eu360PreferencesLS['helpStyle']): Eu360Signal {
  if (!helpStyle) return signal
  const delta = helpStyle === 'diretas' ? -1 : helpStyle === 'explorar' ? +1 : 0
  return {
    ...signal,
    helpStyle,
    listLimit: clampListLimit(signal.listLimit + delta),
  }
}

/**
 * Fallback seguro quando não há prefs ainda.
 */
function defaultSignal(): Eu360Signal {
  return { tone: 'gentil', listLimit: 5, showLessLine: false }
}

/**
 * Fallback legado (se ainda existir eu360_persona_v1 em alguns ambientes).
 */
function mapLegacyPersonaToSignal(persona: LegacyPersonaId): Eu360Signal {
  switch (persona) {
    case 'sobrevivencia':
      return { tone: 'gentil', listLimit: 3, showLessLine: true }
    case 'organizacao':
      return { tone: 'gentil', listLimit: 4, showLessLine: true }
    case 'conexao':
      return { tone: 'gentil', listLimit: 5, showLessLine: false }
    case 'equilibrio':
      return { tone: 'direto', listLimit: 6, showLessLine: false }
    case 'expansao':
      return { tone: 'direto', listLimit: 7, showLessLine: false }
  }
}

export function getEu360Signal(): Eu360Signal {
  // 1) Preferencial: prefs atuais
  const rawPrefs = safeGetLS(LS_KEYS.eu360Prefs)
  const parsedPrefs = safeParseJSON<Eu360PreferencesLS>(rawPrefs)

  const answers = parsedPrefs?.answers
  if (answers && typeof answers === 'object') {
    const stateId = deriveStateFromAnswers(answers)
    const base = mapStateToSignal(stateId)
    const withStyle = applyHelpStyle(base, parsedPrefs?.helpStyle)
    return {
      ...withStyle,
      listLimit: clampListLimit(withStyle.listLimit),
    }
  }

  // 2) Fallback legado: persona antiga
  const rawLegacy = safeGetLS(LS_KEYS.eu360PersonaLegacy)
  const parsedLegacy = safeParseJSON<LegacyPersonaLS>(rawLegacy)
  if (parsedLegacy?.persona) {
    const mapped = mapLegacyPersonaToSignal(parsedLegacy.persona)
    return { ...mapped, listLimit: clampListLimit(mapped.listLimit) }
  }

  // 3) Default
  const d = defaultSignal()
  return { ...d, listLimit: clampListLimit(d.listLimit) }
}
