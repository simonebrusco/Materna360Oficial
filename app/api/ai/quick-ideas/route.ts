import { NextResponse } from 'next/server';
import { listPublishedIdeasForHub, type AdmIdeaHub } from '@/app/lib/adm/adm.server';
import { consolidateMaterials, youngestBucket } from '@/app/lib/quickIdeasCatalog';
import { track } from '@/app/lib/telemetry';
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasBadge,
  QuickIdeasLocation,
  QuickIdeasEnergy,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas';

export const runtime = 'nodejs';

/**
 * Payload legado (catálogo por criança / contexto).
 * Mantido integralmente para não quebrar consumidores existentes.
 */
type QuickIdeasRequestLegacy = {
  plan: 'free' | 'essencial' | 'premium'
  profile: {
    active_child_id: string | null
    mode: 'single' | 'all'
    children: Array<{ id: string; name?: string; age_bucket: QuickIdeasAgeBucket }>
  }
  context: {
    location: QuickIdeasLocation
    time_window_min: number
    energy: QuickIdeasEnergy
  }
  locale?: 'pt-BR'
}

/**
 * Memória contextual suave (modo leve):
 * - apenas para reduzir repetição
 * - aplicar tendência leve por sinal emocional
 */
type QuickIdeasLightMemory = {
  recent_suggestion_ids?: string[]
  last_signal?: 'heavy' | 'tired' | 'overwhelmed' | 'neutral'
}

/**
 * Payload leve — Meu Dia / Cuidar de Mim (P33.4)
 * 1 sugestão, sem parentalidade, sem plano.
 */
type QuickIdeasRequestLight = {
  intent: 'quick_idea'
  hub: 'my_day' | 'cuidar_de_mim'
  nonce?: number
  locale?: 'pt-BR'
  memory?: QuickIdeasLightMemory
}

type Suggestion = {
  id: string
  title: string
  description?: string
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

function isLegacyRequest(body: any): body is QuickIdeasRequestLegacy {
  return !!body && typeof body === 'object' && !!body.plan && !!body.profile && !!body.context
}

function isLightRequest(body: any): body is QuickIdeasRequestLight {
  return !!body && typeof body === 'object' && body.intent === 'quick_idea'
}

/** ---------- validações fortes (legado) ---------- */

const LOCATION_SET = new Set<QuickIdeasLocation>(['casa', 'parque', 'escola', 'area_externa'])
const ENERGY_SET = new Set<QuickIdeasEnergy>(['exausta', 'normal', 'animada'])
const MODE_SET = new Set<'single' | 'all'>(['single', 'all'])
const PLAN_SET = new Set<'free' | 'essencial' | 'premium'>(['free', 'essencial', 'premium'])

function isValidLocation(v: any): v is QuickIdeasLocation {
  return typeof v === 'string' && LOCATION_SET.has(v as QuickIdeasLocation)
}

function isValidEnergy(v: any): v is QuickIdeasEnergy {
  return typeof v === 'string' && ENERGY_SET.has(v as QuickIdeasEnergy)
}

function isValidMode(v: any): v is 'single' | 'all' {
  return typeof v === 'string' && MODE_SET.has(v as any)
}

function isValidPlan(v: any): v is 'free' | 'essencial' | 'premium' {
  return typeof v === 'string' && PLAN_SET.has(v as any)
}

function sanitizeTimeWindowMin(v: any): QuickIdeasTimeWindow {
  const n = Number(v)
  if (!Number.isFinite(n)) return 10
  if (n <= 5) return 5
  if (n <= 10) return 10
  return 20
}

/** ---------- modo leve (Meu Dia / Cuidar de Mim) ---------- */

function myDaySuggestions(): Suggestion[] {
  return [
    { id: 'md-1', title: 'Respire por 1 minuto', description: 'Só para o corpo entender que você chegou.' },
    { id: 'md-2', title: 'Escolha só uma coisa para agora', description: 'O resto pode esperar um pouco.' },
    { id: 'md-3', title: 'Faça um passo pequeno', description: 'Algo simples já organiza por dentro.' },
    { id: 'md-4', title: 'Beba um copo de água', description: 'Uma âncora rápida no presente.' },
    { id: 'md-5', title: 'Escreva uma frase do que está pesado', description: 'Só para tirar da cabeça e pôr no chão.' },
  ]
}

function chooseOne(seed: number, items: Suggestion[]) {
  const safeSeed = Number.isFinite(seed) ? seed : Date.now()
  const idx = Math.abs(safeSeed) % items.length
  return items[idx]!
}

function sanitizeRecentIds(v: any): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === 'string' && x.trim()).slice(0, 10)
}

