import { NextResponse } from 'next/server'

import { NextResponse } from 'next/server'

import { consolidateMaterials, youngestBucket } from '@/app/lib/quickIdeasCatalog'
import { trackTelemetry } from '@/app/lib/telemetry'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasContextInput,
  QuickIdeasPlan,
  QuickIdeasProfileInput,
  QuickIdeasRequestPayload,
} from '@/app/types/quickIdeas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = process.env.OPENAI_QUICK_IDEAS_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
const API_KEY = process.env.OPENAI_API_KEY ?? process.env.GEN_AI_API_KEY

const AGE_BUCKET_ORDER: QuickIdeasAgeBucket[] = ['0-1', '2-3', '4-5', '6-7', '8+']
const AGE_BUCKET_SET = new Set<QuickIdeasAgeBucket>(AGE_BUCKET_ORDER)
const LOCATION_VALUES = ['casa', 'parque', 'escola', 'area_externa'] as const
const ENERGY_VALUES = ['exausta', 'normal', 'animada'] as const
const BADGE_VALUES = [
  'curta',
  'sem_bagunça',
  'ao_ar_livre',
  'motor_fino',
  'motor_grosso',
  'linguagem',
  'sensorial',
] as const

const SYSTEM_PROMPT = `You are Materna360 – Quick Ideas AI.
Your mission is to give overwhelmed mothers immediate, safe, age-appropriate play ideas in Portuguese (pt-BR) with very low friction (few materials, few steps, clear safety).
Voice & Tone: warm, positive, practical; short sentences; no jargon; never medical advice.
Always adapt to the child’s age bucket and to the selected location and time window. Respect mom’s energy to reduce steps/utensils.
Always output valid JSON only following the output schema provided. Do not include any text outside the JSON.

Safety rules (educational notes, not medical):
- No honey < 12 months.
- Avoid whole nuts/popcorn until safe age; use ground forms.
- Minimize salt/sugar, especially < 2 years.
- Call out common allergens when relevant.
- Add choking precautions when shapes/textures could be risky.`

const RESPONSE_SCHEMA = {
  name: 'quick_ideas_payload',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ideas: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'title',
            'summary',
            'time_total_min',
            'location',
            'materials',
            'steps',
            'age_adaptations',
            'safety_notes',
            'badges',
            'planner_payload',
            'rationale',
          ],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            time_total_min: { type: 'number' },
            location: { enum: LOCATION_VALUES },
            materials: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
            },
            steps: {
              type: 'array',
              minItems: 2,
              items: { type: 'string' },
            },
            age_adaptations: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            safety_notes: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
            },
            badges: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: { enum: BADGE_VALUES },
            },
            planner_payload: {
              type: 'object',
              additionalProperties: false,
              required: ['type', 'duration_min', 'materials'],
              properties: {
                type: { const: 'idea' },
                duration_min: { type: 'number' },
                materials: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            rationale: { type: 'string' },
          },
        },
      },
    },
    required: ['ideas'],
  },
}

const sanitizeTimeWindow = (value: number): 5 | 10 | 20 => {
  if (value <= 5) return 5
  if (value <= 10) return 10
  return 20
}

const sanitizeAgeBucket = (value?: string | null): QuickIdeasAgeBucket => {
  if (!value) {
    return '2-3'
  }
  const normalized = value.trim() as QuickIdeasAgeBucket
  return AGE_BUCKET_SET.has(normalized) ? normalized : '2-3'
}

const sanitizeChildren = (profile: QuickIdeasProfileInput): QuickIdeasProfileInput['children'] => {
  if (!Array.isArray(profile.children)) {
    return []
  }

  const seen = new Set<string>()
  const sanitized = profile.children
    .map((child, index) => {
      const id = typeof child.id === 'string' && child.id.trim() ? child.id.trim() : `child-${index + 1}`
      const name = typeof child.name === 'string' && child.name.trim() ? child.name.trim() : undefined
      const bucket = sanitizeAgeBucket(child.age_bucket)
      return { id, name, age_bucket: bucket }
    })
    .filter((child) => {
      if (seen.has(child.id)) {
        return false
      }
      seen.add(child.id)
      return true
    })

  return sanitized
}

const sanitizeContext = (context: QuickIdeasContextInput): QuickIdeasContextInput => {
  const location = LOCATION_VALUES.includes(context.location as (typeof LOCATION_VALUES)[number])
    ? context.location
    : 'casa'
  const energy = ENERGY_VALUES.includes(context.energy as (typeof ENERGY_VALUES)[number])
    ? context.energy
    : 'normal'

  return {
    location,
    energy,
    time_window_min: sanitizeTimeWindow(context.time_window_min ?? 10),
  }
}

