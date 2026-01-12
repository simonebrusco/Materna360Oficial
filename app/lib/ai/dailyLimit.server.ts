// app/api/ai/emocional/route.ts

import { NextResponse } from 'next/server'
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_MESSAGE,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

type EnergyLevel = 'low' | 'medium' | 'high'
type VariationAxis = 'frase' | 'cuidado' | 'ritual' | 'limite' | 'presenca'

type WeeklyInsightContext = {
  firstName?: string
  persona?: string | null
  personaLabel?: string | null
  preferences?: {
    toneLabel?: string
    microCopy?: string
    focusHint?: string
    helpStyle?: 'diretas' | 'guiadas' | 'explorar' | undefined
  }
  prefs?: {
    tone?: 'soft' | 'neutral' | 'firm' | null
    intensity?: 'low' | 'medium' | null
    focus?: 'care' | 'organization' | 'pause' | null
  }
  energy_level?: EnergyLevel
  variation_axis?: VariationAxis
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
  mood?: string | null
  energy?: string | null
  notesPreview?: string | null
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

function safeEnergyLevel(v: unknown): EnergyLevel | undefined {
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return undefined
}

function safeVariationAxis(v: unknown): VariationAxis | undefined {
  if (v === 'frase' || v === 'cuidado' || v === 'ritual' || v === 'limite' || v === 'presenca') return v
  return undefined
}

export async function POST(request: Request) {
  // Gate diário (P34.11.3) — somente libera cota se chegar a chamar IA real.
  let gate: { actorId: string; dateKey: string } | null = null

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

    const isCuidarDeMim = origin === 'cuidar-de-mim'
    const isMaternar = origin === 'maternar-hub' || isCuidarDeMim
    const isEu360 = origin === 'eu360'

    const context: WeeklyInsightContext = {
      firstName: safeString(body?.context?.firstName) ?? undefined,
      persona: safeString(body?.context?.persona) ?? null,
      personaLabel: safeString(body?.context?.personaLabel) ?? null,
      preferences: body?.context?.preferences ?? undefined,
      prefs: body?.context?.prefs ?? undefined,
      energy_level: safeEnergyLevel((body as any)?.context?.energy_level),
      variation_axis: safeVariationAxis((body as any)?.context?.variation_axis),
      stats: body?.context?.stats ?? undefined,
      mood: safeString(body?.context?.mood) ?? safeString(body?.mood) ?? null,
      energy: safeString(body?.context?.energy) ?? safeString(body?.energy) ?? null,
      focusToday: safeString(body?.context?.focusToday) ?? null,
      slot: safeString(body?.context?.slot) ?? null,
    }

    const systemBase = `
Você é a IA emocional do Materna360, um app para mães que combina organização leve com apoio emocional.
Sua missão é oferecer textos curtos, acolhedores e sem julgamentos, sempre no TOM DE VOZ Materna360:
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

    const systemMaternarAddendum = `
Você está respondendo DENTRO DA ABA "MATERNAR".
Aqui a IA atua como presença acolhedora e estável: escuta organizada e tradução de sentimentos.
PROIBIDO em Maternar:
- dar conselhos diretos
- sugerir técnicas, métodos ou exercícios
- usar linguagem de melhoria ("tente", "faça", "o ideal", "você precisa")
- transformar emoção em tarefa
- induzir ação futura, CTA, desafio, plano, lista de passos
- empurrar para outro hub explicitamente

PROIBIDO também:
- mencionar datas comemorativas (Dia das Mães, Natal, Ano Novo, feriados etc.)
- inventar contexto temporal ("nesta época do ano", "hoje é um dia especial", "em janeiro...")
- mencionar mês, dia da semana, estação ou evento sazonal
A não ser que isso esteja EXPLICITAMENTE presente no contexto fornecido.

Estrutura que deve aparecer naturalmente no texto (sem enumerar):
- reconhecimento emocional claro
- nomeação/organização do sentimento
- normalização da experiência
- fechamento acolhedor sem tarefa

Importante:
- Evite verbos no imperativo.
- Se precisar “oferecer algo”, ofereça PERMISSÃO e linguagem de cuidado (não instrução).
`.trim()

    const systemEu360Addendum = `
Você está respondendo DENTRO DO HUB "EU360".
Aqui a IA entrega LEITURA NARRATIVA e RECONHECIMENTO — nunca direção.

PROIBIDO em Eu360:
- conselhos, sugestões, técnicas, métodos, exercícios
- linguagem de melhoria ("tente", "faça", "você precisa", "o ideal")
- lista de passos, planos, metas, desafios, CTAs
- comparação temporal ("mais", "menos", "melhor", "pior", "evoluiu", "regrediu")
- termos clínicos/diagnósticos

Regras de linguagem:
- tom adulto, respeitoso, não performático
- frases curtas
- sem imperativo
- a leitura deve parecer óbvia em retrospecto (sem "surpresa")

Se houver um campo chamado "suggestions" no schema:
- trate como "observações de cuidado / reconhecimentos"
- devem ser frases que aliviam, não orientam
`.trim()

    const systemMessage = (isMaternar
      ? `${systemBase}\n\n${systemMaternarAddendum}`
      : isEu360
        ? `${systemBase}\n\n${systemEu360Addendum}`
        : systemBase
    ).trim()

    const userContext = {
      origem: origin,
      firstName: context.firstName ?? null,
      persona: context.persona ?? null,
      personaLabel: context.personaLabel ?? null,
      preferences: context.preferences ?? null,
      prefs: context.prefs ?? null,
      energy_level: context.energy_level ?? null,
      variation_axis: context.variation_axis ?? null,
      humorAtual: context.mood ?? null,
      energiaAtual: context.energy ?? null,
      focoHoje: context.focusToday ?? null,
      tempoSlot: context.slot ?? null,
      stats: context.stats ?? null,
      resumoNotas: safeString(body?.notesPreview) ?? null,
    }

    const userMessageCommon = `
Dados de contexto (podem estar vazios):
${JSON.stringify(userContext, null, 2)}
`.trim()

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

      if (isMaternar) {
        inputText = `
Gere um insight emocional da semana para a mãe, a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar, sem orientar.
- "suggestions": 2 a 5 frases de permissão/acolhimento (NÃO passos, NÃO tarefas, NÃO técnicas).
- "highlights.bestDay": quando a semana flui melhor (sem culpa).
- "highlights.toughDays": quando pesa mais + lembrete de gentileza.
${userMessageCommon}
`.trim()
      } else if (isEu360) {
        inputText = `
Gere um relatório emocional em formato de leitura narrativa da semana, a partir do contexto fornecido.
Requisitos:
- "title": curto, adulto, respeitoso.
- "summary": 2 a 4 parágrafos curtos (ou 3 a 5 linhas), leitura sem julgamento, sem orientar.
- "suggestions": 2 a 5 "observações de cuidado" (reconhecimentos, permissões, validações). NÃO são passos, NÃO são tarefas.
- "highlights.bestDay": descreva quando a semana flui melhor (sem mérito, sem comparação).
- "highlights.toughDays": descreva quando pesa mais + lembrete de gentileza (sem indicar o que fazer).

Use as "preferences" (se existirem) apenas para calibrar tom e foco,
SEM mencionar preferências, questionário, perfil, persona ou “resultado”.
${userMessageCommon}
`.trim()
      } else {
        inputText = `
Gere um insight emocional da semana da mãe a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar.
- "suggestions": 2 a 5 passos pequenos, práticos e realistas.

Ajuste o tom se existir "preferences" ou "prefs" (sem mencionar que existem preferências).
${userMessageCommon}
`.trim()
      }
    } else if (feature === 'daily_inspiration') {
      schemaToUse = dailySchema

      if (isCuidarDeMim) {
        inputText = `
Gere 3 apoios emocionais para "Cuidar de Mim" (aba MATERNAR) no formato do schema.
Você DEVE respeitar os eixos internos abaixo quando existirem no contexto:

1) energy_level (low | medium | high)
- low: acolhimento, pausa, permissões, redução de peso. Sem ação. Sem instrução.
- medium: estrutura leve e organizadora, ainda sem imperativo. Linguagem de clareza e respiro.
- high: presença mais ativa (sem imperativo), energia de "dar conta do agora" sem cobrar nada.

2) variation_axis (frase | cuidado | ritual | limite | presenca)
REGRAS:
- Use APENAS UM variation_axis por geração (o valor já vem no contexto).
- Não misture eixos no mesmo texto.
- A variação precisa ser REAL: mudar foco/forma/tipo de apoio, não só parafrasear.

