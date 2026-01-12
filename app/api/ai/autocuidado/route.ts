// app/api/ai/autocuidado/route.ts

import { NextResponse } from 'next/server'
import {
  generateAutocuidadoSuggestion,
  type AutocuidadoRequest,
  isAutocuidadoAIEnabled,
} from '@/app/lib/ai/autocuidado'
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_MESSAGE,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

export const dynamic = 'force-dynamic'

/**
 * Endpoint oficial de IA do Autocuidado Inteligente.
 *
 * Regras:
 * - Usa IA real quando:
 *   - Feature flag NEXT_PUBLIC_FF_COACH_V1 === '1'
 *   - OPENAI_API_KEY está configurada
 * - Caso contrário, usa SEMPRE o modo mock interno (seguro).
 *
 * + P34.11.3:
 * - Limite diário global (backend como fonte de verdade)
 * - Bloqueio acolhedor (sem números, sem técnico, sem CTA)
 */
export async function POST(req: Request) {
  let gate: { actorId: string; dateKey: string } | null = null

  try {
    // Limite diário global (ética)
    const g = await tryConsumeDailyAI(DAILY_LIMIT)
    gate = { actorId: g.actorId, dateKey: g.dateKey }

    if (!g.allowed) {
      const res = NextResponse.json(
        {
          blocked: true,
          message: DAILY_LIMIT_MESSAGE,
          suggestion: null,
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
        route: '/api/ai/autocuidado',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

    const body = (await req.json()) as AutocuidadoRequest | null

    if (!body || typeof body !== 'object' || !body.context) {
      // não consome quota em erro de validação
      if (gate) await releaseDailyAI(gate.actorId, gate.dateKey)

      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const aiEnabled = isAutocuidadoAIEnabled()
    const hasApiKey = !!process.env.OPENAI_API_KEY

    const shouldUseMock = !(aiEnabled && hasApiKey)

    const suggestion = await generateAutocuidadoSuggestion(body, {
      mock: shouldUseMock,
    })

    return NextResponse.json({ suggestion }, { status: 200 })
  } catch (err) {
    // Se consumiu e falhou antes de entregar resposta final, libera
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    console.error('[AutocuidadoAI] Error:', err)
    return NextResponse.json(
      { error: 'Internal error while generating suggestion.' },
      { status: 500 },
    )
  }
}
