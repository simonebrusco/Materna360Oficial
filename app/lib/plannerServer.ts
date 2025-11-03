export const PLANNER_COOKIE_NAME = 'planner:v1'
export const VALID_PLANNER_CATEGORIES = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'] as const

export type PlannerItem = {
  id: string
  category?: (typeof VALID_PLANNER_CATEGORIES)[number] | string
  title?: string
  notes?: string
  dateKey?: string
  createdAt?: string
}

export type PlannerPayload = {
  id: string
  category?: (typeof VALID_PLANNER_CATEGORIES)[number] | string
  title?: string
  notes?: string
  dateKey?: string
}

/** Fabrica de ID default */
function defaultIdFactory(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** "Agora" default */
function defaultNowFactory(): Date {
  return new Date()
}

/** Valida e normaliza um item vindo do cliente */
export async function saveToPlannerSafe(
  payload: unknown,
  options?: { idFactory?: () => string; nowFactory?: () => Date }
): Promise<{ ok: true; item: PlannerItem } | { ok: false; reason: string }> {
  const idFactory = options?.idFactory ?? defaultIdFactory
  const nowFactory = options?.nowFactory ?? defaultNowFactory

  if (payload == null || typeof payload !== 'object') {
    return { ok: false, reason: 'Payload ausente ou inválido.' }
  }

  const src = payload as Record<string, unknown>
  const rawTitle = typeof src.title === 'string' ? src.title.trim() : ''
  if (!rawTitle) {
    return { ok: false, reason: 'Título é obrigatório.' }
  }

  const category = typeof src.category === 'string' ? src.category.trim() : undefined
  const notes = typeof src.notes === 'string' ? src.notes : undefined
  const dateKey =
    typeof src.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(src.dateKey)
      ? src.dateKey
      : undefined

  const item: PlannerItem = {
    id: idFactory(),
    title: rawTitle,
    category,
    notes,
    dateKey,
    createdAt: nowFactory().toISOString(),
  }

  return { ok: true, item }
}

/** Constrói o payload final que será persistido no cookie */
export function buildPlannerPayload(
  body: unknown,
  options: { plannerItem: PlannerItem }
): PlannerPayload {
  const item = options.plannerItem
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    notes: item.notes,
    dateKey: item.dateKey,
  }
}

/** Parse seguro do cookie existente (retorna mapa id->payload) */
export function parsePlannerCookie(raw: string | undefined): Record<string, PlannerPayload> {
  if (!raw) return {}
  try {
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? (obj as Record<string, PlannerPayload>) : {}
  } catch {
    return {}
  }
}

/** Mescla o novo payload no mapa existente e retorna um novo mapa */
export function mergePlannerPayload(
  current: Record<string, PlannerPayload>,
  payload: PlannerPayload
): Record<string, PlannerPayload> {
  const next = { ...(current ?? {}) }
  if (payload?.id) {
    next[payload.id] = payload
  }
  return next
}
