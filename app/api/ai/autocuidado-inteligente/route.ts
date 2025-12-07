// app/api/ai/autocuidado-inteligente/route.ts

import { NextResponse } from 'next/server'
import {
  AutocuidadoRequest,
  generateAutocuidadoSuggestion,
} from '@/app/lib/ai/autocuidadoInteligente'

export async function POST(req: Request) {
  let body: AutocuidadoRequest = {}

  try {
    body = (await req.json()) as AutocuidadoRequest
  } catch {
    body = {}
  }

  try {
    const suggestion = await generateAutocuidadoSuggestion(body)
    return NextResponse.json({ suggestion })
  } catch (e) {
    console.error(
      '[API Autocuidado Inteligente] Erro ao gerar sugestão:',
      e,
    )
    // fallback extremo: devolve mock
    const suggestion = await generateAutocuidadoSuggestion(body, {
      mock: true,
    })
    return NextResponse.json({ suggestion })
  }
}
