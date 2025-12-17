// app/api/ai/emocional/route.ts
import { NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'

// Você pode trocar depois. Mantive o seu por compatibilidade,
// mas no Responses API você pode usar modelos mais novos quando quiser.
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

type WeeklyInsightContext = {
  firstName?: string
  persona?: string | null
  personaLabel?: string | null
  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
  }
  // Contexto leve do “agora” (sem conteúdo sensível)
  mood?: string | null
  energy?: string | null
  focusToday?: string | null
  slot?: string | null
}

type EmotionalRequestBody = {
  feature: 'weekly_overview' | 'daily_inspiration'
  origin?: string

  // Compat: campos antigos (podem continuar vindo, mas agora preferimos "context")
  mood?: string | null
  energy?: string | null
  notesPreview?: string | null

  // Novo: contexto rico vindo do client (Eu360, Meu Dia, etc.)
  context?: WeeklyInsightContext
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function safeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[IA Emocional] OPENAI_API_KEY não configurada')
      return jsonError('Configuração de IA indisponível no momento.', 500)
    }

    const body = (await request.json()) as EmotionalRequestBody
    const feature = body?.feature

    if (!feature) return jsonError('Parâmetro "feature" é obrigatório.', 400)

    const origin = safeString(body?.origin) ?? 'como-estou-hoje'

    // Contexto “unificado” (prioriza body.context; mantém compat com campos antigos)
    const context: WeeklyInsightContext = {
      firstName: safeString(body?.context?.firstName) ?? undefined,
      persona: safeString(body?.context?.persona) ?? null,
      personaLabel: safeString(body?.context?.personaLabel) ?? null,
      stats: body?.context?.stats ?? undefined,
      mood: safeString(body?.context?.mood) ?? safeString(body?.mood) ?? null,
      energy: safeString(body?.context?.energy) ?? safeString(body?.energy) ?? null,
      focusToday: safeString(body?.context?.focusToday) ?? null,
      slot: safeString(body?.context?.slot) ?? null,
    }

    // Prompt base alinhado ao tom Materna360
    const systemMessage = `
Você é a IA emocional do Materna360, um app para mães que combina organização leve com apoio emocional.
Sua missão é oferecer reflexões curtas, acolhedoras e sem julgamentos, sempre no TOM DE VOZ Materna360:
- gentil, humano, realista, sem frases motivacionais vazias
- reconhece o cansaço SEM culpabilizar
- traz alívio e não mais cobrança
- português do Brasil, frases curtas e diretas

Regras:
- Nunca fale de diagnóstico, remédio ou temas médicos.
- Nunca diga "seja grata" ou "pense positivo". Seja concreta e empática.
- Nunca exponha dados sensíveis. Use apenas o contexto fornecido.
- Respeite SEMPRE o formato JSON pedido (sem texto fora do JSON).
`.trim()

    // Contexto do usuário (a IA usa isso para calibrar tom e sugestões)
    const userContext = {
      origem: origin,
      firstName: context.firstName ?? null,
      persona: context.persona ?? null,
      personaLabel: context.personaLabel ?? null,
      humorAtual: context.mood ?? null,
      energiaAtual: context.energy ?? null,
      focoHoje: context.focusToday ?? null,
      tempoSlot: context.slot ?? null,
      stats: context.stats ?? null,
      // Mantido para compatibilidade (mas ideal é enviar vazio ou resumo não sensível)
      resumoNotas: safeString(body?.notesPreview) ?? null,
    }

    const userMessageCommon = `
Dados de contexto (podem estar vazios):
${JSON.stringify(userContext, null, 2)}

Ajuste o tom para a persona, se existir:
- Se personaLabel indicar "sobrevivência": mínimo de passos, muito acolhimento, zero cobrança.
- Se indicar "expansão": ainda gentil, mas com 1 micro-desafio possível.
`.trim()

    // Schemas (Structured Outputs strict)
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
              title: { type: 'string', minLength: 1 },
              summary: { type: 'string', minLength: 1 },
              suggestions: {
                type: 'array',
                minItems: 2,
                maxItems: 5,
                items: { type: 'string', minLength: 1 },
              },
              highlights: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  bestDay: { type: 'string', minLength: 1 },
                  toughDays: { type: 'string', minLength: 1 },
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

    const dailySchema = {
      name: 'daily_inspiration',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          inspiration: {
            type: 'object',
            additionalProperties: false,
            properties: {
              phrase: { type: 'string', minLength: 1 },
              care: { type: 'string', minLength: 1 },
              ritual: { type: 'string', minLength: 1 },
            },
            required: ['phrase', 'care', 'ritual'],
          },
        },
        required: ['inspiration'],
      },
    } as const

    let inputText = ''
    let schemaToUse: typeof weeklySchema | typeof dailySchema

    if (feature === 'weekly_overview') {
      schemaToUse = weeklySchema
      inputText = `
Gere um insight emocional da semana da mãe a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar.
- "suggestions": 2 a 5 passos pequenos, práticos e realistas.
- "highlights.bestDay": quando a semana flui melhor (sem culpa).
- "highlights.toughDays": quando pesa mais + lembrete de gentileza.
${userMessageCommon}
`.trim()
    } else if (feature === 'daily_inspiration') {
      schemaToUse = dailySchema
      inputText = `
Gere uma inspiração emocional para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha.
- "care": 3 a 6 linhas, acolhedor e concreto.
- "ritual": 1 sugestão prática (cabe num dia corrido).
${userMessageCommon}
`.trim()
    } else {
      return jsonError('Feature inválida para IA emocional.', 400)
    }

    // Telemetria básica (sem dados sensíveis)
    try {
      // Se você preferir, pode plugar seu track server-side aqui.
      console.log('[IA Emocional] request', {
        feature,
        origin,
        hasPersona: Boolean(context.persona || context.personaLabel),
      })
    } catch {}

    // Chamada para OpenAI (Responses API) + timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const openAiRes = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: inputText },
        ],
        temperature: 0.7,
        // Structured Outputs no Responses API usa text.format (não response_format) :contentReference[oaicite:1]{index=1}
        text: {
          format: {
            type: 'json_schema',
            ...schemaToUse,
          },
        },
      }),
    }).finally(() => clearTimeout(timeout))

    if (!openAiRes.ok) {
      console.error(
        '[IA Emocional] Erro HTTP da OpenAI:',
        openAiRes.status,
        await openAiRes.text().catch(() => '(sem corpo)'),
      )
      return jsonError('Não consegui gerar a análise emocional agora.', 502)
    }

    const response = await openAiRes.json()

    // Responses API costuma disponibilizar "output_text" como atalho em SDKs,
    // mas no fetch bruto pode vir em "output" com itens.
    // Para ser robusto: tenta extrair um texto e fazer parse JSON.
    const rawText: string =
      response?.output_text?.trim?.() ||
      (() => {
        const parts: string[] = []
        const output = Array.isArray(response?.output) ? response.output : []
        for (const item of output) {
          const content = Array.isArray(item?.content) ? item.content : []
          for (const c of content) {
            if (typeof c?.text === 'string') parts.push(c.text)
          }
        }
        return parts.join('\n').trim()
      })() ||
      '{}'

    // Parse seguro do JSON
    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const first = rawText.indexOf('{')
      const last = rawText.lastIndexOf('}')
      if (first >= 0 && last > first) parsed = JSON.parse(rawText.slice(first, last + 1))
      else throw new Error('Resposta da IA sem JSON válido')
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error) {
    console.error('[IA Emocional] Erro geral na rota /api/ai/emocional:', error)
    return NextResponse.json({ error: 'Não foi possível gerar a análise emocional agora.' }, { status: 500 })
  }
}
