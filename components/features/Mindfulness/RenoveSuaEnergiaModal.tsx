'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

// Títulos apenas, sem áudio ainda
const TRACK_TITLES = [
  'Acalme sua mente',
  'Respire e conecte-se',
  'Você não está sozinha',
  'Você não precisa ser perfeita',
  'Desconecte-se para o essencial',
  'Confie em você',
]

export default function RenoveSuaEnergiaModal({ open, onClose }: Props) {
  // Focus trap simples quando abrir
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const first = document.getElementById('renove-modal-title')
    first?.focus()
    return () => prev?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="renove-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      data-testid="renove-modal"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-white/90 p-6 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="renove-modal-title"
              tabIndex={-1}
              className="text-2xl font-semibold text-support-1 outline-none"
            >
              <span className="mr-2">🌞</span>Renove sua Energia
            </h2>
            <p className="mt-2 text-support-2">
              Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full bg-white/80 p-2 text-support-1 shadow-soft transition hover:bg-white"
          >
            ✕
          </button>
        </div>

        {/* Lista de faixas (somente títulos, sem áudio) */}
        <div className="space-y-3">
          {TRACK_TITLES.map((title) => (
            <div
              key={title}
              className="flex items-center justify-between rounded-2xl bg-white/80 p-4 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-support-3 text-primary focus:ring-primary/40"
                  aria-label={`Marcar como ouvido: ${title}`}
                  // sem persistência por enquanto
                  onChange={() => {}}
                />
                <span className="text-base font-semibold text-support-1">{title}</span>
              </div>

              {/* Placeholder do player – ainda não conectado */}
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-support-4/40 px-4 py-2 text-sm font-semibold text-support-2"
                title="Áudio será conectado depois"
              >
                Ouvir
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-primary px-5 py-2 font-semibold text-white shadow-soft transition hover:brightness-110"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
