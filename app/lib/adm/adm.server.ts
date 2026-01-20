import { supabaseServer } from '@/app/lib/supabase'
import { assertAdmin } from '@/app/lib/adm/requireAdmin.server'

export type AdmIdeaStatus = 'draft' | 'published'
export type AdmIdeaHub = 'meu-filho' | 'cuidar-de-mim' | 'meu-dia-leve'

export type AdmIdeaRow = {
  id: string
  hub: string
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

export async function listIdeas(args: {
  hub?: AdmIdeaHub
  status?: AdmIdeaStatus
  q?: string
  limit?: number
}) {
  await assertAdmin()
  const supabase = supabaseServer()

  let query = supabase
    .from('adm_ideas')
    .select('*')
    .order('updated_at', { ascending: false })

  if (args.hub) query = query.eq('hub', args.hub)
  if (args.status) query = query.eq('status', args.status)
  if (args.q && args.q.trim()) query = query.ilike('title', `%${args.q.trim()}%`)
  if (args.limit) query = query.limit(args.limit)

  const { data, error } = await query
  if (error) throw new Error(`listIdeas: ${error.message}`)
  return (data ?? []) as AdmIdeaRow[]
}

export async function getIdea(id: string) {
  await assertAdmin()
  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('adm_ideas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`getIdea: ${error.message}`)
  return data as AdmIdeaRow
}

export async function createIdea(
  input: Omit<AdmIdeaRow, 'created_at' | 'updated_at'>
) {
  await assertAdmin()
  const supabase = supabaseServer()

  const { error } = await supabase.from('adm_ideas').insert(input)
  if (error) throw new Error(`createIdea: ${error.message}`)
}

export async function updateIdea(
  id: string,
  patch: Partial<Omit<AdmIdeaRow, 'id' | 'created_at' | 'updated_at'>>
) {
  await assertAdmin()
  const supabase = supabaseServer()

  const { error } = await supabase
    .from('adm_ideas')
    .update(patch)
    .eq('id', id)

  if (error) throw new Error(`updateIdea: ${error.message}`)
}

export async function setIdeaStatus(id: string, status: AdmIdeaStatus) {
  return updateIdea(id, { status })
}
