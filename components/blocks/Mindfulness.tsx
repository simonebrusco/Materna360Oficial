'use client'

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

type MindfulnessTrack = {
  id: string
  title: string
  file?: string
}

type MindfulnessTheme = {
  id: string
  title: string
  tracks: MindfulnessTrack[]
}

type ManifestResponse = {
  themes?: MindfulnessTheme[]
}

type AvailabilityStatus = 'checking' | 'available' | 'missing'

type TrackProgress = {
  current: number
  duration: number
}

type ProgressMap = Record<string, TrackProgress>

type LastPlayback = {
  themeId: string
  trackId: string
}

const MANIFEST_URL = '/audio/mindfulness/manifest.json'
const STORAGE_PROGRESS_KEY = 'mindfulness_progress_v1'
const LAST_TRACK_STORAGE_KEY = 'm360:lastMindfulnessTrack'
const LEGACY_LAST_TRACK_KEY = 'mindfulness_last_v1'

export async function loadMindfulnessManifest(): Promise<ManifestResponse | null> {
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' })
    if (!response.ok) {
      return null
    }

    const text = await response.text()
    try {
      return JSON.parse(text) as ManifestResponse
    } catch {
      return null
    }
  } catch {
    return null
  }
}

const FALLBACK_THEMES: MindfulnessTheme[] = [
  {
    id: 'respiracao-pausa',
    title: 'Respiração & Pausa',
    tracks: [
      { id: 'acalme-sua-mente', title: 'Acalme sua mente', file: '/audio/mindfulness/acalme-sua-mente.mp3' },
      { id: 'respire-e-conecte-se', title: 'Respire e conecte-se', file: '/audio/mindfulness/respire-e-conecte-se.mp3' },
      {
        id: 'saindo-do-piloto-automatico',
        title: 'Saindo do piloto automático',
        file: '/audio/mindfulness/saindo-do-piloto-automatico.mp3',
      },
    ],
  },
  {
    id: 'autocompaixao-forca',
    title: 'Autocompaixão & Força',
    tracks: [
      {
        id: 'voce-esta-fazendo-o-melhor',
        title: 'Você está fazendo o melhor',
        file: '/audio/mindfulness/voce-esta-fazendo-o-melhor.mp3',
      },
      {
        id: 'voce-nao-precisa-dar-conta',
        title: 'Você não precisa dar conta',
        file: '/audio/mindfulness/voce-nao-precisa-dar-conta.mp3',
      },
      { id: 'confie-em-voce', title: 'Confie em você', file: '/audio/mindfulness/confie-em-voce.mp3' },
    ],
  },
  {
    id: 'sono-relaxamento',
    title: 'Sono & Relaxamento',
    tracks: [
      { id: 'antes-de-dormir', title: 'Antes de dormir', file: '/audio/mindfulness/antes-de-dormir.mp3' },
      { id: 'um-novo-comeco', title: 'Um novo começo', file: '/audio/mindfulness/um-novo-comeco.mp3' },
      { id: 'natureza-e-equilibrio', title: 'Natureza e equilíbrio', file: '/audio/mindfulness/natureza-e-equilibrio.mp3' },
    ],
  },
]

const appendCacheBuster = (source: string, version: string) => {
  if (!version) return source
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(source, base)
    url.searchParams.set('v', version)
    return url.toString()
  } catch (error) {
    const separator = source.includes('?') ? '&' : '?'
    return `${source}${separator}v=${version}`
  }
}