function isValidSignal(v: any): v is NonNullable<QuickIdeasLightMemory['last_signal']> {
  return v === 'heavy' || v === 'tired' || v === 'overwhelmed' || v === 'neutral'
}

type LightSignalWithNone = NonNullable<QuickIdeasLightMemory['last_signal']> | 'none'

function chooseWithSoftMemory(opts: {
  seed: number
  suggestions: Suggestion[]
  memory?: QuickIdeasLightMemory
}): { one: Suggestion; excludedCount: number; memoryUsed: boolean; signal: LightSignalWithNone } {
  const recent = sanitizeRecentIds(opts.memory?.recent_suggestion_ids)
  const rawSignal = opts.memory?.last_signal
  const signal: LightSignalWithNone = isValidSignal(rawSignal) ? rawSignal : 'none'

  const hasMemory = recent.length > 0 || signal !== 'none'
  const excludedSet = new Set(recent)

  let pool = opts.suggestions.filter((s) => !excludedSet.has(s.id))
  const excludedCount = opts.suggestions.length - pool.length

  if (!pool.length) pool = opts.suggestions

  if (signal !== 'none') {
    const preferredIds =
      signal === 'heavy'
        ? new Set(['md-5', 'md-2'])
        : signal === 'tired'
        ? new Set(['md-1', 'md-4'])
        : signal === 'overwhelmed'
        ? new Set(['md-2', 'md-3'])
        : new Set<string>()

    if (preferredIds.size) {
      const preferred = pool.filter((s) => preferredIds.has(s.id))
      const others = pool.filter((s) => !preferredIds.has(s.id))
      if (preferred.length) pool = [...preferred, ...preferred, ...others]
    }
  }

  const one = chooseOne(opts.seed, pool)
  return { one, excludedCount, memoryUsed: hasMemory, signal }
}


async function getLightSuggestionsFromADM(hub: 'my_day' | 'cuidar_de_mim') {
  const admHub: AdmIdeaHub = hub === 'my_day' ? 'meu-dia-leve' : 'cuidar-de-mim'

  try {
    const rows = await listPublishedIdeasForHub({ hub: admHub, limit: 80 })
    const suggestions = (rows ?? [])
      .filter(r => r && typeof r.id === 'string' && r.id.trim() && typeof r.title === 'string' && r.title.trim())
      .map(r => ({
        id: r.id,
        title: r.title,
        description: (r.short_description ?? '').trim() || undefined,
      }))

    if (suggestions.length) {
      return { suggestions, source: 'adm' as const, admHub }
    }
  } catch {
    // Silent fail: do not break hubs.
  }

  return { suggestions: myDaySuggestions(), source: 'seed' as const, admHub }
}


