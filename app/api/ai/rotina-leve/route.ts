// app/api/ai/rotina-leve/route.ts

import { NextResponse } from 'next/server'
import {
  generateRotinaLeveSuggestions,
  type RotinaLeveRequest,
  isRotinaLeveAIEnabled,
} from '@/app/lib/ai/rotinaLeve'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RotinaLeveRequest

    if (!body || typeof body !== 'object' || !body.context) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 400 },
      )
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

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[RotinaLeveAI] Error:', err)
    return NextResponse.json(
      { suggestions: [] },
      { status: 500 },
    )
  }
}
