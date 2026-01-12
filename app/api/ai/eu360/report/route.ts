// app/api/ai/eu360/report/route.ts

import { NextResponse } from 'next/server'
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

// NÃO exporte types em route.ts (evita conflito com tipagem de Route)
type Eu360ReportInput = {
  answers: {
    q1?: string
    q2?: string
    q3?: string
    q4?: string
    q5?: string
    q6?: string
  }
  signal: {
    stateId?: string
    tone: 'gentil' | 'direto'
  }
  timeframe: 'current' | 'fortnight'
}

type Eu360ReportResponse = {
  report: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function safeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

function wordCount(text: string) {
  const tokens = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  return tokens.length
}

function hasListMarkers(text: string) {
  const lines = text.split('\n').map((l) => l.trim())
  return lines.some((l) => /^(\-|\•|\*|\d+[\.\)]|[a-zA-Z][\.\)])\s+/.test(l))
}

function containsForbidden(text: string) {
  const t = text.toLowerCase()

  const forbiddenVerbs = /\b(faça|tente|comece|evite|deveria|precisa)\b/i
  const urgency = /\b(agora|imediatamente|o quanto antes)\b/i
  const questions = /[?¿]/.test(text)

  // bloqueio conservador
  const clinical =
    /\b(diagn[oó]stic|transtorno|terapia|psic[oó]log|psiquiat|rem[eé]dio|medicaç|tratamento)\b/i

  return {
    forbiddenVerbs: forbiddenVerbs.test(t),
    urgency: urgency.test(t),
    questions,
    clinical: clinical.test(t),
    list: hasListMarkers(text),
  }
}

function normalizeReport(text: string) {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
  return cleaned.replace(/\n{3,}/g, '\n\n').trim()
}

function isValidReport(text: string) {
  const report = normalizeReport(text)
  const wc = wordCount(report)
  const flags = containsForbidden(report)

  const okWords = wc >= 90 && wc <= 140
  const okBlocks = report.split('\n\n').filter(Boolean).length === 3

  const ok =
    okWords &&
    okBlocks &&
    !flags.forbiddenVerbs &&
    !flags.urgency &&
    !flags.questions &&
    !flags.clinical &&
    !flags.list

  return { ok, wc, flags, report }
}

const FALLBACK_CANONICO =
  'Este momento parece pedir mais contenção do que expansão.\n\nQuando muitas frentes coexistem, é comum que a energia se fragmente.\n\nSituações assim costumam responder melhor a menos pressão interna.'

// Bloqueio diário (sem números, sem técnico, sem CTA) — 3 blocos como o contrato do Eu360
const DAILY_LIMIT_REPORT =
  'Por hoje, é melhor pausar.\n\nQuando a mente pede mais do que o corpo sustenta, insistir costuma virar peso.\n\nAmanhã, com mais espaço interno, isso volta a ficar mais leve.'

function buildSystemMessage() {
  return `
Você escreve o Relatório IA do hub EU360 do Materna360.

Princípios (obrigatórios):
- Nomeie estados, nunca identidades.
- Valide sem normalizar sofrimento.
- Crie espaço interno, não urgência.
- Deve fazer sentido mesmo se a usuária fechar o app imediatamente.
- Português do Brasil, tom adulto, respeitoso, sem performance.

PROIBIDO:
- Diagnóstico, termos clínicos, aconselhamento, terapia, tratamento.
- Coaching, metas, plano, desafio, CTA.
- Perguntas.
- Listas ou bullets.
- Imperativos e verbos que instruem (faça, tente, comece, evite, deveria, precisa).
- Urgência (agora, imediatamente, o quanto antes).

FORMATO OBRIGATÓRIO:
- 90 a 140 palavras.
- Sempre 3 blocos, nesta ordem:
  1) Leitura do momento (2–3 frases)
  2) Impacto interno (2–3 frases)
  3) Direção suave (1–2 frases)
- Texto corrido em 3 parágrafos (separados por uma linha em branco).
- Sem títulos.
- Sem listas.
- Sem perguntas.
`.trim()
}

function buildUserMessage(input: Eu360ReportInput) {
  const payload = {
    timeframe: input.timeframe,
    signal: input.signal,
    answers: input.answers,
  }

  return `
Gere APENAS o texto do relatório no campo "report", seguindo o formato obrigatório.
Use "answers" e "signal" apenas como calibradores internos (sem mencionar questionário, respostas, perfil, persona ou resultado).
Contexto:
${JSON.stringify(payload, null, 2)}
`.trim()
}