COMO APLICAR O axis em cada campo (schema exige os 3 campos sempre):
- frase: "phrase" é o centro (1 linha forte e adulta); "care" e "ritual" ficam discretos e complementares.
- cuidado: "care" é o centro (3 a 6 linhas de acolhimento concreto); "phrase" e "ritual" mínimos.
- ritual: "ritual" é o centro (1 linha de ancoragem/permissão emocional, sem parecer exercício); "phrase" e "care" complementam.
- limite: o centro é permissão de limite sem culpa; mantenha isso como foco principal (sem instrução). Distribua com coerência (não misture com outros eixos).
- presenca: o centro é presença possível; linguagem de "estar com você" e "agora" sem passo a passo.

Formato obrigatório:
- "phrase": 1 linha, adulta, acolhedora, sem imperativo.
- "care": 3 a 6 linhas, acolhimento concreto, sem instruções, sem métodos.
- "ritual": 1 linha de permissão/ancoragem emocional (não é exercício; evite verbos no imperativo).

${userMessageCommon}
`.trim()
      } else if (isMaternar) {
        inputText = `
Gere um apoio emocional para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha acolhedora, sem imperativo.
- "care": 3 a 6 linhas, acolhimento concreto, sem instruções, sem métodos.
- "ritual": 1 linha de permissão/ancoragem emocional (não é exercício; evite verbos no imperativo).
${userMessageCommon}
`.trim()
      } else if (isEu360) {
        inputText = `
