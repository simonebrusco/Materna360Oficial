// app/hooks/useDailyAISuggestions.ts

'use client'

import { useCallback, useState } from 'react'
import { toast } from '@/app/lib/toast'

export type DailyAISuggestion = {
  id: string
  title: string
  description?: string
  category?: string
  priority?: 'alta' | 'media' | 'baixa'
}

/**
 * Hook de alto nível para consumir a IA de sugestões diárias do /meu-dia.
 *
 * Usa o endpoint /api/ai/rotina no modo "quick-ideas".
 * Se der erro ou vier vazio, o componente cai no fallback editorial.
 */
export function useDailyAISuggestions() {
  const [suggestions, setSuggestions] = useState<DailyAISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestSuggestions = useCallback(
    async (params: { mood: string | null; intention: string | null }) => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetch('/api/ai/rotina', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'quick-ideas',
            origin: 'meu-dia',
            // contexto extra para a IA (mesmo que hoje ela não use tudo)
            mood: params.mood,
            intention: params.intention,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          const message =
            (data && typeof data.error === 'string' && data.error) ||
            'Não foi possível trazer sugestões agora.'
          throw new Error(message)
        }

        const data = await res.json()
        const raw = Array.isArray(data?.suggestions) ? data.suggestions : []

        const normalized: DailyAISuggestion[] = raw.map(
          (item: any, index: number) => ({
            id: item.id ?? `ai-suggestion-${index}`,
            title: item.title ?? item.heading ?? 'Sugestão para o seu dia',
            description:
              item.description ??
              item.text ??
              'Uma pequena ação que pode deixar seu dia mais leve e organizado.',
            category: item.category,
            priority: item.priority,
          }),
        )

        setSuggestions(normalized)

        if (normalized.length > 0) {
          toast.success('Sugestões pensadas para o seu dia foram atualizadas ✨')
        }
      } catch (err: any) {
        console.error('[useDailyAISuggestions] Erro ao buscar sugestões:', err)
        const message =
          err?.message ??
          'Não consegui carregar sugestões agora. Tente novamente em instantes.'
        setError(message)
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
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