export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequestLegacy | QuickIdeasRequestLight | null

    /**
     * =========================
     * MODO LEVE — Meu Dia / Cuidar de Mim
     * =========================
     */
    if (isLightRequest(body)) {
      const seed = typeof body.nonce === 'number' ? body.nonce : Date.now()
      const { suggestions: base, source, admHub } = await getLightSuggestionsFromADM(body.hub)
      const { one, excludedCount, memoryUsed, signal } = chooseWithSoftMemory({
        seed,
        suggestions: base,
        memory: body.memory,
      })

      try {
        track('ai.quick_ideas.light', {
          intent: body.intent,
          locale: body.locale ?? 'pt-BR',
          memory_used: memoryUsed,
          excluded_count: excludedCount,
          signal,
        })
      } catch {}

      return NextResponse.json({
        suggestions: [one],
        meta: { mode: 'my_day_light' as const, source, admHub },
      })
    }

    /**
     * =========================
     * MODO LEGADO — CATÁLOGO
     * =========================
     */
    if (!isLegacyRequest(body)) {
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!isValidPlan(body.plan)) return badRequest('Invalid plan')
    if (!isValidMode(body.profile.mode)) return badRequest('Invalid profile.mode')
    if (!isValidLocation(body.context.location)) return badRequest('Invalid context.location')
    if (!isValidEnergy(body.context.energy)) return badRequest('Invalid context.energy')

    const safeTimeWindow = sanitizeTimeWindowMin(body.context.time_window_min)

    if (body.plan === 'free') {
      return NextResponse.json({
        access: {
          denied: true,
          limited_to_one: false,
          message: 'Disponível nos planos Essencial e Premium.',
        },
        query_echo: {
          plan: body.plan,
          location: body.context.location,
          time_window_min: safeTimeWindow,
          energy: body.context.energy,
          age_buckets: body.profile.children.map((c) => c.age_bucket),
        },
        ideas: [],
        aggregates: { materials_consolidated: [] },
      })
    }

    const resolvedBucket =
      body.profile.mode === 'all'
        ? youngestBucket(body.profile.children)
        : body.profile.children.find((c) => c.id === body.profile.active_child_id)?.age_bucket ??
          body.profile.children[0]?.age_bucket

    const bucket: QuickIdeasAgeBucket = resolvedBucket ?? '2-3'
    const badges: QuickIdeasBadge[] = ['curta', 'linguagem']

    const baseIdea: QuickIdea = {
      id: 'cabana-lencois-10min',
      title: 'Cabana de Lençóis Aconchegante',
      summary: 'Montem uma cabaninha e contem uma história curta.',
      time_total_min: Math.min(10, safeTimeWindow),
      location: body.context.location,
      materials: ['lençóis', 'cadeiras', 'lanterna'],
      steps: [
        'Estenda os lençóis entre as cadeiras para formar a cabana.',
        'Entrem com a lanterna e contem uma história curtinha.',
      ],
      age_adaptations: { [bucket]: 'Adapte o tempo e as falas à idade.' },
      safety_notes: ['Supervisão constante.', 'Lanterna sem peças pequenas.'],
      badges,
      planner_payload: { type: 'idea', duration_min: 10, materials: ['lençóis', 'cadeiras', 'lanterna'] },
      rationale: 'Poucos materiais, cabe no tempo disponível e na energia atual.',
    }

    const ideas =
      body.plan === 'essencial'
        ? [baseIdea]
        : [
            baseIdea,
            { ...baseIdea, id: 'pintura-com-agua', title: 'Pintura com Água no Quintal' },
            { ...baseIdea, id: 'caixa-tesouros', title: 'Caixa de Tesouros Sensorial' },
          ]

    return NextResponse.json({
      access: {
        denied: false,
        limited_to_one: body.plan === 'essencial',
        message: body.plan === 'essencial' ? 'Plano Essencial: 1 ideia por vez.' : '',
      },
      query_echo: {
        plan: body.plan,
        location: body.context.location,
        time_window_min: safeTimeWindow,
        energy: body.context.energy,
        age_buckets: body.profile.children.map((c) => c.age_bucket),
      },
      ideas,
      aggregates: { materials_consolidated: consolidateMaterials(ideas) },
    })
  } catch (err) {
    return badRequest('Invalid JSON payload', String(err))
  }
}
