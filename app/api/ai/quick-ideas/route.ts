import { NextResponse } from 'next/server'

import { consolidateMaterials, youngestBucket } from '@/app/lib/quickIdeasCatalog'
import { track } from '@/app/lib/telemetry'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasBadge,
  QuickIdeasLocation,
  QuickIdeasEnergy,
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
 * Payload leve para Meu Dia (P33.4):
 * 1 foco, sem parentalidade, sem plano, sem lista.
 */
type QuickIdeasRequestLight = {
  intent: 'quick_idea'
  nonce?: number
  locale?: 'pt-BR'
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

function chooseOne(seed: number, items: Suggestion[]) {
  const safeSeed = Number.isFinite(seed) ? seed : Date.now()
  const idx = Math.abs(safeSeed) % items.length
  return items[idx]!
}

/**
 * Sugestões neutras do Meu Dia:
 * - organizam o agora
 * - não são produtividade
 * - não são parentalidade
 * - 1 foco apenas
 * - salvável fora de contexto
 */
function myDaySuggestions(): Suggestion[] {
  return [
    {
      id: 'md-1',
      title: 'Respire por 1 minuto',
      description: 'Só para o corpo entender que você chegou.',
    },
    {
      id: 'md-2',
      title: 'Escolha só uma coisa para agora',
      description: 'O resto pode esperar um pouco.',
    },
    {
      id: 'md-3',
      title: 'Faça um passo pequeno',
      description: 'Algo simples já organiza por dentro.',
    },
    {
      id: 'md-4',
      title: 'Beba um copo de água',
      description: 'Uma âncora rápida no presente.',
    },
    {
      id: 'md-5',
      title: 'Escreva uma frase do que está pesado',
      description: 'Só para tirar da cabeça e pôr no chão.',
    },
  ]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequestLegacy | QuickIdeasRequestLight | null

    /**
     * MODO LEVE (Meu Dia)
     * Retorna no formato esperado pelo QuickIdeaAI: { suggestions: [...] }
     * Apenas 1 sugestão.
     */
    if (isLightRequest(body)) {
      const seed = typeof body.nonce === 'number' ? body.nonce : Date.now()
      const one = chooseOne(seed, myDaySuggestions())

      try {
        track('ai.quick_ideas.light', {
          intent: body.intent,
          locale: body.locale ?? 'pt-BR',
        })
      } catch {}

      return NextResponse.json({
        suggestions: [one],
        meta: { mode: 'my_day_light' as const },
      })
    }

    /**
     * MODO LEGADO (Catálogo completo)
     * Mantido exatamente como estava.
     */
    if (!isLegacyRequest(body)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'missing_fields' })
      } catch {}
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!Array.isArray(body.profile.children)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'children_not_array' })
      } catch {}
      return badRequest('Invalid profile.children')
    }

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
          time_window_min: body.context.time_window_min,
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
      time_total_min: Math.min(10, Number(body.context.time_window_min || 10)),
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
        time_window_min: body.context.time_window_min,
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