const sanitizeProfile = (profile: QuickIdeasProfileInput): QuickIdeasProfileInput => {
  const children = sanitizeChildren(profile)
  const mode = profile.mode === 'all' ? 'all' : 'single'
  const activeChildId = typeof profile.active_child_id === 'string' ? profile.active_child_id : null
  return { active_child_id: activeChildId, children, mode }
}

const selectTargetChildren = (
  profile: QuickIdeasProfileInput
): QuickIdeasProfileInput['children'] => {
  if (profile.children.length === 0) {
    return [{ id: 'fallback-child', name: 'Criança', age_bucket: '2-3' }]
  }

  if (profile.mode === 'all') {
    return profile.children
  }

  if (profile.active_child_id) {
    const match = profile.children.find((child) => child.id === profile.active_child_id)
    if (match) {
      return [match]
    }
  }

  return [profile.children[0]]
}

type MinimalChild = {
  name?: string
  age_bucket?: string | number | null
  [key: string]: unknown
}

const normalizeChildren = (arr: unknown[] | null | undefined): MinimalChild[] => {
  if (!arr) {
    return []
  }

  return (arr as unknown[])
    .filter(Boolean)
    .map((child: any) => ({
      ...(child ?? {}),
      name: child?.name ?? undefined,
      age_bucket: child?.age_bucket ?? undefined,
    }))
}

const normalizeIdea = (idea: QuickIdea, fallbackLocation: QuickIdeasContextInput['location']): QuickIdea => {
  const safeLocation = LOCATION_VALUES.includes(idea.location as (typeof LOCATION_VALUES)[number])
    ? idea.location
    : fallbackLocation

  const timeTotal = Number.isFinite(idea.time_total_min) ? Math.max(1, Math.round(idea.time_total_min)) : 10
  const badges = Array.isArray(idea.badges)
    ? idea.badges
        .map((badge) => badge as typeof BADGE_VALUES[number])
        .filter((badge) => BADGE_VALUES.includes(badge))
        .slice(0, 2)
    : []

  const plannerMaterials = Array.isArray(idea.planner_payload?.materials)
    ? idea.planner_payload.materials.filter((entry) => typeof entry === 'string')
    : []

  return {
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    time_total_min: timeTotal,
    location: safeLocation,
    materials: Array.isArray(idea.materials) ? idea.materials.filter((item) => typeof item === 'string') : [],
    steps: Array.isArray(idea.steps) ? idea.steps.filter((item) => typeof item === 'string') : [],
    age_adaptations:
      idea.age_adaptations && typeof idea.age_adaptations === 'object'
        ? idea.age_adaptations
        : {},
    safety_notes: Array.isArray(idea.safety_notes)
      ? idea.safety_notes.filter((item) => typeof item === 'string')
      : [],
    badges: badges.length === 2 ? badges : BADGE_VALUES.slice(0, 2),
    planner_payload: {
      type: 'idea',
      duration_min: Number.isFinite(idea.planner_payload?.duration_min)
        ? Math.max(1, Math.round(idea.planner_payload.duration_min))
        : timeTotal,
      materials: plannerMaterials,
    },
    rationale: idea.rationale,
  }
}

const validateIdeas = (ideas: unknown, location: QuickIdeasContextInput['location']): QuickIdea[] => {
  if (!Array.isArray(ideas)) {
    throw new Error('Modelo retornou formato inválido.')
  }

  const normalized: QuickIdea[] = ideas.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Ideia sem estrutura válida.')
    }

    const cast = entry as QuickIdea
    if (typeof cast.id !== 'string' || !cast.id.trim()) {
      throw new Error('Ideia sem ID válido.')
    }
    if (typeof cast.title !== 'string' || !cast.title.trim()) {
      throw new Error('Ideia sem título.')
    }
    if (typeof cast.summary !== 'string' || !cast.summary.trim()) {
      throw new Error('Ideia sem resumo.')
    }

    return normalizeIdea(cast, location)
  })

  return normalized
}

