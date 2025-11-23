// app/api/ai/rotina-leve/route.ts

import { NextResponse } from 'next/server'
import {
  generateRotinaLeveSuggestions,
  type RotinaLeveRequest,
} from '@/lib/ai/rotinaLeve'

export const dynamic = 'force-dynamic'

/**
 * Endpoint oficial de IA da Rotina Leve.
 *
 * Totalmente seguro: não chama nenhum provedor externo.
 * Usa sempre o modo MOCK do serviço interno.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RotinaLeveRequest

    // Garantia de estrutura mínima
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Chama o serviço mock interno
    const suggestions = await generateRotinaLeveSuggestions(body, {
      mock: true,
    })

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[RotinaLeveAI] Error:', err)
    return NextResponse.json(
      { error: 'Internal error while generating suggestions.' },
      { status: 500 }
    )
  }
}
