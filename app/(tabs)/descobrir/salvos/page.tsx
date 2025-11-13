'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSavedSuggestions } from '../hooks/useSavedSuggestions'
import { track } from '@/app/lib/telemetry'
import { BookmarkMinus, ArrowLeft } from 'lucide-react'

export default function DiscoverSavedPage() {
  const { saved, remove, isSaved } = useSavedSuggestions()

  React.useEffect(() => {
    track('discover.suggestion_saved', {
      action: 'view',
      view: 'saved_page_open',
      count: saved.length,
    })
    // NOTE: include saved.length to satisfy react-hooks/exhaustive-deps
  }, [saved.length])

  const onRemove = (id: string) => {
    if (!isSaved(id)) return
    remove(id)
    track('discover.suggestion_saved', {
      action: 'remove',
      id,
    })
  }

  const hasItems = saved.length > 0

  return (
    <div data-layout="page-template-v1" className="min-h-[100dvh] bg-soft-page pb-24">
      <div className="mx-auto max-w-[1040px] px-4 md:px-6 py-4">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/descobrir"
            className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-support-2 hover:bg-white/95 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
            aria-label="Voltar para Descobrir"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-1">Salvos</h1>
        </div>

        {!hasItems ? (
          <div className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-6">
            <p className="text-base text-support-2">
              Você ainda não salvou ideias. Explore o{' '}
              <Link href="/descobrir" className="font-semibold text-ink-1 underline hover:text-primary transition-colors">
                Descobrir
              </Link>{' '}
              e toque em &quot;Salvar para depois&quot;.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {saved.map((id) => (
              <li
                key={id}
                className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] transition-shadow p-4 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-1 text-sm">Ideia #{id}</div>
                  <div className="text-xs text-support-3 line-clamp-1">Salvo para depois</div>
                </div>
                <button
                  className="ml-3 inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-support-2 hover:bg-white/95 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
                  onClick={() => onRemove(id)}
                  aria-label={`Remover ideia ${id}`}
                >
                  <BookmarkMinus className="h-4 w-4" aria-hidden="true" />
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
