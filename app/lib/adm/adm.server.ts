import { supabaseServer } from '@/app/lib/supabase.server'
import { randomUUID } from 'crypto'
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
  status: AdmIdeaStatus
  created_at: string
  updated_at: string
}

export type CreateIdeaInput = Omit<AdmIdeaRow, 'id' | 'created_at' | 'updated_at'>

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
}) {
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

  // TS fix: supabase types podem inferir "GenericStringError[]"; convertemos via unknown.
  return (data ?? []) as unknown as AdmIdeaRow[]
}

/**
 * PUBLIC READ PATH — Lista ideias publicadas por hub.
 * Regra: leitura pública NÃO exige admin.
 * Este é o caminho que os hubs vão consumir depois (sem IA como fonte primária).
 */
export async function listPublishedIdeasForHub(args: { hub: AdmIdeaHub; limit?: number }) {
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

  const { data, error } = await supabase.from('adm_ideas').select('*').eq('id', id).maybeSingle()

  if (error) throw new Error(`getIdea: ${error.message}`)
  return (data ?? null) as unknown as AdmIdeaRow | null
}

/**
 * ADMIN — Cria uma ideia (id imutável).
 * Retorna o registro criado.
 */
export async function createIdea(input: CreateIdeaInput) {
  const id = randomUUID()

  await assertAdmin()
  const supabase = supabaseServer()

  const { data, error } = await supabase.from('adm_ideas').insert({ id, ...input }).select('*').single()

  if (error) throw new Error(`createIdea: ${error.message}`)
  return data as unknown as AdmIdeaRow
}

/**
 * ADMIN — Atualiza campos (id imutável).
 * Retorna o registro atualizado.
 */
export async function updateIdea(
  id: string,
  patch: Partial<Omit<AdmIdeaRow, 'id' | 'created_at' | 'updated_at'>>
) {
  await assertAdmin()
  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('adm_ideas')
    .update(patch)
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
export async function deleteIdea(id: string) {
  await assertAdmin()
  const supabase = supabaseServer()

  const { error } = await supabase.from('adm_ideas').delete().eq('id', id)
  if (error) throw new Error(`deleteIdea: ${error.message}`)
}

export type AdmEditorialStatus = 'draft' | 'published'

export type AdmEditorialTextRow = {
  id: string
  hub: string
  key: string | null
  context: string | null
  title: string
  body: string
  status: AdmEditorialStatus
  created_at: string
  updated_at: string
}

/**
 * PUBLIC READ PATH — Texto editorial publicado por hub/key (Base Curada).
 * Regra: leitura pública NÃO exige admin.
 */
export async function getAdmEditorialTextPublished(args: {
  hub: string
  key: string
}): Promise<Pick<AdmEditorialTextRow, 'body' | 'title' | 'context' | 'updated_at'> | null> {
  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('adm_editorial_texts')
    .select('body,title,context,updated_at')
    .eq('hub', args.hub)
    .eq('key', args.key)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`getAdmEditorialTextPublished: ${error.message}`)
  if (!data?.body) return null

  return {
    body: data.body,
    title: data.title ?? null,
    context: data.context ?? null,
    updated_at: data.updated_at ?? null,
  }
}
