import { NextResponse } from 'next/server'

import { consolidateMaterials, youngestBucket } from '@/app/lib/quickIdeasCatalog'
import { trackTelemetry } from '@/app/lib/telemetry'

export const runtime = 'edge'

type AgeBucket = '0-1' | '2-3' | '4-5' | '6-7' | '8+'

type QuickIdeasRequest = {
  plan: 'free' | 'essencial' | 'premium'
  profile: {
    active_child_id: string | null
    mode: 'single' | 'all'
    children: Array<{ id: string; name?: string; age_bucket: AgeBucket }>
  }
  context: {
    location: 'casa' | 'parque' | 'escola' | 'area_externa'
    time_window_min: number
    energy: 'exausta' | 'normal' | 'animada'
  }
  locale?: 'pt-BR'
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequest | null

    if (!body || !body.plan || !body.profile || !body.context) {
      trackTelemetry('quick_ideas_bad_request', { reason: 'missing_fields' })
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!Array.isArray(body.profile.children)) {
      trackTelemetry('quick_ideas_bad_request', { reason: 'children_not_array' })
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
      trackTelemetry('quick_ideas_access_denied', { plan: body.plan })
      return NextResponse.json(res)
    }

    const resolvedBucket: AgeBucket | undefined =
      body.profile.mode === 'all'
        ? youngestBucket(body.profile.children.map((child) => child.age_bucket))
        : body.profile.children.find((child) => child.id === body.profile.active_child_id)?.age_bucket ??
          body.profile.children[0]?.age_bucket

    const bucket: AgeBucket = (resolvedBucket ?? '2-3') as AgeBucket

    const baseIdea = {
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
      age_adaptations: { [bucket]: 'Adapte o tempo e as falas à idade.' },
      safety_notes: [
        'Supervisão constante; evite prender lençol em locais altos.',
        'Lanterna sem peças pequenas soltas.',
      ],
      badges: ['curta', 'linguagem'],
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

    trackTelemetry('quick_ideas_success', {
      plan: body.plan,
      location: body.context.location,
      energy: body.context.energy,
    })

    return NextResponse.json(response)
  } catch (err) {
    trackTelemetry('quick_ideas_error', { error: String(err) })
    return badRequest('Invalid JSON payload', String(err))
  }
}