const reportSchema = {
  name: 'eu360_report',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      report: { type: 'string', minLength: 1 },
    },
    required: ['report'],
  },
} as const

async function callOpenAI(apiKey: string, input: Eu360ReportInput) {
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
        { role: 'system', content: buildSystemMessage() },
        { role: 'user', content: buildUserMessage(input) },
      ],
      temperature: input.signal.tone === 'direto' ? 0.35 : 0.25,
      text: {
        format: {
          type: 'json_schema',
          ...reportSchema,
        },
      },
    }),
  }).finally(() => clearTimeout(timeout))

  if (!openAiRes.ok) {
    const bodyText = await openAiRes.text().catch(() => '(sem corpo)')
    console.error('[Eu360 Report] Erro HTTP da OpenAI:', openAiRes.status, bodyText)
    throw new Error('OpenAI HTTP error')
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
    const first = rawText.indexOf('{')
    const last = rawText.lastIndexOf('}')
    if (first >= 0 && last > first) parsed = JSON.parse(rawText.slice(first, last + 1))
    else throw new Error('Resposta da IA sem JSON válido')
  }

  return parsed as Eu360ReportResponse
}

export async function POST(request: Request) {
  let gate: { actorId: string; dateKey: string } | null = null

  try {
    // Limite diário global (ética) — backend como fonte de verdade
    const g = await tryConsumeDailyAI(DAILY_LIMIT)
    gate = { actorId: g.actorId, dateKey: g.dateKey }

    if (!g.allowed) {
      const res = NextResponse.json({ report: DAILY_LIMIT_REPORT }, { status: 200 })

      if (g.anonToSet) {
        res.cookies.set(DAILY_LIMIT_ANON_COOKIE, g.anonToSet, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      }

      console.info('[AI_LIMIT] blocked', {
        route: '/api/ai/eu360/report',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[Eu360 Report] OPENAI_API_KEY não configurada')
      return jsonError('Configuração de IA indisponível no momento.', 500)
    }

    const body = (await request.json()) as Eu360ReportInput

    const timeframe = body?.timeframe
    const tone = body?.signal?.tone
    if (!timeframe) return jsonError('Parâmetro "timeframe" é obrigatório.', 400)
    if (!tone) return jsonError('Parâmetro "signal.tone" é obrigatório.', 400)

    const input: Eu360ReportInput = {
      answers: {
        q1: safeString(body?.answers?.q1) ?? undefined,
        q2: safeString(body?.answers?.q2) ?? undefined,
        q3: safeString(body?.answers?.q3) ?? undefined,
        q4: safeString(body?.answers?.q4) ?? undefined,
        q5: safeString(body?.answers?.q5) ?? undefined,
        q6: safeString(body?.answers?.q6) ?? undefined,
      },
      signal: {
        stateId: safeString(body?.signal?.stateId) ?? undefined,
        tone: tone === 'direto' ? 'direto' : 'gentil',
      },
      timeframe: timeframe === 'fortnight' ? 'fortnight' : 'current',
    }

    try {
      console.log('[Eu360 Report] request', {
        timeframe: input.timeframe,
        tone: input.signal.tone,
        stateId: input.signal.stateId ?? null,
        hasAnswers: Object.values(input.answers).some(Boolean),
      })
    } catch {}

    // 1 geração + 1 regeneração (tentativas internas NÃO consomem cota adicional)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const generated = await callOpenAI(apiKey, input)
        const reportText = typeof generated?.report === 'string' ? generated.report : ''
        const { ok, wc, flags, report } = isValidReport(reportText)

        if (ok) {
          return NextResponse.json({ report }, { status: 200 })
        }

        console.warn('[Eu360 Report] inválido, tentando novamente', {
          attempt,
          wc,
          flags,
        })
      } catch (e) {
        console.warn('[Eu360 Report] erro em tentativa', { attempt, error: String(e) })
      }
    }

    // Persistiu inválido → fallback canônico local
    return NextResponse.json({ report: FALLBACK_CANONICO }, { status: 200 })
  } catch (error) {
    // Se já consumimos cota e falhou antes de entregar resposta final, liberamos o consumo
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    console.error('[Eu360 Report] Erro geral na rota /api/ai/eu360/report:', error)
    return NextResponse.json({ error: 'Não foi possível gerar o relatório agora.' }, { status: 500 })
  }
}