const parseRequest = (body: unknown): QuickIdeasRequestPayload => {
  if (!body || typeof body !== 'object') {
    throw new Error('Payload inválido.')
  }

  const source = body as QuickIdeasRequestPayload
  const plan = (source.plan ?? 'free') as QuickIdeasPlan
  if (plan !== 'free' && plan !== 'essencial' && plan !== 'premium') {
    throw new Error('Plano inválido.')
  }

  const profile = sanitizeProfile(source.profile ?? { children: [], mode: 'single' })
  const context = sanitizeContext(source.context ?? { location: 'casa', time_window_min: 10, energy: 'normal' })

  return {
    plan,
    profile,
    context,
    locale: typeof source.locale === 'string' ? source.locale : 'pt-BR',
  }
}

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Modelo de IA não configurado.' }, { status: 500 })
  }

  let payload: QuickIdeasRequestPayload
  try {
    const body = await request.json()
    payload = parseRequest(body)
  } catch (error) {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const { plan, profile, context } = payload
  const rawChildren = (selectTargetChildren(profile) ?? []) as unknown[]
  const targetChildren = normalizeChildren(rawChildren)
  const ageBuckets = targetChildren.map((child) => child.age_bucket)
  const youngest = youngestBucket(targetChildren as any)

  if (plan === 'free') {
    return NextResponse.json({
      access: {
        denied: true,
        limited_to_one: false,
        message: 'Disponível nos planos Essencial e Premium.',
      },
      query_echo: {
        plan,
        location: context.location,
        time_window_min: context.time_window_min,
        energy: context.energy,
        age_buckets: ageBuckets,
      },
      ideas: [],
      aggregates: {
        materials_consolidated: [],
      },
    })
  }

  const ideaCount = plan === 'essencial' ? 1 : 3

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        response_format: {
          type: 'json_schema',
          json_schema: RESPONSE_SCHEMA,
        },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Instruções do desenvolvedor:\n- Gere ${ideaCount} ideias (1 se plano Essencial).\n- Personalize por faixa etária (${targetChildren
              .map((child) => child.age_bucket ?? '2-3')
              .join(', ')}) considerando local (${context.location}), tempo máximo (${context.time_window_min} min) e energia (${context.energy}).\n- Materiais simples e poucos passos, especialmente se energia = "exausta".\n- Escolha exatamente 2 selos por ideia dentre ${JSON.stringify(BADGE_VALUES)}.\n- Multi-criança: o plano deve caber para a criança mais nova (${youngest}) e trazer adaptações rápidas para irmãos mais velhos quando existirem.\n- Se filtros ficarem muito restritos, ofereça alternativa próxima segura e explique no campo rationale.\n- Use unidades brasileiras e mantenha pt-BR.\n\nDados do pedido:\n${JSON.stringify(
              {
                plan,
                limite_ideias: ideaCount,
                locale: payload.locale ?? 'pt-BR',
                filtros: {
                  local: context.location,
                  tempo_max_min: context.time_window_min,
                  energia: context.energy,
                },
                perfil: {
                  modo: profile.mode,
                  criancas: profile.children.map((child) => ({
                    id: child.id,
                    nome: child.name ?? null,
                    faixa_etaria: child.age_bucket,
                  })),
                  criancas_alvo: targetChildren.map((child) => child.id),
                  faixa_mais_nova: youngest,
                },
              },
              null,
              2
            )}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[QuickIdeas] OpenAI response not ok:', response.status, text)
      trackTelemetry('quick-ideas.generate.error', { status: response.status })
      return NextResponse.json({ error: 'Não foi possível gerar ideias no momento.' }, { status: 502 })
    }

    const completion = await response.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      trackTelemetry('quick-ideas.generate.error', { reason: 'empty-content' })
      return NextResponse.json({ error: 'Resposta inválida do modelo.' }, { status: 502 })
    }

    let parsed: { ideas: unknown }
    try {
      parsed = JSON.parse(content) as { ideas: unknown }
    } catch (error) {
      console.error('[QuickIdeas] Failed to parse JSON:', error, content)
      trackTelemetry('quick-ideas.generate.error', { reason: 'json-parse' })
      return NextResponse.json({ error: 'Formato inválido retornado pelo modelo.' }, { status: 502 })
    }

    const ideas = validateIdeas(parsed.ideas, context.location)
    const limitedIdeas = plan === 'essencial' ? ideas.slice(0, 1) : ideas.slice(0, Math.min(ideas.length, 3))

    trackTelemetry('quick-ideas.generate', { result: 'success', ideas: limitedIdeas.length })

    return NextResponse.json({
      access: {
        denied: false,
        limited_to_one: plan === 'essencial',
        message: plan === 'essencial' ? 'No Essencial você vê 1 ideia por dia.' : '',
      },
      query_echo: {
        plan,
        location: context.location,
        time_window_min: context.time_window_min,
        energy: context.energy,
        age_buckets: ageBuckets,
      },
      ideas: limitedIdeas,
      aggregates: {
        materials_consolidated: consolidateMaterials(limitedIdeas),
      },
    })
  } catch (error) {
    console.error('[QuickIdeas] Generation failure:', error)
    trackTelemetry('quick-ideas.generate.error', { reason: 'exception' })
    return NextResponse.json({ error: 'Erro inesperado ao gerar ideias.' }, { status: 500 })
  }
}
