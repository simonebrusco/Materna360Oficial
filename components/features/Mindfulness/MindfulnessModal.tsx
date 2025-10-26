'use client'

import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/Button'

type Track = { id: string; title: string }

type MindfulnessModalProps = {
  open: boolean
  onClose: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  tracks: Track[]
  testId?: string
}

export default function MindfulnessModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  tracks,
  testId,
}: MindfulnessModalProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const prevOverflow = useRef<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', onKey)
    }

    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      titleRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    prevOverflow.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow.current || ''
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 md:p-8">
        <div
          data-testid={testId}
          className="relative mt-8 w-full max-w-[760px] rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur md:p-8"
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-support-1 shadow transition hover:bg-white"
          >
            ✕
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="text-lg md:text-[22px] font-extrabold leading-tight text-support-1 outline-none"
            >
              {title}
            </h2>
          </div>

          <p className="mt-3 text-[13.5px] md:text-[15px] leading-relaxed text-support-2">{subtitle}</p>

          <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/95 p-4 shadow md:p-5"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-md border-primary/30 text-primary focus:ring-primary/40"
                    aria-label={`Heard ${track.title}`}
                  />
                  <span className="font-semibold text-support-1">{track.title}</span>
                </label>

                <Button variant="primary" size="sm" className="rounded-2xl px-5">
                  Ouvir
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
