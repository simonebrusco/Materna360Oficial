'use client'

import { useState } from 'react'
import type { RotinaComQuem, RotinaTipoIdeia } from '@/app/lib/ai/maternaCore'

// Cache local de avoidIds por combinação (tipoIdeia|tempo|comQuem)
const ROTINA_AVOID: Record<string, string[]> = {}

const rotinaKey = (p: any) =>
  `${String(p?.tipoIdeia ?? '')}|${String(p?.availableMinutes ?? '')}|${String(p?.comQuem ?? '')}`

const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)))

const newNonce = () => {
  try {
    const c: any = (globalThis as any)?.crypto
    if (c?.randomUUID) return String(c.randomUUID())
  } catch (e) {}
  return String(Date.now())
}

type RotinaAISuggestion = {
  id: string
  title: string
  description: string
  category?: string
  tags?: string[]
}

type RequestPayload = {
    // Controle de variação (opcional; se não vier, geramos localmente)
    nonce?: string
    // Evita repetição (opcional; se não vier, usamos cache local)
    avoidIds?: string[]
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
        const k = rotinaKey(payload)
        const nonce = String(payload?.nonce ?? newNonce())
        const avoidIds = Array.isArray(payload?.avoidIds)
          ? payload.avoidIds.map((x) => String(x))
          : (ROTINA_AVOID[k] ?? [])

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
            nonce,
            avoidIds,
        }),
      })

      if (!res.ok) {
        throw new Error(`Status ${res.status}`)
      }

      const data = await res.json()
      const raw = Array.isArray(data?.suggestions) ? data.suggestions : null
      const exhausted = Boolean(data?.meta?.exhausted)

        // Exhausted tem prioridade absoluta: nunca cair em fallback quando o pool acabou
        if (exhausted && (!raw || raw.length === 0)) {
          setSuggestions([])
          setError('Você já viu todas as opções disponíveis para este recorte. Mude o filtro para ver novas ideias.')
          return
        }

        const meta = (data as any)?.meta
        const isAdm = String(meta?.source ?? '') === 'adm'
        // exhausted já calculado acima (no data.meta)
        // ADM-first: se não há sugestões, respeitar vazio (não usar fallback genérico)
        if (isAdm && (!raw || raw.length === 0)) {
          setSuggestions([])
          if (exhausted) {
            setError('Você já viu todas as opções disponíveis para este recorte. Mude o filtro para ver novas ideias.')
          } else {
            setError('Ainda não há opções publicadas para este recorte. Tente outro filtro.')
          }
          return
        }
      if (!isAdm && (!raw || raw.length === 0)) {
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

      try {

        const rawIds = raw.map((x: any) => String(x?.id ?? '')).filter(Boolean)

        ROTINA_AVOID[k] = uniq([...(avoidIds ?? []), ...rawIds])

      } catch (e) {}
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
