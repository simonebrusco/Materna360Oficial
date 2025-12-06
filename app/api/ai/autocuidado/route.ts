// app/api/ai/autocuidado/route.ts

import { NextResponse } from 'next/server'
import {
  generateAutocuidadoSuggestion,
  type AutocuidadoRequest,
  isAutocuidadoAIEnabled,
} from '@/app/lib/ai/autocuidado'

export const dynamic = 'force-dynamic'

/**
 * Endpoint oficial de IA do Autocuidado Inteligente.
 *
 * Regras:
 * - Usa IA real quando:
 *   - Feature flag NEXT_PUBLIC_FF_COACH_V1 === '1'
 *   - OPENAI_API_KEY está configurada
 * - Caso contrário, usa SEMPRE o modo mock interno (seguro).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AutocuidadoRequest | null

    if (!body || typeof body !== 'object' || !body.context) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      )
    }

    const aiEnabled = isAutocuidadoAIEnabled()
    const hasApiKey = !!process.env.OPENAI_API_KEY

    const shouldUseMock = !(aiEnabled && hasApiKey)

    const suggestion = await generateAutocuidadoSuggestion(body, {
      mock: shouldUseMock,
    })

    return NextResponse.json({ suggestion })
  } catch (err) {
    console.error('[AutocuidadoAI] Error:', err)
    return NextResponse.json(
      { error: 'Internal error while generating suggestion.' },
      { status: 500 },
    )
  }
}
