// app/lib/ai/client.ts
import type { AIType } from './types'
import { hasPerceptiveRepetition, recordAntiRepeat, makeTitleSignature, makeThemeSignature } from './antiRepetitionLocal'

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
 * Anti-repetição local é aplicada silenciosamente quando houver title/body.
 */
export async function callAI<TResponse = any, TPayload = unknown>({
  type,
  payload,
}: CallAIOptions<TPayload>): Promise<TResponse> {
  const endpoint = AI_ENDPOINTS[type]
  if (!endpoint) throw new Error(`Missing AI endpoint for type "${type}"`)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`AI request failed for type "${type}" with status ${res.status}`)
  }

  const data = (await res.json()) as TResponse

  // Anti-repetição local (silenciosa) — só registra quando houver sinais
  try {
    const maybe = data as any
    const titleSig = makeTitleSignature(maybe?.title ?? '')
    const bodySig = makeThemeSignature(maybe?.body ?? '')
    const hub = `ai/${type}`

    if (titleSig || bodySig) {
      // Se repetir, não bloqueia aqui (P34.11.2 não pode “sumir” conteúdo).
      // O retry fica por conta do chamador quando necessário.
      // Aqui apenas registra para compor histórico transversal.
      const repeated = hasPerceptiveRepetition({ hub, title_signature: titleSig, theme_signature: bodySig })
      // Registra sempre (inclusive repetidos) para manter histórico consistente
      recordAntiRepeat({ hub, title_signature: titleSig, theme_signature: bodySig, variation_axis: String((payload as any)?.variation_axis ?? '') })
      // Observação: não retorna erro nem altera resposta (sem UX).
      void repeated
    }
  } catch {
    // nunca falha por anti-repeat
  }

  return data
}