const isAudioAvailable = async (url: string, version: string): Promise<boolean> => {
  try {
    const target = appendCacheBuster(url, version)
    const headResponse = await fetch(target, { method: 'HEAD', cache: 'no-store' })
    if (headResponse.ok) {
      return true
    }

    if (headResponse.status === 405 || headResponse.status === 501) {
      const rangeResponse = await fetch(target, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        cache: 'no-store',
      })
      return rangeResponse.ok || rangeResponse.status === 206
    }

    return false
  } catch {
    return false
  }
}

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '00:00'
  }

  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function Mindfulness() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [themes, setThemes] = useState<MindfulnessTheme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [currentPlayback, setCurrentPlayback] = useState<{ theme: MindfulnessTheme; track: MindfulnessTrack } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastPlayback, setLastPlayback] = useState<LastPlayback | null>(null)
  const { toast } = useToast()
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({})
  const [missingFiles, setMissingFiles] = useState<string[]>([])
  const [hasManifestError, setHasManifestError] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedProgress = window.localStorage.getItem(STORAGE_PROGRESS_KEY)
      if (storedProgress) {
        const parsed: ProgressMap = JSON.parse(storedProgress)
        setProgressMap(parsed)
      }
    } catch (error) {
      console.error('Não foi possível carregar o progresso salvo.', error)
    }

    try {
      const storedLast =
        window.localStorage.getItem(LAST_TRACK_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_LAST_TRACK_KEY)
      if (storedLast) {
        const parsed: LastPlayback = JSON.parse(storedLast)
        setLastPlayback(parsed)
        if (!window.localStorage.getItem(LAST_TRACK_STORAGE_KEY)) {
          window.localStorage.setItem(LAST_TRACK_STORAGE_KEY, storedLast)
        }
      }
    } catch (error) {
      console.error('Não foi possível carregar o último áudio reproduzido.', error)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadManifest = async () => {
      const data = await loadMindfulnessManifest()
      if (!active) return

      const receivedThemes = Array.isArray(data?.themes) ? data.themes : []
      if (receivedThemes.length > 0) {
        setThemes(receivedThemes)
        setHasManifestError(false)
      } else {
        setThemes(FALLBACK_THEMES)
        setHasManifestError(true)
      }

      setIsLoading(false)
    }

    void loadManifest()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!themes.length) {
      setAvailability({})
      setMissingFiles([])
      return
    }

    const initialStatuses: Record<string, AvailabilityStatus> = {}
    const initialMissing: string[] = []

    themes.forEach((theme) => {
      theme.tracks.forEach((track) => {
        if (track.file) {
          initialStatuses[track.id] = 'checking'
        } else {
          initialStatuses[track.id] = 'missing'
        }
        if (!track.file) {
          initialMissing.push(track.id)
        }
      })
    })

    setAvailability(initialStatuses)
    setMissingFiles(initialMissing)

    let cancelled = false
    const availabilityVersion = Date.now().toString()
    const missingSet = new Set<string>(initialMissing)

    const updateMissingState = () => {
      setMissingFiles(Array.from(missingSet))
    }

    const evaluateTrack = async (track: MindfulnessTrack) => {
      if (!track.file) {
        return
      }

      const available = await isAudioAvailable(track.file, availabilityVersion)
      if (cancelled) return

      setAvailability((previous) => {
        const nextStatus: AvailabilityStatus = available ? 'available' : 'missing'
        if (previous[track.id] === nextStatus) {
          return previous
        }
        return {
          ...previous,
          [track.id]: nextStatus,
        }
      })

      if (available) {
        missingSet.delete(track.file)
      } else {
        const wasAlreadyMissing = missingSet.has(track.file)
        missingSet.add(track.file)
        if (!wasAlreadyMissing) {
          console.warn('[Mindfulness] Missing audio:', track.file)
        }
      }

      updateMissingState()
    }

    const tasks = themes.flatMap((theme) => theme.tracks.map((track) => evaluateTrack(track)))
    void Promise.allSettled(tasks)

    return () => {
      cancelled = true
    }
  }, [themes])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progressMap))
    } catch (error) {
      console.error('Não foi possível salvar o progresso do mindfulness.', error)
    }
  }, [progressMap])

  const persistLastPlayback = useCallback((value: LastPlayback | null) => {
    if (typeof window === 'undefined') return

    try {
      if (value) {
        window.localStorage.setItem(LAST_TRACK_STORAGE_KEY, JSON.stringify(value))
      } else {
        window.localStorage.removeItem(LAST_TRACK_STORAGE_KEY)
      }
      window.localStorage.removeItem(LEGACY_LAST_TRACK_KEY)
    } catch (error) {
      console.error('Não foi possível salvar o último áudio do mindfulness.', error)
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleTimeUpdate = () => {
      if (!currentPlayback) return
      setProgressMap((previous) => {
        const existing = previous[currentPlayback.track.id] ?? { current: 0, duration: audio.duration || 0 }
        const current = audio.currentTime
        const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : existing.duration

        if (Math.abs(existing.current - current) < 0.25 && existing.duration === duration) {
          return previous
        }

        return {
          ...previous,
          [currentPlayback.track.id]: {
            current,
            duration,
          },
        }
      })
    }

    const handleLoadedMetadata = () => {
      if (!currentPlayback) return
      const duration = audio.duration
      if (!Number.isFinite(duration) || duration <= 0) return
      setProgressMap((previous) => ({
        ...previous,
        [currentPlayback.track.id]: {
          current: previous[currentPlayback.track.id]?.current ?? 0,
          duration,
        },
      }))
    }

    const handleEnded = () => {
      if (!currentPlayback) return
      setIsPlaying(false)
      setProgressMap((previous) => ({
        ...previous,
        [currentPlayback.track.id]: {
          current: previous[currentPlayback.track.id]?.duration ?? audio.duration ?? 0,
          duration: previous[currentPlayback.track.id]?.duration ?? audio.duration ?? 0,
        },
      }))
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleError = () => {
      setToastMessage('Não foi possível tocar este áudio.')
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [currentPlayback])

  useEffect(() => {
    const audio = audioRef.current

    return () => {
      if (audio) {
        audio.pause()
      }
    }
  }, [])

  const resumeTarget = useMemo(() => {
    if (!lastPlayback) return null
    const theme = themes.find((item) => item.id === lastPlayback.themeId)
    const track = theme?.tracks.find((item) => item.id === lastPlayback.trackId)
    if (!theme || !track || !track.file) return null
    const status = availability[track.id] ?? (track.file ? 'checking' : 'missing')
    if (status !== 'available') return null
    return { theme, track }
  }, [availability, lastPlayback, themes])

  const handleToggleTrack = useCallback(
    async (theme: MindfulnessTheme, track: MindfulnessTrack) => {
      if (!track.file) return
      const status = availability[track.id] ?? 'checking'
      if (status !== 'available') return

      const audio = audioRef.current
      if (!audio) return

      const previousPlayback = currentPlayback
      const previousLastPlayback = lastPlayback

      const isSameTrack = currentPlayback?.track.id === track.id

      const playFromStart = progressMap[track.id]?.current ?? 0

      const ensurePlayback = async () => {
        const nextPlayback = { theme, track }
        const nextLast: LastPlayback = { themeId: theme.id, trackId: track.id }
        setCurrentPlayback(nextPlayback)
        setLastPlayback(nextLast)
        persistLastPlayback(nextLast)

        try {
          await audio.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Falha ao iniciar reprodução do Mindfulness', error)
          setToastMessage('Não foi possível tocar este áudio.')
          setCurrentPlayback(previousPlayback ?? null)
          setLastPlayback(previousLastPlayback ?? null)
          persistLastPlayback(previousLastPlayback ?? null)
          setIsPlaying(false)
        }
      }

      if (isSameTrack) {
        if (isPlaying) {
          audio.pause()
        } else {
          await ensurePlayback()
        }
        return
      }

      audio.pause()
      audio.src = track.file

      if (playFromStart > 0) {
        const seekToSavedPosition = () => {
          try {
            const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : playFromStart
            audio.currentTime = Math.min(playFromStart, duration)
          } catch (error) {
            console.error('Não foi possível retomar o ponto do áudio.', error)
          }
        }

        if (audio.readyState >= 1) {
          seekToSavedPosition()
        } else {
          audio.addEventListener('loadedmetadata', seekToSavedPosition, { once: true })
        }
      } else {
        try {
          audio.currentTime = 0
        } catch (error) {
          console.error('Não foi possível reposicionar o áudio.', error)
        }
      }

      await ensurePlayback()
    },
    [availability, currentPlayback, isPlaying, lastPlayback, persistLastPlayback, progressMap]
  )

  const handleSeek = useCallback((value: number) => {
    const audio = audioRef.current
    if (!audio || !currentPlayback) return
    audio.currentTime = value
    setProgressMap((previous) => ({
      ...previous,
      [currentPlayback.track.id]: {
        current: value,
        duration: previous[currentPlayback.track.id]?.duration ?? audio.duration ?? value,
      },
    }))
  }, [currentPlayback])

  const handleSkip = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio || !currentPlayback) return
      const nextTime = Math.max(0, Math.min((audio.duration || Infinity), audio.currentTime + delta))
      handleSeek(nextTime)
    },
    [currentPlayback, handleSeek]
  )

  const handleResume = useCallback(() => {
    if (!resumeTarget) return
    handleToggleTrack(resumeTarget.theme, resumeTarget.track)
  }, [handleToggleTrack, resumeTarget])

  const nowPlayingProgress = currentPlayback ? progressMap[currentPlayback.track.id] : undefined
  const currentDuration = nowPlayingProgress?.duration ?? audioRef.current?.duration ?? 0
  const currentPosition = nowPlayingProgress?.current ?? audioRef.current?.currentTime ?? 0

  const renderEmptyState = !isLoading && themes.length === 0

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-white to-white p-7 shadow-soft" aria-label="Mindfulness">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Autocuidado guiado</span>
        </div>
        {resumeTarget && (
          <Button variant="outline" size="sm" onClick={handleResume}>
            Continuar de onde parei
          </Button>
        )}
      </div>

      {renderEmptyState ? (
        <p className="mt-6 text-sm text-support-2">
          {hasManifestError ? 'Não foi possível carregar os áudios agora. Tente novamente mais tarde.' : 'Em breve, novos áudios de mindfulness por aqui.'}
        </p>
      ) : (
        <>
          {hasManifestError && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
              Não encontramos os áudios originais no momento. Os itens abaixo aparecerão como &quot;Upload pendente&quot; até que os arquivos sejam disponibilizados.
            </div>
          )}
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {themes.map((theme) => (
              <div key={theme.id} className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">{theme.title}</p>
                </div>
                <ul className="space-y-2">
                  {theme.tracks.map((track) => {
                    const progress = progressMap[track.id]
                    const isCurrent = currentPlayback?.track.id === track.id
                    const isTrackPlaying = isCurrent && isPlaying
                    const status = availability[track.id] ?? (track.file ? 'checking' : 'missing')
                    const isChecking = status === 'checking'
                    const isMissing = status === 'missing'
                    const isPlayable = Boolean(track.file) && status === 'available'
                    const isLastPlayed = lastPlayback?.trackId === track.id
                    const ariaLabel = isTrackPlaying ? 'Pausar' : 'Tocar'
                    const currentProgress = progress ?? { current: 0, duration: 0 }

                    return (
                      <li
                        key={track.id}
                        className={`flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-3 py-2 shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition ${
                          isLastPlayed ? 'border-primary/50 shadow-[0_4px_24px_rgba(47,58,86,0.08)]' : ''
                        }`}
                      >
                        {isPlayable ? (
                          <button
                            type="button"
                            onClick={() => handleToggleTrack(theme, track)}
                            aria-label={ariaLabel}
                            className="shrink-0 rounded-full border border-primary/30 bg-white p-2 text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                          >
                            {isTrackPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                        ) : (
                          <div
                            className="shrink-0 rounded-full border border-dashed border-primary/20 bg-white p-2 text-support-2/70"
                            aria-hidden
                          >
                            <Play className="h-4 w-4 opacity-30" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-support-1">{track.title}</span>
                          {isChecking && <span className="text-xs text-support-2">Verificando…</span>}
                          {isPlayable && <span className="text-xs text-emerald-600">Pronto para ouvir</span>}
                          {isMissing && <span className="text-xs text-support-2">Upload pendente</span>}
                        </div>
                        {isPlayable && (
                          <span className="text-xs font-medium text-support-2" aria-live="polite">
                            {formatTime(currentProgress.current)} / {formatTime(currentProgress.duration)}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {process.env.NODE_ENV !== 'production' && missingFiles.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
          <p className="font-semibold">Áudios ausentes:</p>
          <ul className="mt-1 space-y-1">
            {missingFiles.map((path) => (
              <li key={path} className="font-mono">{path}</li>
            ))}
          </ul>
        </div>
      )}

      {currentPlayback && currentPlayback.track.file && (
        <div
          className="mt-6 rounded-3xl border border-primary/20 bg-white/95 p-5 shadow-elevated"
          role="region"
          aria-label="Reprodução de áudio Mindfulness"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleSkip(-15)}
                className="rounded-full border border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
              >
                Voltar 15s
              </button>
              <button
                type="button"
                onClick={() => handleToggleTrack(currentPlayback.theme, currentPlayback.track)}
                className="rounded-full border border-primary/30 bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                aria-label={isPlaying ? 'Pausar' : 'Tocar'}
              >
                <span className="flex items-center gap-2">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pausar' : 'Tocar'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSkip(15)}
                className="rounded-full border border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
              >
                Avançar 15s
              </button>
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-support-2">{formatTime(currentPosition)}</span>
                  <input
                    type="range"
                    min={0}
                    max={Number.isFinite(currentDuration) && currentDuration > 0 ? currentDuration : 0}
                    step={0.1}
                    value={Number.isFinite(currentPosition) ? currentPosition : 0}
                    onChange={(event) => handleSeek(Number(event.target.value))}
                    className="h-1 flex-1 appearance-none rounded-full bg-primary/20 accent-primary"
                    aria-label="Linha do tempo do áudio"
                  />
                  <span className="text-xs font-medium text-support-2">{formatTime(currentDuration)}</span>
                </div>
              </div>
            </div>
            <div className="text-sm font-medium text-support-1">
              Reproduzindo: {currentPlayback.track.title}
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} preload="none" hidden />

    </Card>
  )
}
