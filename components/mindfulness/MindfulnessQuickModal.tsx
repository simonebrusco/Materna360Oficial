'use client'

import React from 'react'

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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
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
            const base = (process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE ?? '').replace(/\/$/, '')
            const src = base ? `${base}/mindfulness/${track.filename}` : ''

            return (
              <div key={track.id} className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
                <div className="mb-1 text-sm font-medium text-support-1">{track.title}</div>
                <div className="mb-2 text-xs text-support-3">{track.filename}</div>
                <audio controls preload="none" src={src} style={{ width: '100%' }} />
              </div>
            )
          })}

          {tracks.length === 0 ? <div className="text-sm text-support-3">Sem faixas disponíveis.</div> : null}
        </div>
      </div>
    </div>
  )
}
