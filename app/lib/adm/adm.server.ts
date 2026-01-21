// app/lib/adm/adm.server.ts
import { randomUUID } from 'crypto'

import { supabaseServer } from '@/app/lib/supabase.server'
import { assertAdmin } from '@/app/lib/adm/requireAdmin.server'

export type AdmIdeaStatus = 'draft' | 'published'
export type AdmIdeaHub = 'meu-filho' | 'cuidar-de-mim' | 'meu-dia-leve'

export type AdmIdeaRow = {
  id: string
  hub: AdmIdeaHub
  title: string
  short_description: string
  steps: string
  duration_minutes: number
  age_band: string | null
  environment: string | null
  tags: string

  // Recomendado (e esperado pela UI /admin):
  status: AdmIdeaStatus
  created_at: string
  updated_at: string
}

export type CreateIdeaInput = Omit<AdmIdeaRow, 'id' | 'created_at' | 'updated_at'>

function nowIso() {
  return new Date().toISOString()
}

/**
 * ADMIN — Lista ideias com filtros.
 * Usado pela Area /admin.
 */
export async function listIdeas(args: {
  hub?: AdmIdeaHub
  status?: AdmIdeaStatus
  q?: string
  limit?: number
  offset?: number
}): Promise<AdmIdeaRow[]> {
  await assertAdmin()
  const supabase = supabaseServer()

  const limit = Math.min(Math.max(args.limit ?? 50, 1), 200)
  const offset = Math.max(args.offset ?? 0, 0)

  let query = supabase
    .from('adm_ideas')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (args.hub) query = query.eq('hub', args.hub)
  if (args.status) query = query.eq('status', args.status)
  if (args.q && args.q.trim()) query = query.ilike('title', `%${args.q.trim()}%`)

  const { data, error } = await query
  if (error) throw new Error(`listIdeas: ${error.message}`)

  // Importante: seu wrapper tipa `data` como GenericStringError[] em alguns cenários.
  // TS recomenda o cast via unknown.
  return (data ?? []) as unknown as AdmIdeaRow[]
}

/**
 * PUBLIC READ PATH — Lista ideias publicadas por hub.
 * Regra: leitura pública NÃO exige admin.
 * Este é o caminho que os hubs vão consumir depois (sem IA como fonte primária).
 */
export async function listPublishedIdeasForHub(args: {
  hub: AdmIdeaHub
  limit?: number
}): Promise<AdmIdeaRow[]> {
  const supabase = supabaseServer()
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 200)

  const { data, error } = await supabase
    .from('adm_ideas')
    .select('*')
    .eq('hub', args.hub)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`listPublishedIdeasForHub: ${error.message}`)
  return (data ?? []) as unknown as AdmIdeaRow[]
}

/**
 * ADMIN — Busca uma ideia por id.
 * Retorna null se não existir.
 */
export async function getIdea(id: string): Promise<AdmIdeaRow | null> {
  await assertAdmin()
  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('adm_ideas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`getIdea: ${error.message}`)
  return (data ?? null) as unknown as AdmIdeaRow | null
}

/**
 * ADMIN — Cria uma ideia (id imutável).
 * Retorna o registro criado.
 */
export async function createIdea(input: CreateIdeaInput): Promise<AdmIdeaRow> {
  await assertAdmin()
  const supabase = supabaseServer()

  const id = randomUUID()
  const ts = nowIso()

  const payload = {
    id,
    ...input,
    status: (input.status ?? 'draft') as AdmIdeaStatus,
    created_at: ts,
    updated_at: ts,
  }

  const { data, error } = await supabase
    .from('adm_ideas')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(`createIdea: ${error.message}`)
  return data as unknown as AdmIdeaRow
}

/**
 * ADMIN — Atualiza campos (id imutável).
 * Retorna o registro atualizado (ou null se id não existir).
 */
export async function updateIdea(
  id: string,
  patch: Partial<Omit<AdmIdeaRow, 'id' | 'created_at' | 'updated_at'>>
): Promise<AdmIdeaRow | null> {
  await assertAdmin()
  const supabase = supabaseServer()

  const payload = {
    ...patch,
    updated_at: nowIso(),
  }

  const { data, error } = await supabase
    .from('adm_ideas')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(`updateIdea: ${error.message}`)
  return (data ?? null) as unknown as AdmIdeaRow | null
}

/**
 * ADMIN — Troca de status (draft/published)
 */
export async function setIdeaStatus(id: string, status: AdmIdeaStatus) {
  return updateIdea(id, { status })
}

/**
 * ADMIN — Delete (CRUD completo do MVP)
 */
export async function deleteIdea(id: string): Promise<{ ok: true }> {
  await assertAdmin()
  const supabase = supabaseServer()

  const { error } = await supabase.from('adm_ideas').delete().eq('id', id)
  if (error) throw new Error(`deleteIdea: ${error.message}`)
  return { ok: true }
}
