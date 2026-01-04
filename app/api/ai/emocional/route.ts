import { NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

/**
 * =========================
 * TIPOS
 * =========================
 */

type WeeklyInsightContext = {
  firstName?: string

  // 🔹 LEGADO (não estimular uso novo)
  persona?: string | null
  personaLabel?: string | null

  // 🔹 NOVO — calibração neutra (Camada 2 / Eu360)
  prefs?: {
    tone?: 'soft' | 'neutral' | 'firm' | null
    intensity?: 'low' | 'medium' | null
    focus?: 'care' | 'organization' | 'pause' | null
  }

  // 🔹 Preferências brutas (texto livre, sem score)
  preferences?: {
    toneLabel?: string | null
    microCopy?: string | null
    focusHint?: string | null
    helpStyle?: 'diretas' | 'guiadas' | 'explorar' | null
  }

  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
  }

  mood?: string | null
  energy?: string | null
  focusToday?: string | null
  slot?: string | null
}

type EmotionalRequestBody = {
  feature: 'weekly_overview' | 'daily_inspiration'
  origin?: string

  // compat
  mood?: string | null
  energy?: string | null
  notesPreview?: string | null

  context?: WeeklyInsightContext
}

/**
 * =========================
 * HELPERS
 * =========================
 */

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function safeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

/**
 * =========================
 * ROUTE
 * =========================
 */

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[IA Emocional] OPENAI_API_KEY não configurada')
      return jsonError('Configuração de IA indisponível.', 500)
    }

    const body = (await request.json()) as EmotionalRequestBody
    if (!body?.feature) {
      return jsonError('Parâmetro "feature" é obrigatório.', 400)
    }

    const origin = safeString(body.origin) ?? 'como-estou-hoje'
    const isMaternar = origin === 'maternar-hub'
    const isEu360 = origin === 'eu360'

    /**
     * =========================
     * CONTEXTO UNIFICADO
     * =========================
     */

    const incomingPrefs = body.context?.prefs
    const incomingPreferences = body.context?.preferences

    const context: WeeklyInsightContext = {
      firstName: safeString(body.context?.firstName) ?? undefined,

      persona: safeString(body.context?.persona) ?? null,
      personaLabel: safeString(body.context?.personaLabel) ?? null,

      prefs:
        incomingPrefs ??
        (incomingPreferences
          ? {
              tone: incomingPreferences.toneLabel?.toLowerCase().includes('leve')
                ? 'soft'
                : incomingPreferences.toneLabel?.toLowerCase().includes('claro')
                  ? 'firm'
                  : 'neutral',
              intensity:
                incomingPreferences.helpStyle === 'diretas'
                  ? 'low'
                  : incomingPreferences.helpStyle === 'guiadas'
                    ? 'medium'
                    : null,
              focus: incomingPreferences.focusHint?.toLowerCase().includes('organiza')
                ? 'organization'
                : incomingPreferences.focusHint?.toLowerCase().includes('tempo')
                  ? 'pause'
                  : 'care',
            }
          : undefined),

      preferences: incomingPreferences ?? undefined,

      stats: body.context?.stats ?? undefined,
      mood: safeString(body.context?.mood) ?? safeString(body.mood) ?? null,
      energy: safeString(body.context?.energy) ?? safeString(body.energy) ?? null,
      focusToday: safeString(body.context?.focusToday) ?? null,
      slot: safeString(body.context?.slot) ?? null,
    }

    /**
     * =========================
     * SYSTEM MESSAGES
     * =========================
     */

    const systemBase = `
Você é a IA emocional do Materna360.
Sua função é oferecer LEITURA e ACOLHIMENTO — nunca direção.

Tom:
- humano, adulto, respeitoso
- sem frases motivacionais
- sem julgamento
- sem cobrança

Regras:
- Nunca dar conselhos ou planos.
- Nunca usar imperativo.
- Nunca sugerir “o que fazer”.
- Nunca diagnosticar.
- Responder sempre em PT-BR.
- Respeitar estritamente o JSON solicitado.
`.trim()

    const systemMaternar = `
Você está no hub MATERNAR.
Aqui a IA apenas traduz sentimentos e sustenta presença.
Proibido sugerir técnicas, métodos ou próximos passos.
`.trim()

    const systemEu360 = `
Você está no hub EU360.
Aqui a IA entrega leitura narrativa e reconhecimento.
Sugestões viram OBSERVAÇÕES de cuidado.
Nada de ação, plano ou direção.
`.trim()

    const systemMessage = (
      isMaternar
        ? `${systemBase}\n\n${systemMaternar}`
        : isEu360
          ? `${systemBase}\n\n${systemEu360}`
          : systemBase
    ).trim()

    /**
     * =========================
     * USER MESSAGE
     * =========================
     */

    const userContext = {
      origem: origin,
      firstName: context.firstName ?? null,
      persona: context.persona ?? null,
      personaLabel: context.personaLabel ?? null,
      prefs: context.prefs ?? null,
      preferences: context.preferences ?? null,
      humorAtual: context.mood ?? null,
      energiaAtual: context.energy ?? null,
      focoHoje: context.focusToday ?? null,
      tempoSlot: context.slot ?? null,
      stats: context.stats ?? null,
      resumoNotas: safeString(body.notesPreview) ?? null,
    }

    const userMessage = `
Dados de contexto:
${JSON.stringify(userContext, null, 2)}
`.trim()

    /**
     * =========================
     * SCHEMAS
     * =========================
     */

    const weeklySchema = {
      name: 'weekly_insight',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          weeklyInsight: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 5,
              },
              highlights: {
                type: 'object',
                properties: {
                  bestDay: { type: 'string' },
                  toughDays: { type: 'string' },
                },
                required: ['bestDay', 'toughDays'],
              },
            },
            required: ['title', 'summary', 'suggestions', 'highlights'],
          },
        },
        required: ['weeklyInsight'],
      },
    } as const

    /**
     * =========================
     * PROMPT
     * =========================
     */

    let prompt = ''
    if (body.feature === 'weekly_overview') {
      prompt = isEu360
        ? `
Gere uma leitura narrativa da semana.
- Sem orientação.
- Sem plano.
- "suggestions" = observações de cuidado.
${userMessage}
`
        : `
Gere um insight emocional da semana.
${userMessage}
`
    } else {
      prompt = `
Gere um texto emocional breve para o dia.
${userMessage}
`
    }

    /**
     * =========================
     * OPENAI CALL
     * =========================
     */

    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: isEu360 || isMaternar ? 0.4 : 0.7,
        text: { format: { type: 'json_schema', ...weeklySchema } },
      }),
    })

    if (!res.ok) {
      console.error('[IA Emocional] OpenAI error', await res.text())
      return jsonError('Erro ao gerar leitura emocional.', 502)
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('[IA Emocional] erro geral', err)
    return jsonError('Erro inesperado na IA emocional.', 500)
  }
}
