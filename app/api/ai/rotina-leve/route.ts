// app/api/ai/rotina-leve/route.ts

import { NextResponse } from 'next/server'
import {
  generateRotinaLeveSuggestions,
  type RotinaLeveRequest,
  isRotinaLeveAIEnabled,
} from '@/app/lib/ai/rotinaLeve'

export const dynamic = 'force-dynamic'

/**
 * Endpoint oficial de IA da Rotina Leve.
 *
 * Agora:
 * - Usa IA real quando:
 *   - Feature flag NEXT_PUBLIC_FF_COACH_V1 === '1'
 *   - OPENAI_API_KEY está configurada
 * - Caso contrário, usa SEMPRE o modo mock interno (seguro).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RotinaLeveRequest

    // Garantia de estrutura mínima
    if (!body || typeof body !== 'object' || !body.context) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      )
    }

    const aiEnabled = isRotinaLeveAIEnabled()
    const hasApiKey = !!process.env.OPENAI_API_KEY

    const shouldUseMock = !(aiEnabled && hasApiKey)

    const suggestions = await generateRotinaLeveSuggestions(body, {
      mock: shouldUseMock ? true : false,
    })

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[RotinaLeveAI] Error:', err)
    return NextResponse.json(
      { error: 'Internal error while generating suggestions.' },
      { status: 500 },
    )
  }
}
