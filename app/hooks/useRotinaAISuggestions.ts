'use client'

import { useState } from 'react'
import type { RotinaComQuem, RotinaTipoIdeia } from '@/app/lib/ai/maternaCore'

type RotinaAISuggestion = {
  id: string
  title: string
  description: string
  category?: string
  tags?: string[]
}

type RequestPayload = {
  mood?: string
  energy?: 'baixa' | 'media' | 'alta'
  timeOfDay?: string
  hasKidsAround?: boolean
  availableMinutes?: number
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null
}

type UseRotinaAISuggestionsResult = {
  suggestions: RotinaAISuggestion[]
  isLoading: boolean
  error: string | null
  requestSuggestions: (payload: RequestPayload) => Promise<void>
}

export function useRotinaAISuggestions(): UseRotinaAISuggestionsResult {
  const [suggestions, setSuggestions] = useState<RotinaAISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestSuggestions = async (payload: RequestPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/rotina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'quick-ideas',
          origin: 'rotina-leve',
          // Mapeamos o que já vem da página:
          tempoDisponivel: payload.availableMinutes ?? null,
          comQuem: payload.comQuem ?? null,
          tipoIdeia: payload.tipoIdeia ?? null,
        }),
      })

      if (!res.ok) {
        throw new Error(`Status ${res.status}`)
      }

      const data = await res.json()
      const raw = Array.isArray(data?.suggestions) ? data.suggestions : null

      if (!raw || raw.length === 0) {
        // Fallback se a IA não devolver nada
        setSuggestions([
          {
            id: 'fallback-1',
            title: 'Conexão de 5 minutos',
            description:
              'Sente com seu filho e perguntem um ao outro: “qual foi a melhor parte do seu dia?”',
            category: 'conexao',
            tags: ['rapida'],
          },
          {
            id: 'fallback-2',
            title: 'Mini pausa para você',
            description:
              'Beba um copo de água devagar, alongue os ombros e faça três respirações profundas.',
            category: 'autocuidado',
            tags: ['autocuidado'],
          },
        ])
        return
      }

      setSuggestions(raw)
    } catch (err) {
      console.error('[useRotinaAISuggestions] Erro ao buscar ideias rápidas:', err)
      setError('Não consegui trazer ideias agora, tente de novo em alguns instantes.')
      // Fallback seguro para não quebrar o hub
      setSuggestions([
        {
          id: 'safe-1',
          title: 'Pequeno momento de presença',
          description:
            'Desligue as telas por 5 minutos e faça algo simples com seu filho: olhar pela janela, desenhar ou abraçar em silêncio.',
          category: 'conexao',
          tags: ['rapida', 'sem-tela'],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    suggestions,
    isLoading,
    error,
    requestSuggestions,
  }
}
