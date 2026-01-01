import { NextResponse } from 'next/server'

import { consolidateMaterials, youngestBucket } from '@/app/lib/quickIdeasCatalog'
import { track } from '@/app/lib/telemetry'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasBadge,
  QuickIdeasLocation,
  QuickIdeasEnergy,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'

export const runtime = 'edge'

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
 * - apenas para reduzir repetição e “tendenciar” de leve a escolha
 * - opcional e compatível com clientes que não enviam nada
 */
type QuickIdeasLightMemory = {
  /**
   * IDs mostrados recentemente (ex.: últimos 3–10).
   * O endpoint tenta não repetir.
   */
  recent_suggestion_ids?: string[]

  /**
   * Sinal leve do estado atual (se o app tiver essa info).
   * Ex.: vindo do Meu Dia / emocional, etc.
   * Opcional; se não vier, não interfere.
   */
  last_signal?: 'heavy' | 'tired' | 'overwhelmed' | 'neutral'
}

/**
 * Payload leve (P33.4):
 * - 1 foco
 * - sem plano
 * - sem lista longa
 *
 * NOTA: "hub" é opcional e compatível com clientes antigos.
 */
type QuickIdeasRequestLight = {
  intent: 'quick_idea'
  hub?: 'my_day' | 'cuidar_de_mim'
  nonce?: number
  locale?: 'pt-BR'
  memory?: QuickIdeasLightMemory
}

type Suggestion = { id: string; title: string; description?: string }

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

/**
 * Cuidar de Mim (Prompt Canônico):
 * - reconhecimento leve
 * - cuidado pequeno e opcional
 * - normaliza o não fazer
 * - encerra sem expectativa
 *
 * Importante: sem memória, sem "progresso", sem "guardar", sem plano.
 */
function cuidarDeMimSuggestions(): Suggestion[] {
  return [
    { id: 'cdm-1', title: 'Solte os ombros (3 vezes)', description: 'Bem leve. Só para baixar um pouco o corpo.' },
    { id: 'cdm-2', title: 'Respire 4–2–6 (3 voltas)', description: 'Se não der, uma volta já serve.' },
    { id: 'cdm-3', title: 'Água (3 goles)', description: 'Uma âncora rápida, sem pressão.' },
    { id: 'cdm-4', title: 'Olhe pela janela (30 segundos)', description: 'Só para dar um respiro ao pensamento.' },
    { id: 'cdm-5', title: 'Mãos no peito (2 respirações)', description: 'Pequeno e suficiente.' },
  ]
}

function chooseOne(seed: number, items: Suggestion[]) {
  const safeSeed = Number.isFinite(seed) ? seed : Date.now()
  const idx = Math.abs(safeSeed) % items.length
  return items[idx]!
}

function sanitizeRecentIds(v: any): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => x.trim())
    .slice(0, 10)
}

function isValidSignal(v: any): v is QuickIdeasLightMemory['last_signal'] {
  return v === 'heavy' || v === 'tired' || v === 'overwhelmed' || v === 'neutral'
}

/**
 * Memória contextual suave (somente Meu Dia):
 * 1) remove itens vistos recentemente (recent_suggestion_ids)
 * 2) aplica uma “tendência” leve por sinal (se existir)
 * 3) se tudo for excluído, volta ao catálogo completo
 */
