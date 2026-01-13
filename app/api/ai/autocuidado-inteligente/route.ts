// app/api/ai/autocuidado-inteligente/route.ts

import { NextResponse } from 'next/server'
import {
  AutocuidadoRequest,
  generateAutocuidadoSuggestion,
} from '@/app/lib/ai/autocuidadoInteligente'
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_MESSAGE,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

export async function POST(req: Request) {
  let gate: { actorId: string; dateKey: string } | null = null

  // Parse do body (mantém comportamento atual)
  let body: AutocuidadoRequest = {}
  try {
    body = (await req.json()) as AutocuidadoRequest
  } catch {
    body = {}
  }

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
        route: '/api/ai/autocuidado-inteligente',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

    // Tentativa principal
    const suggestion = await generateAutocuidadoSuggestion(body)
    return NextResponse.json({ suggestion }, { status: 200 })
  } catch (e) {
    // Se consumiu e falhou antes de entregar resposta final, libera
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    console.error('[API Autocuidado Inteligente] Erro ao gerar sugestão:', e)

    // fallback extremo: devolve mock (mantém comportamento)
    const suggestion = await generateAutocuidadoSuggestion(body, {
      mock: true,
    })
    return NextResponse.json({ suggestion }, { status: 200 })
  }
}
