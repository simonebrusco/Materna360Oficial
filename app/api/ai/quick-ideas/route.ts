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
  // Fisher–Yates parcial
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, Math.max(0, Math.min(k, a.length)))
}

/**
 * Mistura dois pools sem bloquear nada:
 * - weightSoft: chance de puxar do pool "soft" primeiro
 * - sempre cai para neutral se precisar
 */
function pickSuggestions(
  softPool: Array<{ id: string; title: string; description?: string }>,
  neutralPool: Array<{ id: string; title: string; description?: string }>,
  weightSoft: number,
  k: number
) {
  const w = clamp01(weightSoft)

  // Decide se começamos pelo soft ou pelo neutral, mas sem determinismo rígido
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
     * 1) Meu Dia — modo leve
     * =========================
     */
    if ((body as QuickIdeasRequestLite).intent === 'quick_idea') {
      const lite = body as QuickIdeasRequestLite

      const signal = normalizeSignal(lite.memory?.emotional_signal)

      // Viés fraco (não determinístico, não bloqueia)
      const softWeight =
        signal === 'overwhelmed' ? 0.7 : signal === 'heavy' ? 0.6 : signal === 'tired' ? 0.5 : 0.25

      // Pool neutro (leve, sem cobrança, sem “faça isso depois”)
      const neutralPool = [
        { id: 'n-1', title: 'Respirar por 1 minuto', description: 'Só para dar espaço por dentro.' },
        { id: 'n-2', title: 'Escolher uma prioridade pequena', description: 'Uma coisa de cada vez já serve.' },
        { id: 'n-3', title: 'Beber um copo de água', description: 'Um gesto simples para ancorar o corpo.' },
        { id: 'n-4', title: 'Abrir a janela por 30 segundos', description: 'Ar e luz também ajudam.' },
        { id: 'n-5', title: 'Alongar ombros e pescoço', description: 'Sem pressa, só soltando a tensão.' },
        { id: 'n-6', title: 'Diminuir o tamanho do agora', description: 'Hoje pode caber em passos menores.' },
        { id: 'n-7', title: 'Fazer uma pausa curta', description: 'Um minuto já muda o ritmo.' },
        { id: 'n-8', title: 'Organizar só um cantinho', description: 'Pequeno o suficiente para não pesar.' },
        { id: 'n-9', title: 'Escrever uma frase para você', description: 'Algo como “eu estou fazendo o possível”.' },
        { id: 'n-10', title: 'Pedir ajuda com uma frase', description: 'Uma frase curta já resolve muita coisa.' },
        { id: 'n-11', title: 'Colocar uma música baixinha', description: 'Só para suavizar o ambiente.' },
        { id: 'n-12', title: 'Sentar por 60 segundos', description: 'Sem meta — só presença.' },
      ]

      // Pool “soft” (mais passivo/acolhedor; ainda sem mencionar estado)
      const softPool = [
        { id: 's-1', title: 'Pausa de 60 segundos', description: 'Sem decidir nada agora.' },
        { id: 's-2', title: 'Um gesto de cuidado pequeno', description: 'Algo mínimo, só para você.' },
        { id: 's-3', title: 'Luz mais baixa por um instante', description: 'Deixar o ambiente mais gentil.' },
        { id: 's-4', title: 'Soltar o maxilar e os ombros', description: 'Só relaxar onde der.' },
        { id: 's-5', title: 'Escolher o “mínimo suficiente”', description: 'Hoje não precisa ser completo.' },
        { id: 's-6', title: 'Um copo de água com calma', description: 'Dois goles já contam.' },
        { id: 's-7', title: 'Um minuto de silêncio', description: 'Mesmo com barulho ao redor.' },
        { id: 's-8', title: 'Permitir que algo fique para depois', description: 'Sem explicar, sem justificar.' },
        { id: 's-9', title: 'Encostar os pés no chão', description: 'Só sentir o corpo por 10 segundos.' },
        { id: 's-10', title: 'Uma frase de reconhecimento', description: '“Eu estou aqui. Isso já é muito.”' },
        { id: 's-11', title: 'Beber algo quente', description: 'Se tiver — um pequeno conforto.' },
        { id: 's-12', title: 'Respirar mais lento', description: 'Inspirar 3… expirar 4…' },
      ]

      const suggestions = pickSuggestions(softPool, neutralPool, softWeight, 3)

      // Sem telemetria nova (não logar signal).
      track('audio.select', { mode: 'quick_idea' })

      return NextResponse.json({ suggestions })
    }

    /**
     * =========================
     * 2) Legado — catálogo
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

    const resolvedBucket: QuickIdeasAgeBucket | undefined =
      legacy.profile.mode === 'all'
        ? youngestBucket(legacy.profile.children)
        : legacy.profile.children.find((child) => child.id === legacy.profile.active_child_id)?.age_bucket ??
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

    const ideas: QuickIdea[] =
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
