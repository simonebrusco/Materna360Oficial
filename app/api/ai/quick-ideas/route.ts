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

// Payload do catálogo (estruturado)
type QuickIdeasRequest = {
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
  // Contexto fraco (opcional) — não é persistido nem logado
  memory?: {
    emotional_signal?: EmotionalSignal
  }
  locale?: 'pt-BR'
}

// Payload do Meu Dia (IA leve) — já usado no client QuickIdeaAI.tsx
type QuickIdeasMyDayRequest = {
  intent: 'quick_idea'
  nonce?: number
  memory?: {
    emotional_signal?: EmotionalSignal
  }
  locale?: 'pt-BR'
}

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

/**
 * Escolha probabilística com viés fraco (não determinística).
 * - weightBetween0and1: quanto maior, maior chance de escolher a opção "suave".
 */
function pickWithSoftBias<T>(softOption: T, neutralOption: T, weightBetween0and1: number): T {
  const w = Math.max(0, Math.min(1, Number.isFinite(weightBetween0and1) ? weightBetween0and1 : 0))
  return Math.random() < w ? softOption : neutralOption
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as unknown
    const maybeIntent = (raw as any)?.intent

    // =========================
    // MODO LEVE — MEU DIA (P33.4a)
    // Aceita { intent:'quick_idea', memory? } e retorna { suggestions: [...] }
    // =========================
    if (maybeIntent === 'quick_idea') {
      const body = raw as QuickIdeasMyDayRequest

      const signal: EmotionalSignal = normalizeSignal(body?.memory?.emotional_signal)
      const softWeight =
        signal === 'overwhelmed' ? 0.8 : signal === 'heavy' ? 0.7 : signal === 'tired' ? 0.6 : 0

      const suggestionsNeutral = [
        { id: 'qi-1', title: 'Respirar por 1 minuto', description: 'Uma pausa curta já ajuda a reorganizar.' },
        { id: 'qi-2', title: 'Escolher só uma prioridade', description: 'O resto pode esperar.' },
        { id: 'qi-3', title: 'Beber um copo de água', description: 'Só para ancorar o corpo no presente.' },
      ]

      const suggestionsSoft = [
        { id: 'qi-1', title: 'Fazer uma pausa de 60 segundos', description: 'Só para baixar o volume do dia.' },
        { id: 'qi-2', title: 'Diminuir o “tamanho do agora”', description: 'Uma coisa de cada vez já é suficiente.' },
        { id: 'qi-3', title: 'Alongar ombros e pescoço', description: 'Bem leve, sem pressa, por alguns segundos.' },
      ]

      const suggestions =
        softWeight > 0
          ? pickWithSoftBias(suggestionsSoft, suggestionsNeutral, Math.min(0.75, softWeight))
          : suggestionsNeutral

      // Sem telemetria nova e sem incluir signal
      track('audio.select', { reason: 'my_day_quick_idea' })

      // Formato A compatível com normalize() do client
      return NextResponse.json({ suggestions })
    }

    // =========================
    // CATÁLOGO ESTRUTURADO (EXISTENTE)
    // =========================
    const body = raw as QuickIdeasRequest | null

    if (!body || !body.plan || !body.profile || !body.context) {
      track('audio.select', { reason: 'missing_fields' })
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!Array.isArray(body.profile.children)) {
      track('audio.select', { reason: 'children_not_array' })
      return badRequest('Invalid profile.children')
    }

    // Sinal emocional: contexto fraco, opcional, pode não existir.
    // Nunca deve ser ecoado em UI nem persistido; aqui apenas modulamos sutilmente a escolha.
    const signal: EmotionalSignal = normalizeSignal(body.memory?.emotional_signal)

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
      track('audio.select', { plan: body.plan })
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

    const timeTotal = Math.min(10, Number(body.context.time_window_min || 10))

    // Base neutra (já é leve)
    const baseIdeaNeutral: QuickIdea = {
      id: 'cabana-lencois-10min',
      title: 'Cabana de Lençóis Aconchegante',
      summary: 'Montem uma cabaninha e contem uma história curta.',
      time_total_min: timeTotal,
      location: body.context.location,
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

    // Variante “mais suave” (sem mencionar estado; apenas reduz “tom de fazer”)
    const baseIdeaSoft: QuickIdea = {
      ...baseIdeaNeutral,
      id: 'cantinho-historia-10min',
      title: 'Cantinho de História Aconchegante',
      summary: 'Criem um cantinho com luz baixa e leiam/contém uma história curtinha.',
      materials: ['almofadas', 'livro (opcional)', 'luz suave/lanterna'],
      steps: [
        'Separem almofadas e façam um cantinho confortável.',
        'Com luz suave, leiam ou inventem uma história curtinha.',
      ],
      planner_payload: { type: 'idea', duration_min: 10, materials: ['almofadas', 'livro (opcional)', 'luz suave/lanterna'] },
      rationale: 'É uma ideia simples e acolhedora, que cabe no tempo disponível sem exigir preparo.',
    }

    // Viés fraco: apenas aumenta chance da variante “soft” quando sinal é pesado/cansado/sobrecarregado.
    const softWeight =
      signal === 'overwhelmed' ? 0.8 : signal === 'heavy' ? 0.7 : signal === 'tired' ? 0.6 : 0

    const baseIdea: QuickIdea =
      softWeight > 0 ? pickWithSoftBias(baseIdeaSoft, baseIdeaNeutral, softWeight) : baseIdeaNeutral

    // Ideias adicionais (premium) — mantidas, mas com opção de trocar por alternativas igualmente simples
    const premiumExtraNeutral: QuickIdea[] = [
      { ...baseIdeaNeutral, id: 'pintura-com-agua', title: 'Pintura com Água no Quintal' },
      { ...baseIdeaNeutral, id: 'caixa-tesouros', title: 'Caixa de Tesouros Sensorial' },
    ]

    const premiumExtraSoft: QuickIdea[] = [
      {
        ...baseIdeaSoft,
        id: 'musica-baixinha',
        title: 'Música Baixinha e Alongamento Leve',
        summary: 'Uma música calma e um alongamento bem simples, por poucos minutos.',
        materials: ['música (opcional)', 'tapete/colchonete (opcional)'],
        steps: [
          'Coloquem uma música calma (se quiserem).',
          'Façam 2 ou 3 alongamentos bem simples, sem pressa.',
        ],
        planner_payload: { type: 'idea', duration_min: 10, materials: ['música (opcional)', 'tapete/colchonete (opcional)'] },
        rationale: 'É curto, gentil e funciona mesmo quando o dia pede menos esforço.',
      },
      {
        ...baseIdeaSoft,
        id: 'jogo-observacao',
        title: 'Jogo de Observação: Ache 3 Coisas',
        summary: 'Um jogo calmo: achar 3 coisas de uma cor/forma pela casa.',
        materials: ['nenhum'],
        steps: [
          'Escolham uma cor ou forma (ex.: “algo redondo”).',
          'Procurem 3 itens juntos e celebrem cada achado.',
        ],
        planner_payload: { type: 'idea', duration_min: 10, materials: ['nenhum'] },
        rationale: 'É leve, rápido e pode ser feito sem preparar nada.',
      },
    ]

    // Para premium, quando sinal não é neutral, damos um viés fraco para extras mais “soft”,
    // mas sem bloquear totalmente as neutras (não determinístico).
    const premiumExtras =
      softWeight > 0
        ? pickWithSoftBias(premiumExtraSoft, premiumExtraNeutral, Math.min(0.75, softWeight))
        : premiumExtraNeutral

    const ideas: QuickIdea[] =
      body.plan === 'essencial'
        ? [baseIdea]
        : [
            baseIdea,
            // Mantém sempre 3 ideias no Premium, mas variando o conjunto de extras de forma sutil
            premiumExtras[0] ?? { ...baseIdeaNeutral, id: 'pintura-com-agua', title: 'Pintura com Água no Quintal' },
            premiumExtras[1] ?? { ...baseIdeaNeutral, id: 'caixa-tesouros', title: 'Caixa de Tesouros Sensorial' },
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

    // Sem adicionar telemetria nova (não incluir signal).
    track('audio.select', {
      plan: body.plan,
      location: body.context.location,
      energy: body.context.energy,
    })

    return NextResponse.json(response)
  } catch (err) {
    track('audio.end', { error: String(err) })
    return badRequest('Invalid JSON payload', String(err))
  }
}
