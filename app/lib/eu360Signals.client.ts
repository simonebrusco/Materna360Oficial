// app/lib/eu360Signals.client.ts
'use client'

/**
 * Eu360 Signals (client-only)
 *
 * Fonte principal: LocalStorage (key: eu360_prefs_v1)
 * Compat: eu360_persona_v1 (legado)
 *
 * Objetivo:
 * - Traduzir o “estado atual” e preferências do Eu360 em sinal leve para UX:
 *   - stateId: 5 estados canônicos (derivados preferencialmente do q4; compat via q1/persona)
 *   - tone: 'gentil' | 'direto'
 *   - listLimit: limite sugerido de itens (ritmo/volume)
 *   - showLessLine: microcopy “hoje pode ser menos”
 *
 * Importante:
 * - Isso NÃO é diagnóstico e NÃO é placar.
 * - É calibração de experiência: volume + tom + ritmo.
 */

export type EuTone = 'gentil' | 'direto'
export type EuDensity = 'compact' | 'normal'
export type PlannerDefaultView = 'day' | 'week'

/**
 * Estado canônico (compat com eu360_persona_v1 mapeado pelo Eu360Client)
 */
export type EuStateId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

export type Eu360Signal = {
  tone: EuTone
  listLimit: number
  showLessLine: boolean

  // Estado atual canônico
  stateId?: EuStateId

  /**
   * Campos opcionais de “encaixe” (não quebram consumidores atuais).
   * Se o Meu Dia/Planner quiser usar:
   * - density: calibrar o nível de densidade (compact/normal)
   * - defaultPlannerView: sugestão de modo default (Dia/Semana)
   */
  density?: EuDensity
  defaultPlannerView?: PlannerDefaultView
}

type QuestionnaireAnswers = {
  /**
   * q1 (legado/antigo): estados “sentimento/energia”
   * Observação: em versões antigas, q1 era usado como estado principal.
   */
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'

  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'

  /**
   * q4 (canônico): 5 estados que viram persona/stateId
   */
  q4?: EuStateId | 'organizar' | 'alem'

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
  return {
    tone: 'gentil',
    listLimit: 5,
    showLessLine: false,
    density: 'normal',
    defaultPlannerView: 'day',
  }
}

/**
 * Normaliza q4 (canônico) que pode vir como:
 * - 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao' (ideal)
 * - 'organizar' (legado intermediário) -> 'organizacao'
 * - 'alem' (legado intermediário) -> 'expansao'
 */
function normalizeQ4ToStateId(q4?: QuestionnaireAnswers['q4']): EuStateId | undefined {
  if (!q4) return undefined
  if (q4 === 'organizar') return 'organizacao'
  if (q4 === 'alem') return 'expansao'
  // se já for canônico
  if (q4 === 'sobrevivencia' || q4 === 'organizacao' || q4 === 'conexao' || q4 === 'equilibrio' || q4 === 'expansao') {
    return q4
  }
  return undefined
}

/**
 * Compat: converte q1 (sentimento/energia) para o state canônico.
 * Conservador por design: evita “saltos” agressivos.
 */
function mapQ1ToStateId(q1?: QuestionnaireAnswers['q1']): EuStateId | undefined {
  if (!q1) return undefined
  switch (q1) {
    case 'exausta':
      return 'sobrevivencia'
    case 'cansada':
      return 'sobrevivencia'
    case 'oscilando':
      return 'conexao'
    case 'equilibrada':
      return 'equilibrio'
    case 'energia':
      return 'expansao'
    default:
      return undefined
  }
}

/**
 * Mapeamento do estado CANÔNICO -> sinal
 * Intenção:
 * - sobrevivencia: menor volume, tom gentil, “pode ser menos”, densidade compacta
 * - organizacao: tom mais direto, volume maior, sem “pode ser menos”
 * - conexao: tom gentil, volume médio, pode ter “pode ser menos”
 * - equilibrio: tom gentil, volume médio, sem linha “pode ser menos”
 * - expansao: tom direto, volume maior, sugestão opcional week
 *
 * + sugestões opcionais para Planner:
 * - density (compact/normal)
 * - defaultPlannerView (day/week) — opcional
 */
function mapStateToSignal(state: EuStateId): Eu360Signal {
  switch (state) {
    case 'sobrevivencia':
      return {
        stateId: 'sobrevivencia',
        tone: 'gentil',
        listLimit: 3,
        showLessLine: true,
        density: 'compact',
        defaultPlannerView: 'day',
      }
    case 'organizacao':
      return {
        stateId: 'organizacao',
        tone: 'direto',
        listLimit: 6,
        showLessLine: false,
        density: 'normal',
        defaultPlannerView: 'week', // sugestão opcional
      }
    case 'conexao':
      return {
        stateId: 'conexao',
        tone: 'gentil',
        listLimit: 5,
        showLessLine: true,
        density: 'normal',
        defaultPlannerView: 'day',
      }
    case 'equilibrio':
      return {
        stateId: 'equilibrio',
        tone: 'gentil',
        listLimit: 5,
        showLessLine: false,
        density: 'normal',
        defaultPlannerView: 'day',
      }
    case 'expansao':
      return {
        stateId: 'expansao',
        tone: 'direto',
        listLimit: 6,
        showLessLine: false,
        density: 'normal',
        defaultPlannerView: 'week', // sugestão opcional
      }
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

  // Mapeamento conservador (compat com o mapeamento escrito pelo Eu360Client)
  if (persona.includes('sobre')) return mapStateToSignal('sobrevivencia')
  if (persona.includes('org')) return mapStateToSignal('organizacao')
  if (persona.includes('con')) return mapStateToSignal('conexao')
  if (persona.includes('equi')) return mapStateToSignal('equilibrio')
  if (persona.includes('exp')) return mapStateToSignal('expansao')

  return defaultSignal()
}

export function getEu360Signal(): Eu360Signal {
  // 1) Novo (preferido)
  const rawPrefs = safeGetLS(LS_KEYS.eu360Prefs)
  const prefs = safeParseJSON<Eu360PreferencesLS>(rawPrefs)

  const q4State = normalizeQ4ToStateId(prefs?.answers?.q4)
  const q1Compat = mapQ1ToStateId(prefs?.answers?.q1)
  const state: EuStateId | undefined = q4State ?? q1Compat

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
