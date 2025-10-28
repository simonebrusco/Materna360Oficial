import { createClient } from '@supabase/supabase-js'

export type PlannerItemT = {
  id: string
  title: string
  dateISO: string
  timeISO: string
  category: string
  payload?: unknown
  link?: string
  tags?: string[]
}

export type PlannerPayload =
  | { type: 'idea'; id: string; title: string; duration_min: number; materials: string[] }
  | { type: 'product'; id: string; title: string; kind: string; imageUrl: string; retailer: string; affiliateUrl: string }
  | { type: 'routine'; id: string; title: string; totalMin: number; steps: Array<{ title: string; minutes: number; ideaId?: string }>; materials: string[]; safetyNotes: string[] }
  | { type: 'selfcare'; id: string; title: string; minutes: number; steps: string[] }

export function buildPlannerPayload(
  body: unknown,
  options?: { idFactory?: () => string; nowFactory?: () => Date }
): PlannerItemT {
  const idFactory = options?.idFactory ?? (() => crypto.randomUUID())
  const nowFactory = options?.nowFactory ?? (() => new Date())

  const raw = body as Record<string, unknown>

  return {
    id: idFactory(),
    title: String(raw?.title ?? 'Evento'),
    dateISO: String(raw?.dateISO ?? nowFactory().toISOString().split('T')[0]),
    timeISO: String(raw?.timeISO ?? '12:00'),
    category: String(raw?.category ?? 'Geral'),
    payload: raw?.payload ?? undefined,
    link: raw?.link ? String(raw.link) : undefined,
    tags: Array.isArray(raw?.tags) ? raw.tags.map((t) => String(t)) : undefined,
  }
}

export async function saveToPlannerSafe({
  supabaseToken,
  payload,
}: {
  supabaseToken: string
  payload: PlannerItemT
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    )

    if (!supabaseToken) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('planner')
      .insert([payload])
      .select('id')
      .single()

    if (error) {
      console.error('[saveToPlannerSafe] Supabase error:', error)
      return { success: false, error: 'Erro ao salvar no Planner' }
    }

    return { success: true, id: data?.id ?? payload.id }
  } catch (error) {
    console.error('[saveToPlannerSafe] Error:', error)
    return { success: false, error: 'Erro inesperado ao salvar' }
  }
}
