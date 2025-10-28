'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import ProfessionalCard, { type ProfessionalCardData } from './ProfessionalCard'
import type { ProfessionalsSearchFilters } from './ProfessionalsSearchForm'

type ApiResponse = {
  items: ProfessionalCardData[]
  hasMore: boolean
}

type ProfessionalsResultsProps = {
  initial?: ProfessionalsSearchFilters
}

const SKELETON_COUNT = 6

export default function ProfessionalsResults({ initial }: ProfessionalsResultsProps) {
  const [filters, setFilters] = useState<ProfessionalsSearchFilters | null>(initial ?? null)
  const [data, setData] = useState<ProfessionalCardData[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSearchEvent = useCallback((event: CustomEvent<ProfessionalsSearchFilters>) => {
    setData([])
    setPage(1)
    setHasMore(false)
    setError(null)
    setFilters(event.detail)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const listener = (event: Event) => {
      handleSearchEvent(event as CustomEvent<ProfessionalsSearchFilters>)
    }

    window.addEventListener('pros:search', listener as EventListener)
    return () => window.removeEventListener('pros:search', listener as EventListener)
  }, [handleSearchEvent])

  useEffect(() => {
    if (!filters) {
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
      ),
      formato: 'online',
      page: String(page),
    })

    fetch(`/api/support/pros?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar os profissionais.')
        }
        const json = (await response.json()) as ApiResponse
        setData((previous) => (page === 1 ? json.items : [...previous, ...json.items]))
        setHasMore(Boolean(json.hasMore))
      })
      .catch((error_) => {
        if (error_.name === 'AbortError') {
          return
        }
        console.error('[ProfessionalsResults] Falha ao carregar profissionais', error_)
        setError('Não foi possível carregar os profissionais agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [filters, page])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((previous) => previous + 1)
    }
  }

  if (!filters) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 p-8 text-center text-support-2">
        Use os filtros acima e clique em <strong>Buscar profissionais</strong> para ver resultados (formato online).
      </div>
    )
  }

  const showSkeletonGrid = loading && data.length === 0
  const showEmptyState = !loading && data.length === 0 && !error

  return (
    <div className="space-y-6">
      {showSkeletonGrid ? (
        <div className="GridRhythm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div key={index} className="h-56 rounded-2xl border border-white/60 bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : null}

      {data.length > 0 ? (
        <div className="GridRhythm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((pro) => (
            <ProfessionalCard key={pro.id} pro={pro} />
          ))}
        </div>
      ) : null}

      {showEmptyState ? (
        <div className="rounded-2xl border border-white/60 bg-white/80 p-8 text-center text-support-2">
          Nenhum profissional encontrado para os filtros escolhidos.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-support-1 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
