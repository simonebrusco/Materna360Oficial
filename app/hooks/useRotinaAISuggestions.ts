'use client'

import { useState, useCallback } from 'react'
import {
  getRotinaAISuggestions,
  type RotinaAIResponse,
  type RotinaAIRequestPayload,
  type RotinaMode,
} from '@/app/lib/ai/rotina'

interface UseRotinaAISuggestionsOptions {
  defaultMode?: RotinaMode
}

interface UseRotinaAISuggestionsResult {
  loading: boolean
  error: string | null
  data: RotinaAIResponse | null
  call: (overridePayload?: Partial<RotinaAIRequestPayload>) => Promise<void>
}

/**
 * Hook client-side para consumir a IA da Rotina Leve de forma segura.
 * Ainda NÃO está acoplado a nenhum componente de UI.
 */
export function useRotinaAISuggestions(
  options: UseRotinaAISuggestionsOptions = {},
): UseRotinaAISuggestionsResult {
  const { defaultMode = 'ideias_rapidas' } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RotinaAIResponse | null>(null)

  const call = useCallback(
    async (overridePayload?: Partial<RotinaAIRequestPayload>) => {
      setLoading(true)
      setError(null)

      try {
        const payload: RotinaAIRequestPayload = {
          mode: defaultMode,
          locale: 'pt-BR',
          ...overridePayload,
        }

        const response = await getRotinaAISuggestions(payload)
        setData(response)
      } catch (err) {
        console.error('[useRotinaAISuggestions] error', err)
        setError('Não foi possível carregar sugestões no momento.')
      } finally {
        setLoading(false)
      }
    },
    [defaultMode],
  )

  return {
    loading,
    error,
    data,
    call,
  }
}
