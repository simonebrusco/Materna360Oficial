'use client'

import type { TaskOrigin } from '@/app/lib/myDayTasks.client'

export type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

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

  // P12 — ajustes de UX (sem “IA forte” ainda)
  listLimit: number // quantos itens mostrar por lista no Meu Dia
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

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000

const LIST_LIMIT_MIN = 1
const LIST_LIMIT_MAX = 12

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  const x = Math.trunc(n)
  if (x < min) return min
  if (x > max) return max
  return x
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

/**
 * Normalização premium: garante shape mínimo e evita widening/valores inválidos.
 */
function normalizePersonaResult(input: PersonaResult | null): PersonaResult {
  const fallback = fallbackPersona()
  if (!input || typeof input !== 'object') return fallback

  const persona = (input.persona as PersonaId) ?? fallback.persona
  const allowedPersona: PersonaId[] = ['sobrevivencia', 'organizacao', 'conexao', 'equilibrio', 'expansao']
  const safePersona: PersonaId = allowedPersona.includes(persona) ? persona : fallback.persona

  const label = typeof input.label === 'string' && input.label.trim() ? input.label.trim() : fallback.label
  const microCopy =
    typeof input.microCopy === 'string' && input.microCopy.trim() ? input.microCopy.trim() : fallback.microCopy

  const updatedAtISO =
    typeof input.updatedAtISO === 'string' && input.updatedAtISO.trim() ? input.updatedAtISO : fallback.updatedAtISO

  const answers = (input.answers && typeof input.answers === 'object' ? input.answers : {}) as QuestionnaireAnswers

  return { persona: safePersona, label, microCopy, updatedAtISO, answers }
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

/**
 * P12 — Mapeamento oficial de persona → signal
 * - Sobrevivência/Organização/Conexão: “proteção de carga” (tom gentil + menos volume + frase do menos)
 * - Equilíbrio/Expansão: “ritmo de avanço” (tom direto + mais volume)
 */
function signalFromPersona(result: PersonaResult): Eu360Signal {
  const base: Eu360Signal = {
    persona: result.persona,
    label: result.label,
    microCopy: result.microCopy,
    listLimit: 5,
    tone: 'gentil',
    showLessLine: false,
  }

  let s: Eu360Signal

  switch (result.persona) {
    case 'sobrevivencia':
      s = { ...base, listLimit: 3, tone: 'gentil', showLessLine: true }
      break
    case 'organizacao':
      // premium: ainda gentil, porque a mãe já está no modo “segurar a rotina”, não “performance”
      s = { ...base, listLimit: 4, tone: 'gentil', showLessLine: true }
      break
    case 'conexao':
      s = { ...base, listLimit: 5, tone: 'gentil', showLessLine: true }
      break
    case 'equilibrio':
      s = { ...base, listLimit: 6, tone: 'direto', showLessLine: false }
      break
    case 'expansao':
    default:
      s = { ...base, listLimit: 7, tone: 'direto', showLessLine: false }
      break
  }

  // Hard safety: evita listLimit fora do range (caso alguém altere mapping no futuro)
  return { ...s, listLimit: clampInt(s.listLimit, LIST_LIMIT_MIN, LIST_LIMIT_MAX, 5) }
}

export function getEu360Signal(): Eu360Signal {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  const stored = safeParseJSON<PersonaResult>(raw)
  const normalized = normalizePersonaResult(stored)
  return signalFromPersona(normalized)
}

/**
 * Agrupamento de origens:
 * - "Para hoje" inclui origens do Planner: top3 e agenda
 */
export function groupIdFromOrigin(origin: TaskOrigin): GroupId {
  if (origin === 'today' || origin === 'top3' || origin === 'agenda') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

function isFiniteTs(ts: unknown): ts is number {
  return typeof ts === 'number' && Number.isFinite(ts)
}

export function getRecentMyDaySave(maxAgeMs = DEFAULT_MAX_AGE_MS): RecentSavePayload | null {
  const raw = safeGetLS(LS_KEYS.recentSave)
  const payload = safeParseJSON<RecentSavePayload>(raw)
  if (!payload || typeof payload !== 'object') return null

  const ts = payload.ts
  if (!isFiniteTs(ts)) return null

  const age = Date.now() - ts
  if (!Number.isFinite(age) || age < 0) return null

  const maxAge = clampInt(maxAgeMs, 500, 24 * 60 * 60 * 1000, DEFAULT_MAX_AGE_MS)
  if (age > maxAge) return null

  if (typeof payload.source !== 'string') return null
  if (typeof payload.origin !== 'string') return null

  return payload
}

export function clearRecentMyDaySave() {
  safeRemoveLS(LS_KEYS.recentSave)
}

export function setRecentMyDaySave(payload: RecentSavePayload) {
  // premium: só grava se parecer minimamente válido, para não “sujar” o LS
  try {
    if (!payload || typeof payload !== 'object') return
    if (!isFiniteTs(payload.ts)) return
    if (typeof payload.origin !== 'string') return
    if (typeof payload.source !== 'string') return

    safeSetLS(LS_KEYS.recentSave, JSON.stringify(payload))
  } catch {
    // nunca quebra fluxo
  }
}