Gere uma leitura breve para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha adulta e acolhedora, sem imperativo.
- "care": 3 a 6 linhas com reconhecimento e organização do que ela vive (sem instruções).
- "ritual": 1 linha de permissão/ancoragem emocional (não é exercício; evite verbos no imperativo).

Use as "preferences" (se existirem) apenas para calibrar tom e foco,
SEM mencionar preferências, questionário, perfil, persona ou “resultado”.
${userMessageCommon}
`.trim()
      } else {
        inputText = `
Gere uma inspiração emocional para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha.
- "care": 3 a 6 linhas, acolhedor e concreto.
- "ritual": 1 sugestão prática (cabe num dia corrido).

Ajuste o tom se existir "preferences" ou "prefs" (sem mencionar que existem preferências).
${userMessageCommon}
`.trim()
      }
    } else {
      return jsonError('Feature inválida para IA emocional.', 400)
    }

    try {
      console.log('[IA Emocional] request', {
        feature,
        origin,
        isMaternar,
        isEu360,
        isCuidarDeMim,
        hasPreferences: Boolean(context.preferences),
        hasPrefsCompat: Boolean(context.prefs),
        hasPersonaLegacy: Boolean(context.persona || context.personaLabel),
        hasVariation: Boolean(isCuidarDeMim && (context.energy_level || context.variation_axis)),
        energy_level: isCuidarDeMim ? (context.energy_level ?? null) : null,
        variation_axis: isCuidarDeMim ? (context.variation_axis ?? null) : null,
      })
    } catch {}

    // ✅ Limite diário global — somente aqui (antes da geração real)
    const g = await tryConsumeDailyAI(DAILY_LIMIT)
    gate = { actorId: g.actorId, dateKey: g.dateKey }

    if (!g.allowed) {
      const res = NextResponse.json(
        {
          blocked: true,
          message: DAILY_LIMIT_MESSAGE,
        },
        { status: 200 },
      )

      if (g.anonToSet) {
        res.cookies.set(DAILY_LIMIT_ANON_COOKIE, g.anonToSet, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      }

      console.info('[AI_LIMIT] blocked', {
        route: '/api/ai/emocional',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

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
        temperature: isMaternar || isEu360 ? 0.4 : 0.7,
        text: {
          format: {
            type: 'json_schema',
            ...schemaToUse,
          },
        },
      }),
    }).finally(() => clearTimeout(timeout))

    if (!openAiRes.ok) {
      // falha antes de resposta final → não deve consumir cota
      if (gate) await releaseDailyAI(gate.actorId, gate.dateKey)

      console.error(
        '[IA Emocional] Erro HTTP da OpenAI:',
        openAiRes.status,
        await openAiRes.text().catch(() => '(sem corpo)'),
      )
      return jsonError('Não consegui gerar a análise emocional agora.', 502)
    }

    const response = await openAiRes.json()

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

    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // parsing falhou → não deve consumir cota
      if (gate) await releaseDailyAI(gate.actorId, gate.dateKey)

      const first = rawText.indexOf('{')
      const last = rawText.lastIndexOf('}')
      if (first >= 0 && last > first) parsed = JSON.parse(rawText.slice(first, last + 1))
      else throw new Error('Resposta da IA sem JSON válido')
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error) {
    // erro geral após gate → libera para não queimar cota
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    console.error('[IA Emocional] Erro geral na rota /api/ai/emocional:', error)
    return NextResponse.json({ error: 'Não foi possível gerar a análise emocional agora.' }, { status: 500 })
  }
}
