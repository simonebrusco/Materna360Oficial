// app/api/ai/rotina-leve/route.ts

import { NextResponse } from 'next/server'
import {
  generateRotinaLeveSuggestions,
  type RotinaLeveRequest,
  isRotinaLeveAIEnabled,
} from '@/app/lib/ai/rotinaLeve'
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_MESSAGE,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

export const dynamic = 'force-dynamic'

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
          suggestions: [],
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
        route: '/api/ai/rotina-leve',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

    const body = (await req.json()) as RotinaLeveRequest

    if (!body || typeof body !== 'object' || !body.context) {
      // erro de validação → não consome quota
      if (gate) await releaseDailyAI(gate.actorId, gate.dateKey)

      return NextResponse.json({ suggestions: [] }, { status: 400 })
    }

    const aiEnabled = isRotinaLeveAIEnabled()
    const hasApiKey = !!process.env.OPENAI_API_KEY
    const shouldUseMock = !(aiEnabled && hasApiKey)

    const suggestions = await generateRotinaLeveSuggestions(body, {
      mock: shouldUseMock ? true : false,
    })

    // 🔒 Garantia de UX premium — nunca retornar vazio
    if (!suggestions || suggestions.length === 0) {
      console.warn('[RotinaLeveAI] Empty result, using fallback')
      return NextResponse.json({
        suggestions: [
          {
            id: 'fallback-1',
            category: 'receita-inteligente',
            title: 'Frutinha amassada com aveia',
            description: 'Opção simples e rápida para um lanche leve.',
            timeLabel: 'Pronto em ~5 min',
            ageLabel: 'a partir de 6 meses',
            preparation:
              'Amasse uma fruta macia e misture com um pouco de aveia. Ajuste a textura conforme a idade.',
          },
        ],
      })
    }

    return NextResponse.json({ suggestions }, { status: 200 })
  } catch (err) {
    // Se consumiu e falhou antes de resposta final, libera
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    console.error('[RotinaLeveAI] Error:', err)
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}
