// app/lib/ai/rotinaLeveClient.ts

import {
  type RotinaLeveContext,
  type RotinaLeveRequest,
  type RotinaLeveSuggestion,
} from './rotinaLeve'

export type FetchRotinaLeveResult =
  | { ok: true; suggestions: RotinaLeveSuggestion[] }
  | { ok: false; error: string }

/**
 * Client seguro para chamar o endpoint de IA da Rotina Leve.
 *
 * Hoje fala apenas com o endpoint MOCK `/api/ai/rotina-leve`.
 * Pensado para ser usado por hooks e componentes sem duplicar lógica de fetch.
 */
export async function fetchRotinaLeveSuggestions(
  context: RotinaLeveContext
): Promise<FetchRotinaLeveResult> {
  try {
    const payload: RotinaLeveRequest = {
      context,
    }

    const res = await fetch('/api/ai/rotina-leve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      return {
        ok: false,
        error: `Request failed with status ${res.status}`,
      }
    }

    const data = (await res.json()) as {
      suggestions?: RotinaLeveSuggestion[]
      error?: string
    }

    if (!data || !Array.isArray(data.suggestions)) {
      return {
        ok: false,
        error: data?.error ?? 'Invalid response from Rotina Leve AI endpoint.',
      }
    }

    return {
      ok: true,
      suggestions: data.suggestions,
    }
  } catch (error) {
    console.error('[RotinaLeveAIClient] Error:', error)
    return {
      ok: false,
      error: 'Unexpected error while calling Rotina Leve AI client.',
    }
  }
}
