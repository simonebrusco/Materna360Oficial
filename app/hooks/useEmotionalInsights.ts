'use client'

import { useState, useCallback } from 'react'
import {
  getEmotionalInsights,
  type EmotionalAIResponse,
  type EmotionalAIRequestPayload,
} from '@/app/lib/ai/emocional'

interface UseEmotionalInsightsResult {
  loading: boolean
  error: string | null
  data: EmotionalAIResponse | null
  call: (payload: EmotionalAIRequestPayload) => Promise<void>
}

/**
 * Hook client-side para consumir a IA Emocional de forma segura.
 * Ainda NÃO está acoplado a nenhum componente de UI.
 */
export function useEmotionalInsights(): UseEmotionalInsightsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EmotionalAIResponse | null>(null)

  const call = useCallback(async (payload: EmotionalAIRequestPayload) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getEmotionalInsights(payload)
      setData(response)
    } catch (err) {
      console.error('[useEmotionalInsights] error', err)
      setError('Não foi possível gerar o insight emocional agora.')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    data,
    call,
  }
}
