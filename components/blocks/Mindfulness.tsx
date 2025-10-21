'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

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

const appendCacheBuster = (source: string, version: string) => {
  if (!version) return source
  try {
    const url = new URL(source, window.location.origin)
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
  const [toastMessage, setToastMessage] = useState<string | null>(null)
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
      const storedLast = window.localStorage.getItem(LAST_TRACK_STORAGE_KEY)
      if (storedLast) {
        const parsed: LastPlayback = JSON.parse(storedLast)
        setLastPlayback(parsed)
      }
    } catch (error) {
      console.error('Não foi possível carregar o último áudio reproduzido.', error)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadManifest = async () => {
      try {
        const response = await fetch(MANIFEST_URL, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Manifesto indisponível')
        }
        const data: ManifestResponse = await response.json()
        if (!active) return
        setThemes(data.themes ?? [])
        setHasManifestError(false)
      } catch (error) {
        console.error('Não foi possível carregar a lista de mindfulness.', error)
        if (active) {
          setThemes([])
          setHasManifestError(true)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadManifest()

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
    themes.forEach((theme) => {
      theme.tracks.forEach((track) => {
        initialStatuses[track.id] = track.file ? 'checking' : 'missing'
      })
    })
    setAvailability(initialStatuses)
    setMissingFiles([])

    let cancelled = false

    const evaluateAvailability = async () => {
      const availabilityResults: Record<string, AvailabilityStatus> = {}
      const missingSet = new Set<string>()

      await Promise.allSettled(
        themes.map((theme) =>
          Promise.allSettled(
            theme.tracks.map(async (track) => {
              if (!track.file) {
                return
              }

              const available = await isAudioAvailable(track.file)
              availabilityResults[track.id] = available ? 'available' : 'missing'
              if (!available) {
                missingSet.add(track.file)
              }
            })
          )
        )
      )

      const finalStatuses: Record<string, AvailabilityStatus> = {}
      themes.forEach((theme) => {
        theme.tracks.forEach((track) => {
          if (!track.file) {
            finalStatuses[track.id] = 'missing'
          } else {
            const status = availabilityResults[track.id] ?? 'missing'
            finalStatuses[track.id] = status
            if (status === 'missing') {
              missingSet.add(track.file)
            }
          }
        })
      })

      if (cancelled) {
        return
      }

      setAvailability(finalStatuses)
      const missingArray = Array.from(missingSet)
      if (missingArray.length > 0) {
        missingArray.forEach((path) => console.warn('[Mindfulness] Missing audio:', path))
      }
      setMissingFiles(missingArray)
    }

    void evaluateAvailability()

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
      setToastMessage('Não foi possível carregar este áudio.')
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
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
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

      const isSameTrack = currentPlayback?.track.id === track.id

      const playFromStart = progressMap[track.id]?.current ?? 0

      const ensurePlayback = async () => {
        try {
          setCurrentPlayback({ theme, track })
          setLastPlayback({ themeId: theme.id, trackId: track.id })
          persistLastPlayback({ themeId: theme.id, trackId: track.id })
          await audio.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Falha ao iniciar reprodução do Mindfulness', error)
          setToastMessage('Não foi possível carregar este áudio.')
          setCurrentPlayback((previous) => (previous?.track.id === track.id ? null : previous))
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
    [availability, currentPlayback, isPlaying, persistLastPlayback, progressMap]
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
    <Card className="bg-gradient-to-br from-primary/10 via-white to-white p-7 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Autocuidado guiado</span>
          <h2 className="mt-2 text-xl font-semibold text-support-1 md:text-2xl">Mindfulness</h2>
        </div>
        {resumeTarget && (
          <Button variant="outline" size="sm" onClick={handleResume}>
            Continuar de onde parei
          </Button>
        )}
      </div>

      {renderEmptyState ? (
        <p className="mt-6 text-sm text-support-2">Em breve, novos áudios de mindfulness por aqui.</p>
      ) : (
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
                  const ariaLabel = isTrackPlaying ? 'Pausar' : isChecking ? 'Verificando disponibilidade' : 'Tocar'

                  return (
                    <li
                      key={track.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-3 py-2 shadow-soft transition"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTrack(theme, track)}
                        disabled={!isPlayable}
                        aria-disabled={!isPlayable}
                        aria-label={ariaLabel}
                        className="shrink-0 rounded-full border border-primary/30 bg-white p-2 text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 disabled:cursor-not-allowed disabled:border-dashed disabled:text-support-2"
                      >
                        {isTrackPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-support-1">{track.title}</span>
                        {isChecking && <span className="text-xs text-support-2">Verificando…</span>}
                        {isMissing && <span className="text-xs text-support-2">Upload pendente</span>}
                      </div>
                      {isPlayable && progress && (
                        <span className="text-xs font-medium text-support-2" aria-live="polite">
                          {formatTime(progress.current)} / {formatTime(progress.duration)}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
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

      {toastMessage && <Toast message={toastMessage} type="error" onClose={() => setToastMessage(null)} />}
    </Card>
  )
}
