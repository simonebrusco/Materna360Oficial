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

type EmotionalSignal = 'heavy' | 'tired' | 'overwhelmed' | 'neutral'

/**
 * Payload do Meu Dia (modo leve) — IA leve.
 * Retorna { suggestions: [...] } para o client normalizar.
 */
type QuickIdeasRequestLite = {
  intent: 'quick_idea'
  nonce?: number
  memory?: {
    emotional_signal?: EmotionalSignal
  }
  locale?: 'pt-BR'
}

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

type QuickIdeasRequest = QuickIdeasRequestLite | QuickIdeasRequestLegacy

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

function normalizeSignal(input: unknown): EmotionalSignal {
  switch (input) {
    case 'heavy':
    case 'tired':
    case 'overwhelmed':
    case 'neutral':
      return input
    default:
      return 'neutral'
  }
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

/**
 * Amostragem aleatória sem reposição.
 */
function sampleWithoutReplacement<T>(arr: T[], k: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, Math.max(0, Math.min(k, a.length)))
}

/**
 * Mistura pools soft e neutral sem bloquear nada.
 */
function pickSuggestions(
  softPool: Array<{ id: string; title: string; description?: string }>,
  neutralPool: Array<{ id: string; title: string; description?: string }>,
  weightSoft: number,
  k: number
) {
  const w = clamp01(weightSoft)
  const startWithSoft = Math.random() < w

  const first = startWithSoft ? softPool : neutralPool
  const second = startWithSoft ? neutralPool : softPool

  const pickedFirst = sampleWithoutReplacement(first, k)
  const remaining = k - pickedFirst.length
  if (remaining <= 0) return pickedFirst

  const pickedSecond = sampleWithoutReplacement(
    second.filter((x) => !pickedFirst.some((p) => p.id === x.id)),
    remaining
  )

  return [...pickedFirst, ...pickedSecond].slice(0, k)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequest | null
    if (!body) {
      track('audio.select', { reason: 'missing_fields' })
      return badRequest('Missing required fields')
    }

    /**
     * =========================
     * 1) MEU DIA — IA LEVE
     * =========================
     */
    if ((body as QuickIdeasRequestLite).intent === 'quick_idea') {
      const lite = body as QuickIdeasRequestLite
      const signal = normalizeSignal(lite.memory?.emotional_signal)

      const softWeight =
        signal === 'overwhelmed' ? 0.72 : signal === 'heavy' ? 0.62 : signal === 'tired' ? 0.52 : 0.34

      const neutralPool = [
        { id: 'n-01', title: 'Um minuto para respirar', description: 'Só isso. Sem decidir nada agora.' },
        { id: 'n-02', title: 'Eu escolho o mínimo suficiente', description: 'Hoje, o mínimo já é cuidado.' },
        { id: 'n-03', title: 'Uma coisa de cada vez', description: 'Eu posso reduzir o tamanho do agora.' },
        { id: 'n-04', title: 'Um copo de água', description: 'Um gesto simples para o corpo sentir apoio.' },
        { id: 'n-05', title: 'Pés no chão', description: '10 segundos para voltar para mim.' },
        { id: 'n-06', title: 'Uma frase de verdade', description: '“Eu estou fazendo o possível.”' },
        { id: 'n-07', title: 'Abrir a janela', description: 'Ar e luz, mesmo que por pouco tempo.' },
        { id: 'n-08', title: 'Eu não preciso resolver tudo', description: 'Eu posso escolher só uma parte.' },
        { id: 'n-09', title: 'Um alongamento bem pequeno', description: 'Ombros e pescoço, sem pressa.' },
        { id: 'n-10', title: 'Hoje pode ser simples', description: 'Eu não preciso “dar conta” de tudo.' },
      ]

      const softPool = [
        { id: 's-01', title: 'Nada para provar agora', description: 'Eu só preciso atravessar este momento.' },
        { id: 's-02', title: 'Pausa sem explicação', description: 'Eu posso parar um pouco, do meu jeito.' },
        { id: 's-03', title: 'Eu não estou atrasada', description: 'Eu estou vivendo um dia real.' },
        { id: 's-04', title: 'Eu posso diminuir as expectativas', description: 'Hoje, menos é cuidado.' },
        { id: 's-05', title: 'Um minuto de silêncio', description: 'Mesmo que seja interno.' },
        { id: 's-06', title: 'Eu solto o que não dá', description: 'Só por agora.' },
        { id: 's-07', title: 'O corpo pede gentileza', description: 'O mínimo já ajuda.' },
        { id: 's-08', title: 'Eu me dou permissão', description: 'Para não fazer tudo hoje.' },
      ]

      const suggestions = pickSuggestions(softPool, neutralPool, softWeight, 3)

      track('audio.select', { mode: 'quick_idea' })
      return NextResponse.json({ suggestions })
    }

    /**
     * =========================
     * 2) CATÁLOGO LEGADO
     * =========================
     */
    const legacy = body as QuickIdeasRequestLegacy

    if (!legacy.plan || !legacy.profile || !legacy.context) {
      track('audio.select', { reason: 'missing_fields' })
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!Array.isArray(legacy.profile.children)) {
      track('audio.select', { reason: 'children_not_array' })
      return badRequest('Invalid profile.children')
    }

    if (legacy.plan === 'free') {
      const res = {
        access: {
          denied: true,
          limited_to_one: false,
          message: 'Disponível nos planos Essencial e Premium.',
        },
        query_echo: {
          plan: legacy.plan,
          location: legacy.context.location,
          time_window_min: legacy.context.time_window_min,
          energy: legacy.context.energy,
          age_buckets: legacy.profile.children.map((child) => child.age_bucket),
        },
        ideas: [] as unknown[],
        aggregates: { materials_consolidated: [] as string[] },
      }
      track('audio.select', { plan: legacy.plan })
      return NextResponse.json(res)
    }

    const resolvedBucket =
      legacy.profile.mode === 'all'
        ? youngestBucket(legacy.profile.children)
        : legacy.profile.children.find((c) => c.id === legacy.profile.active_child_id)?.age_bucket ??
          legacy.profile.children[0]?.age_bucket

    const bucket: QuickIdeasAgeBucket = resolvedBucket ?? '2-3'

    const badges: QuickIdeasBadge[] = ['curta', 'linguagem']
    const ageAdaptations: Partial<Record<QuickIdeasAgeBucket, string>> = {
      [bucket]: 'Adapte o tempo e as falas à idade.',
    }

    const baseIdea: QuickIdea = {
      id: 'cabana-lencois-10min',
      title: 'Cabana de Lençóis Aconchegante',
      summary: 'Montem uma cabaninha e contem uma história curta.',
      time_total_min: Math.min(10, Number(legacy.context.time_window_min || 10)),
      location: legacy.context.location,
      materials: ['lençóis', 'cadeiras', 'lanterna'],
      steps: [
        'Estenda os lençóis entre as cadeiras para formar a cabana.',
        'Entrem com a lanterna e contem uma história curtinha.',
      ],
      age_adaptations: ageAdaptations,
      safety_notes: [
        'Supervisão constante; evite prender lençol em locais altos.',
        'Lanterna sem peças pequenas soltas.',
      ],
      badges,
      planner_payload: { type: 'idea', duration_min: 10, materials: ['lençóis', 'cadeiras', 'lanterna'] },
      rationale: 'Poucos materiais, cabe no tempo disponível e na energia atual.',
    }

    const ideas =
      legacy.plan === 'essencial'
        ? [baseIdea]
        : [
            baseIdea,
            { ...baseIdea, id: 'pintura-com-agua', title: 'Pintura com Água no Quintal' },
            { ...baseIdea, id: 'caixa-tesouros', title: 'Caixa de Tesouros Sensorial' },
          ]

    const response = {
      access: {
        denied: false,
        limited_to_one: legacy.plan === 'essencial',
        message: legacy.plan === 'essencial' ? 'Plano Essencial: 1 ideia por vez.' : '',
      },
      query_echo: {
        plan: legacy.plan,
        location: legacy.context.location,
        time_window_min: legacy.context.time_window_min,
        energy: legacy.context.energy,
        age_buckets: legacy.profile.children.map((child) => child.age_bucket),
      },
      ideas,
      aggregates: { materials_consolidated: consolidateMaterials(ideas) },
    }

    track('audio.select', {
      plan: legacy.plan,
      location: legacy.context.location,
      energy: legacy.context.energy,
    })

    return NextResponse.json(response)
  } catch (err) {
    track('audio.end', { error: String(err) })
    return badRequest('Invalid JSON payload', String(err))
  }
}
