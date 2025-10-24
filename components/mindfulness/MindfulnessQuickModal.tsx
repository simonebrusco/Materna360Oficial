'use client'

'use client'

import React from 'react'

import { getMindfulnessUrl } from '@/lib/audio'

type Track = {
  id: string
  title: string
  filename: string
}

type Props = {
  open: boolean
  onClose: () => void
  collectionTitle?: string
  tracks: Track[]
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return undefined
  }

  const totalSeconds = Math.round(seconds)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

export default function MindfulnessQuickModal({ open, onClose, collectionTitle, tracks }: Props) {
  const [durations, setDurations] = React.useState<Record<string, string>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (!open) {
      setDurations({})
      setErrors({})
      return
    }

    setDurations({})
    setErrors({})
  }, [open, tracks])

  const handleLoaded = React.useCallback((trackId: string, element: HTMLAudioElement | null) => {
    if (!element) return

    const formatted = formatDuration(element.duration)
    if (!formatted) return

    setDurations((previous) => ({
      ...previous,
      [trackId]: formatted,
    }))

    setErrors((previous) => {
      if (!previous[trackId]) {
        return previous
      }
      const { [trackId]: _, ...rest } = previous
      return rest
    })
  }, [])

  const handleError = React.useCallback((trackId: string, url: string) => {
    setErrors((previous) => ({
      ...previous,
      [trackId]: `Arquivo não encontrado ou bloqueado: ${url}`,
    }))

    setDurations((previous) => {
      if (!previous[trackId]) {
        return previous
      }
      const { [trackId]: _, ...rest } = previous
      return rest
    })

    if (typeof window !== 'undefined') {
      fetch(url, { method: 'HEAD' })
        .then((response) => {
          console.warn('[mindfulness] HEAD diagnóstico', trackId, url, response.status, response.headers.get('content-type'))
        })
        .catch((error) => {
          console.warn('[mindfulness] HEAD diagnóstico falhou', trackId, url, error)
        })
    }
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-support-1">{collectionTitle ?? 'Mindfulness'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-support-3 transition-colors hover:bg-black/5"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 sm:pr-3">
          {tracks.map((track) => {
            const url = getMindfulnessUrl(track.filename)
            const errorMessage = errors[track.id]
            const durationLabel = durations[track.id]
            const isConfigured = Boolean(url)

            return (
              <div key={track.id} className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
                <div className="mb-1 text-sm font-medium text-support-1">{track.title}</div>
                <div className="mb-2 text-xs text-support-3">{track.filename}</div>
                <audio
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  style={{ width: '100%' }}
                  src={isConfigured ? url : undefined}
                  onLoadedMetadata={(event) => handleLoaded(track.id, event.currentTarget)}
                  onError={() => {
                    if (!isConfigured) return
                    handleError(track.id, url)
                  }}
                >
                  {isConfigured ? <source src={url} type="audio/mpeg" /> : null}
                  Seu navegador não suporta a reprodução de áudio embutido.
                </audio>
                <div className="mt-1 text-xs">
                  {!isConfigured ? (
                    <span className="text-support-3/70">Fonte não configurada</span>
                  ) : errorMessage ? (
                    <span className="text-[#e5484d]">{errorMessage}</span>
                  ) : durationLabel ? (
                    <span className="text-support-3">Duração {durationLabel}</span>
                  ) : (
                    <span className="text-support-3/70">Carregando…</span>
                  )}
                </div>
              </div>
            )
          })}

          {tracks.length === 0 ? <div className="text-sm text-support-3">Sem faixas disponíveis.</div> : null}
        </div>
      </div>
    </div>
  )
}