function chooseWithSoftMemory(opts: {
  seed: number
  suggestions: Suggestion[]
  memory?: QuickIdeasLightMemory
}): { one: Suggestion; excludedCount: number; memoryUsed: boolean; signal?: QuickIdeasLightMemory['last_signal'] } {
  const recent = sanitizeRecentIds(opts.memory?.recent_suggestion_ids)
  const signal = isValidSignal(opts.memory?.last_signal) ? opts.memory?.last_signal : undefined

  const hasMemory = recent.length > 0 || !!signal
  const excludedSet = new Set(recent)

  // Filtra repetição recente
  let pool = opts.suggestions.filter((s) => !excludedSet.has(s.id))
  const excludedCount = opts.suggestions.length - pool.length

  // Se excluiu tudo, volta ao catálogo completo (sem bloqueio)
  if (!pool.length) pool = opts.suggestions

  // Tendência bem suave por sinal (se existir)
  if (signal) {
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

      if (preferred.length) {
        pool = [...preferred, ...preferred, ...others]
      }
    }
  }

  const one = chooseOne(opts.seed, pool)
  return { one, excludedCount, memoryUsed: hasMemory, signal }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequestLegacy | QuickIdeasRequestLight | null

    /**
     * MODO LEVE (P33.4)
     * - Meu Dia: usa memória suave opcional
     * - Cuidar de Mim: SEM memória (contrato do hub)
     */
    if (isLightRequest(body)) {
      const seed = typeof body.nonce === 'number' ? body.nonce : Date.now()
      const hub = body.hub === 'cuidar_de_mim' ? 'cuidar_de_mim' : 'my_day'

      if (hub === 'cuidar_de_mim') {
        const base = cuidarDeMimSuggestions()
        const one = chooseOne(seed, base)

        try {
          track('ai.quick_ideas.light', {
            intent: body.intent,
            hub,
            locale: body.locale ?? 'pt-BR',
            memory_used: false,
            excluded_count: 0,
            signal: 'none',
          })
        } catch {}

        return NextResponse.json({
          suggestions: [one],
          meta: { mode: 'cuidar_de_mim_light' as const },
        })
      }

      // default: my_day (com memória suave)
      const base = myDaySuggestions()
      const { one, excludedCount, memoryUsed, signal } = chooseWithSoftMemory({
        seed,
        suggestions: base,
        memory: body.memory,
      })

      try {
        track('ai.quick_ideas.light', {
          intent: body.intent,
          hub,
          locale: body.locale ?? 'pt-BR',
          memory_used: memoryUsed,
          excluded_count: excludedCount,
          signal: signal ?? 'none',
        })
      } catch {}

      return NextResponse.json({
        suggestions: [one],
        meta: { mode: 'my_day_light' as const },
      })
    }

    /**
     * MODO LEGADO (Catálogo completo)
     * Mantido, mas com validação forte para evitar payload inválido.
     */
    if (!isLegacyRequest(body)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'missing_fields' })
      } catch {}
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!isValidPlan(body.plan)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_plan', plan: String(body.plan) })
      } catch {}
      return badRequest('Invalid plan')
    }

    if (!body.profile || typeof body.profile !== 'object') {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_profile' })
      } catch {}
      return badRequest('Invalid profile')
    }

    if (!isValidMode((body.profile as any).mode)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_mode', mode: String((body.profile as any).mode) })
      } catch {}
      return badRequest('Invalid profile.mode')
    }

    if (!Array.isArray(body.profile.children)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'children_not_array' })
      } catch {}
      return badRequest('Invalid profile.children')
    }

    if (!body.context || typeof body.context !== 'object') {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_context' })
      } catch {}
      return badRequest('Invalid context')
    }

    if (!isValidLocation((body.context as any).location)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_location', location: String((body.context as any).location) })
      } catch {}
      return badRequest('Invalid context.location')
    }

    if (!isValidEnergy((body.context as any).energy)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_energy', energy: String((body.context as any).energy) })
      } catch {}
      return badRequest('Invalid context.energy')
    }

    const safeTimeWindow = sanitizeTimeWindowMin((body.context as any).time_window_min)

    if (body.plan === 'free') {
      const res = {
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
          age_buckets: body.profile.children.map((child) => child.age_bucket),
        },
        ideas: [] as unknown[],
        aggregates: { materials_consolidated: [] as string[] },
      }

      try {
        track('ai.quick_ideas.legacy', { plan: body.plan })
      } catch {}

      return NextResponse.json(res)
    }

    const resolvedBucket: QuickIdeasAgeBucket | undefined =
      body.profile.mode === 'all'
        ? youngestBucket(body.profile.children)
        : body.profile.children.find((child) => child.id === body.profile.active_child_id)?.age_bucket ??
          body.profile.children[0]?.age_bucket

    const bucket: QuickIdeasAgeBucket = resolvedBucket ?? '2-3'

    const badges: QuickIdeasBadge[] = ['curta', 'linguagem']
    const ageAdaptations: Partial<Record<QuickIdeasAgeBucket, string>> = {
      [bucket]: 'Adapte o tempo e as falas à idade.',
    }

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
      age_adaptations: ageAdaptations,
      safety_notes: ['Supervisão constante; evite prender lençol em locais altos.', 'Lanterna sem peças pequenas soltas.'],
      badges,
      planner_payload: { type: 'idea', duration_min: 10, materials: ['lençóis', 'cadeiras', 'lanterna'] },
      rationale: 'Poucos materiais, cabe no tempo disponível e na energia atual.',
    }

    const ideas: QuickIdea[] =
      body.plan === 'essencial'
        ? [baseIdea]
        : [
            baseIdea,
            { ...baseIdea, id: 'pintura-com-agua', title: 'Pintura com Água no Quintal' },
            { ...baseIdea, id: 'caixa-tesouros', title: 'Caixa de Tesouros Sensorial' },
          ]

    const response = {
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
        age_buckets: body.profile.children.map((child) => child.age_bucket),
      },
      ideas,
      aggregates: { materials_consolidated: consolidateMaterials(ideas) },
    }

    try {
      track('ai.quick_ideas.legacy', {
        plan: body.plan,
        location: body.context.location,
        energy: body.context.energy,
      })
    } catch {}

    return NextResponse.json(response)
  } catch (err) {
    try {
      track('ai.quick_ideas.error', { error: String(err) })
    } catch {}
    return badRequest('Invalid JSON payload', String(err))
  }
}
