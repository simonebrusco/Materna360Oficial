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

export default function MindfulnessQuickModal({ open, onClose, collectionTitle, tracks }: Props) {
  const [durations, setDurations] = React.useState<Record<string, string>>({})
  const [errors, setErrors] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (!open) {
      setDurations({})
      setErrors({})
      return
    }

    setDurations({})
    setErrors({})
  }, [open, tracks])

  const handleLoaded = React.useCallback((id: string, element: HTMLAudioElement | null) => {
    if (!element) return

    const totalSeconds = Number.isFinite(element.duration) ? Math.max(0, Math.round(element.duration)) : 0
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')

    setDurations((previous) => ({
      ...previous,
      [id]: `${minutes}:${seconds}`,
    }))

    setErrors((previous) => {
      if (!previous[id]) {
        return previous
      }
      const next = { ...previous }
      delete next[id]
      return next
    })
  }, [])

  const handleError = React.useCallback((id: string) => {
    setErrors((previous) => ({
      ...previous,
      [id]: true,
    }))

    setDurations((previous) => {
      if (!previous[id]) {
        return previous
      }
      const next = { ...previous }
      delete next[id]
      return next
    })
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
            const src = getMindfulnessUrl(track.filename)
            const isConfigured = Boolean(src)
            const hasError = Boolean(errors[track.id])
            const duration = durations[track.id]

            return (
              <div key={track.id} className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
                <div className="mb-1 text-sm font-medium text-support-1">{track.title}</div>
                <div className="mb-2 text-xs text-support-3">{track.filename}</div>
                <audio
                  controls
                  preload="metadata"
                  src={isConfigured ? src : undefined}
                  style={{ width: '100%' }}
                  onLoadedMetadata={(event) => handleLoaded(track.id, event.currentTarget)}
                  onError={() => handleError(track.id)}
                />
                <div className="mt-1 text-xs">
                  {!isConfigured ? (
                    <span className="text-support-3/70">Fonte não configurada</span>
                  ) : hasError ? (
                    <span className="text-[#e5484d]">Arquivo não encontrado</span>
                  ) : duration ? (
                    <span className="text-support-3">Duração {duration}</span>
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
