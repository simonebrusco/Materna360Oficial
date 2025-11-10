'use client'

import * as React from 'react'
import { Play, Pause, RotateCcw, Waves } from 'lucide-react'
import { gate } from '@/app/lib/gate'
import { readProgress, writeProgress, clearProgress } from '@/app/lib/audioProgress'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { track } from '@/app/lib/telemetry'

type AudioItem = { id: string; title: string; src: string; durationHint?: string }

const AUDIOS: AudioItem[] = [
  { id: 'respire-2min', title: 'Respire 2 minutos', durationHint: '2:00', src: '/audios/respire-2min.mp3' },
  { id: 'pausa-rapida', title: 'Pausa rápida de 3 min', durationHint: '3:00', src: '/audios/pausa-rapida-3min.mp3' },
  { id: 'acalmar-mente', title: 'Acalmar a mente (5 min)', durationHint: '5:00', src: '/audios/acalmar-5min.mp3' },
]

export function BreathAudios() {
  const allowProgress = gate('audio.progress' as any).enabled
  const [currentId, setCurrentId] = React.useState<string | null>(AUDIOS[0]?.id ?? null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  // Restore progress for selected id (if allowed)
  React.useEffect(() => {
    const a = audioRef.current
    if (!a || !currentId) return
    const at = allowProgress ? readProgress(currentId) : 0
    if (at > 0) a.currentTime = at
  }, [currentId, allowProgress])

  // Persist progress while playing (throttled by timeupdate events)
  const onTimeUpdate = () => {
    const a = audioRef.current
    if (!a || !currentId || !allowProgress) return
    writeProgress(currentId, a.currentTime)
  }

  const onEnded = () => {
    const a = audioRef.current
    if (!a || !currentId) return
    setIsPlaying(false)
    if (allowProgress) writeProgress(currentId, a.duration) // mark complete
    track('audio.end', { id: currentId })
  }

  const togglePlay = () => {
    const a = audioRef.current
    if (!a || !currentId) return
    if (a.paused) {
      a.play().catch(() => {})
      setIsPlaying(true)
      track('audio.play', { id: currentId })
    } else {
      a.pause()
      setIsPlaying(false)
      track('audio.pause', { id: currentId })
    }
  }

  const restart = () => {
    const a = audioRef.current
    if (!a || !currentId) return
    a.currentTime = 0
    if (allowProgress) clearProgress(currentId)
    if (!a.paused) a.play().catch(() => {})
    track('audio.restart', { id: currentId })
  }

  const onSelect = (id: string) => {
    setCurrentId(id)
    setIsPlaying(false)
    track('audio.select', { id })
  }

  const active = AUDIOS.find((x) => x.id === currentId) ?? AUDIOS[0]

  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Waves className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-ink-1">Áudios de respiro</h2>
      </div>

      {!allowProgress && (
        <div className="mb-4">
          <PaywallBanner message="Playback liberado. Para salvar seu progresso e retomar de onde parou, conheça os planos." />
        </div>
      )}

      <div className="grid gap-2 mb-4">
        {AUDIOS.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`inline-flex w-full items-start justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
              a.id === active.id
                ? 'border-primary/30 bg-primary/5'
                : 'border-white/60 bg-white/50 hover:bg-white/70'
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30`}
            aria-pressed={a.id === active.id}
          >
            <div>
              <div className="text-sm font-semibold text-ink-1">{a.title}</div>
              {a.durationHint && <div className="text-xs text-support-3">{a.durationHint}</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Audio controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={togglePlay}
          className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-xs font-medium text-support-2 hover:bg-white/95 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
        >
          {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {isPlaying ? 'Pausar' : 'Reproduzir'}
        </button>
        <button
          onClick={restart}
          className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-xs font-medium text-support-2 hover:bg-white/95 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Recomeçar
        </button>
        <div className="ml-auto text-xs text-support-3">{active?.durationHint ?? ''}</div>
      </div>

      {/* Single audio element (switches src per selection) */}
      <audio
        ref={audioRef}
        src={active?.src}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        preload="metadata"
        className="hidden"
      />
    </div>
  )
}
