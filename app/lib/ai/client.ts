// app/lib/ai/client.ts

import type { AIType } from './types'

type AIEndpointMap = Record<AIType, string>

const AI_ENDPOINTS: AIEndpointMap = {
  rotina: '/api/ai/rotina',
  emocional: '/api/ai/emocional',
  autocuidado: '/api/ai/autocuidado',
  biblioteca: '/api/ai/biblioteca',
  planner: '/api/ai/planner',
}

interface CallAIOptions<TPayload = unknown> {
  type: AIType
  payload?: TPayload
}

/**
 * Cliente genérico e seguro para chamar os endpoints de IA do Materna360.
 * Não faz nenhuma suposição de layout e não é acoplado a componentes.
 */
export async function callAI<TResponse = unknown, TPayload = unknown>({
  type,
  payload,
}: CallAIOptions<TPayload>): Promise<TResponse> {
  const endpoint = AI_ENDPOINTS[type]

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!res.ok) {
    // No futuro podemos plugar telemetria aqui
    throw new Error(`AI request failed for type "${type}" with status ${res.status}`)
  }

  return (await res.json()) as TResponse
}
