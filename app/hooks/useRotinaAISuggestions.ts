// app/hooks/useRotinaAISuggestions.ts

'use client'

import { useCallback, useState } from 'react'
import {
  type RotinaLeveContext,
  type RotinaLeveSuggestion,
} from '@/app/lib/ai/rotinaLeve'
import { fetchRotinaLeveSuggestions } from '@/app/lib/ai/rotinaLeveClient'

export type UseRotinaAISuggestionsState = {
  suggestions: RotinaLeveSuggestion[]
  isLoading: boolean
  error: string | null
}

export type UseRotinaAISuggestionsResult = UseRotinaAISuggestionsState & {
  /**
   * Dispara manualmente a geração de sugestões de IA
   * com base no contexto atual da Rotina Leve.
   */
  requestSuggestions: (context: RotinaLeveContext) => Promise<void>
}

/**
 * Hook de alto nível para consumir a IA da Rotina Leve.
 *
 * Não faz chamadas automáticas: sempre depende do `requestSuggestions`,
 * deixando o componente no controle total de quando disparar a IA.
 */
export function useRotinaAISuggestions(): UseRotinaAISuggestionsResult {
  const [suggestions, setSuggestions] = useState<RotinaLeveSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestSuggestions = useCallback(
    async (context: RotinaLeveContext) => {
      setIsLoading(true)
      setError(null)

      const result = await fetchRotinaLeveSuggestions(context)

      if (!result.ok) {
        setIsLoading(false)
        setSuggestions([])
        setError(result.error || 'Não foi possível gerar sugestões agora.')
        return
      }

      setIsLoading(false)
      setSuggestions(result.suggestions)
    },
    [],
  )

  return {
    suggestions,
    isLoading,
    error,
    requestSuggestions,
  }
}
