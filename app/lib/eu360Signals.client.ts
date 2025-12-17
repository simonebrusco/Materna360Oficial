'use client'

export type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

export type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

export type GroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

export type PersonaResult = {
  persona: PersonaId
  label: string
  microCopy: string
  updatedAtISO: string
  answers: QuestionnaireAnswers
}

export type Eu360Signal = {
  persona: PersonaId
  label: string
  microCopy: string

  // ajustes de UX (sem “IA forte” ainda)
  listLimit: number // quantos itens mostrar por grupo no Meu Dia
  tone: 'gentil' | 'direto'
  showLessLine: boolean // se mostra frase “Hoje pode ser menos…”
}

export const LS_KEYS = {
  eu360Persona: 'eu360_persona_v1',
  recentSave: 'my_day_recent_save_v1',
} as const

export type RecentSavePayload = {
  ts: number
  origin: TaskOrigin
  source: string
}

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function fallbackPersona(): PersonaResult {
  return {
    persona: 'organizacao',
    label: 'Organização leve',
    microCopy: 'Pequenos ajustes que tiram peso da rotina — sem te exigir perfeição.',
    updatedAtISO: new Date(0).toISOString(),
    answers: {},
  }
}

function signalFromPersona(result: PersonaResult): Eu360Signal {
  // defaults (seguro)
  const base: Eu360Signal = {
    persona: result.persona,
    label: result.label,
    microCopy: result.microCopy,
    listLimit: 5,
    tone: 'gentil',
    showLessLine: true,
  }

  if (result.persona === 'sobrevivencia') {
    return { ...base, listLimit: 3, tone: 'gentil', showLessLine: true }
  }

  if (result.persona === 'organizacao') {
    return { ...base, listLimit: 5, tone: 'direto', showLessLine: true }
  }

  if (result.persona === 'conexao') {
    return { ...base, listLimit: 5, tone: 'gentil', showLessLine: true }
  }

  if (result.persona === 'equilibrio') {
    return { ...base, listLimit: 6, tone: 'direto', showLessLine: false }
  }

  // expansao
  return { ...base, listLimit: 7, tone: 'direto', showLessLine: false }
}

export function getEu360Signal(): Eu360Signal {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  const stored = safeParseJSON<PersonaResult>(raw)
  const result = stored ?? fallbackPersona()
  return signalFromPersona(result)
}

export function groupIdFromOrigin(origin: TaskOrigin): GroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

export function getRecentMyDaySave(maxAgeMs = 10 * 60 * 1000): RecentSavePayload | null {
  const raw = safeGetLS(LS_KEYS.recentSave)
  const payload = safeParseJSON<RecentSavePayload>(raw)
  if (!payload) return null

  const age = Date.now() - (payload.ts || 0)
  if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) return null

  return payload
}

export function clearRecentMyDaySave() {
  safeRemoveLS(LS_KEYS.recentSave)
}

// util para setar JSON (quando precisar, sem duplicar helpers em várias telas)
export function setRecentMyDaySave(payload: RecentSavePayload) {
  safeSetLS(LS_KEYS.recentSave, JSON.stringify(payload))
}
