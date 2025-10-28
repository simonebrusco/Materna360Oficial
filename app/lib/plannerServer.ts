import { trackTelemetry } from '@/app/lib/telemetry'

import { validatePlannerItem, type PlannerItemT } from './plannerGuard'



export const PLANNER_COOKIE_NAME = 'materna360-planner'
export const MAX_PLANNER_ITEMS_PER_DAY = 20

export const VALID_PLANNER_CATEGORIES = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'] as const
export type PlannerCategory = (typeof VALID_PLANNER_CATEGORIES)[number]

export type PlannerPayload = {
  id: string
  title: string
  dateISO: string
  timeISO: string
  category: PlannerCategory
  link?: string

  payload?: PlannerItemT

  payload?: unknown

  tags?: string[]
  createdAt: string
}

export type PlannerCookieShape = Record<string, PlannerPayload[]>

export const isValidDateISO = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
export const isValidTimeISO = (value: string) => /^\d{2}:\d{2}$/.test(value)

const sanitizeTags = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) {
    return []
  }
  const seen = new Set<string>()
  return raw
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => {
      if (!entry) {
        return false
      }
      const key = entry.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

const defaultIdFactory = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11)
}

const defaultNowFactory = () => new Date()

export function buildPlannerPayload(
  raw: any,
  options?: { idFactory?: () => string; nowFactory?: () => Date; plannerItem?: PlannerItemT }
): PlannerPayload {
  const idFactory = options?.idFactory ?? defaultIdFactory
  const nowFactory = options?.nowFactory ?? defaultNowFactory

  const title = typeof raw?.title === 'string' ? raw.title.trim() : ''
  const dateISO = typeof raw?.dateISO === 'string' ? raw.dateISO : ''
  const timeISO = typeof raw?.timeISO === 'string' ? raw.timeISO : ''
  const category = raw?.category

  if (!title) {
    throw new Error('Informe um título.')
  }
  if (!isValidDateISO(dateISO)) {
    throw new Error('Data inválida.')
  }
  if (!isValidTimeISO(timeISO)) {
    throw new Error('Horário inválido.')
  }
  if (!VALID_PLANNER_CATEGORIES.includes(category)) {
    throw new Error('Categoria inválida.')
  }


  const normalizedPlannerItem =
    options?.plannerItem ?? (raw?.payload !== undefined ? validatePlannerItem(raw.payload) : undefined)



  const payload: PlannerPayload = {
    id: idFactory(),
    title,
    dateISO,
    timeISO,
    category,
    link: typeof raw?.link === 'string' ? raw.link.trim() || undefined : undefined,

    payload: normalizedPlannerItem,

    payload: raw?.payload ?? undefined,

    tags: sanitizeTags(raw?.tags),
    createdAt: nowFactory().toISOString(),
  }

  return payload
}

export const parsePlannerCookie = (value?: string | null): PlannerCookieShape => {
  if (!value) {
    return {}
  }
  try {
    const parsed = JSON.parse(value) as PlannerCookieShape
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (error) {
    console.error('Falha ao ler cookie do planner:', error)
  }
  return {}
}

export const mergePlannerPayload = (
  existing: PlannerCookieShape,
  payload: PlannerPayload,
  limit = MAX_PLANNER_ITEMS_PER_DAY
): PlannerCookieShape => {
  const next: PlannerCookieShape = { ...existing }
  const list = next[payload.dateISO] ? [...next[payload.dateISO]] : []
  const filtered = list.filter((item) => item.id !== payload.id)
  next[payload.dateISO] = [payload, ...filtered].slice(0, limit)
  return next
}


export async function saveToPlannerSafe(
  raw: unknown
): Promise<{ ok: true; item: PlannerItemT } | { ok: false; reason: string }> {
  try {
    const item = validatePlannerItem(raw)
    trackTelemetry('planner_save_ok', { type: item.type, id: item.id })
    return { ok: true, item }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    trackTelemetry('planner_payload_invalid', { reason })
    return { ok: false, reason: 'Invalid planner item' }
  }
}
