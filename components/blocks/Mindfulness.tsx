'use client'

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MINDFULNESS_COLLECTION_ORDER,
  MindfulnessCollectionKey,
  tracksFor,
} from '@/data/mindfulnessCollections'
import { MindfulnessCollectionTrack } from '@/data/mindfulnessManifest'
import { getMindfulnessAudioUrl, headOk } from '@/lib/audio'

type MindfulnessTheme = {
  id: MindfulnessCollectionKey
  title: string
  tracks: MindfulnessCollectionTrack[]
}

type TrackProgress = {
  current: number
  duration: number
}

type ProgressMap = Record<string, TrackProgress>

type LastPlayback = {
  themeId: MindfulnessCollectionKey
  trackId: string
}

type TrackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

type AvailabilityStatus = 'checking' | 'available' | 'missing'

const STORAGE_PROGRESS_KEY = 'mindfulness_progress_v1'
const LAST_TRACK_STORAGE_KEY = 'm360:lastMindfulnessTrack'
const LEGACY_LAST_TRACK_KEY = 'mindfulness_last_v1'

const THEME_TITLES: Record<MindfulnessCollectionKey, string> = {
  'reconecte-se': 'Reconecte-se',
  'renove-sua-energia': 'Renove sua Energia',
  'encontre-calma': 'Encontre Calma',
}

const THEMES: MindfulnessTheme[] = MINDFULNESS_COLLECTION_ORDER.map((key) => ({
  id: key,
  title: THEME_TITLES[key],
  tracks: tracksFor(key),
}))

const THEME_BY_ID = THEMES.reduce<Record<MindfulnessCollectionKey, MindfulnessTheme>>((accumulator, theme) => {
  accumulator[theme.id] = theme
  return accumulator
}, {} as Record<MindfulnessCollectionKey, MindfulnessTheme>)

const INITIAL_AVAILABILITY: Record<string, AvailabilityStatus> = THEMES.reduce(
  (accumulator, theme) => {
    theme.tracks.forEach((track) => {
      accumulator[track.id] = track.enabled === false ? 'missing' : 'checking'
    })
    return accumulator
  },
  {} as Record<string, AvailabilityStatus>
)

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
  const currentSourceRef = useRef<string | null>(null)
  const loggedFailuresRef = useRef<Set<string>>(new Set())
  const currentPlaybackRef = useRef<{ theme: MindfulnessTheme; track: MindfulnessCollectionTrack } | null>(null)

  const audioUrls = useMemo(() => {
    const map: Record<string, string> = {}
    THEMES.forEach((theme) => {
      theme.tracks.forEach((track) => {
        map[track.id] = getMindfulnessAudioUrl(track.filename)
      })
    })
    return map
  }, [])

  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [currentPlayback, setCurrentPlayback] = useState<{
    theme: MindfulnessTheme
    track: MindfulnessCollectionTrack
  } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastPlayback, setLastPlayback] = useState<LastPlayback | null>(null)
  const [trackStatus, setTrackStatus] = useState<Record<string, TrackStatus>>({})
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({
    ...INITIAL_AVAILABILITY,
  })

  useEffect(() => {
    currentPlaybackRef.current = currentPlayback
  }, [currentPlayback])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedProgress = window.localStorage.getItem(STORAGE_PROGRESS_KEY)
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress) as ProgressMap
        setProgressMap(parsed)
      }
    } catch (error) {
      console.error('Não foi possível carregar o progresso salvo.', error)
    }

    try {
      const storedLast =
        window.localStorage.getItem(LAST_TRACK_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_LAST_TRACK_KEY)

      if (storedLast) {
        const parsed = JSON.parse(storedLast) as { themeId?: string; trackId?: string }
        if (parsed?.themeId && parsed?.trackId) {
          const themeId = parsed.themeId as MindfulnessCollectionKey
          if (THEME_BY_ID[themeId]) {
            const last: LastPlayback = { themeId, trackId: parsed.trackId }
            setLastPlayback(last)
            if (!window.localStorage.getItem(LAST_TRACK_STORAGE_KEY)) {
              window.localStorage.setItem(LAST_TRACK_STORAGE_KEY, JSON.stringify(last))
            }
          }
        }
      }
    } catch (error) {
      console.error('Não foi possível carregar o último áudio reproduzido.', error)
    }
  }, [])

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

  const setStatus = useCallback(
    (trackId: string, nextStatus: TrackStatus | ((previous?: TrackStatus) => TrackStatus)) => {
      setTrackStatus((previous) => {
        const previousStatus = previous[trackId]
        const computedStatus =
          typeof nextStatus === 'function' ? nextStatus(previousStatus) : nextStatus

        if (previousStatus === computedStatus) {
          return previous
        }

        return {
          ...previous,
          [trackId]: computedStatus,
        }
      })
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    const evaluateTrack = async (track: MindfulnessCollectionTrack) => {
      const url = audioUrls[track.id]
      const ok = await headOk(url)
      if (cancelled) return

      setAvailability((previous) => {
        const nextStatus: AvailabilityStatus = ok ? 'available' : 'missing'
        if (previous[track.id] === nextStatus) {
          return previous
        }
        return {
          ...previous,
          [track.id]: nextStatus,
        }
      })

      if (!ok) {
        setStatus(track.id, 'error')
        const active = currentPlaybackRef.current
        if (active?.track.id === track.id && audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      }
    }

    THEMES.forEach((theme) => {
      theme.tracks.forEach((track) => {
        void evaluateTrack(track)
      })
    })

    return () => {
      cancelled = true
    }
  }, [audioUrls, setStatus])

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
      if (!Number.isFinite(duration) || duration <= 0) {
        return
      }

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
      setStatus(currentPlayback.track.id, 'paused')
      setProgressMap((previous) => ({
        ...previous,
        [currentPlayback.track.id]: {
          current: previous[currentPlayback.track.id]?.duration ?? audio.duration ?? 0,
          duration: previous[currentPlayback.track.id]?.duration ?? audio.duration ?? 0,
        },
      }))
    }

    const handlePlay = () => {
      if (!currentPlayback) return
      setIsPlaying(true)
      setStatus(currentPlayback.track.id, 'playing')
    }

    const handlePause = () => {
      if (!currentPlayback) return
      setIsPlaying(false)
      setStatus(currentPlayback.track.id, (previousStatus) => {
        if (previousStatus === 'error') {
          return 'error'
        }
        return 'paused'
      })
    }

    const handleError = () => {
      if (!currentPlayback) return

      const trackId = currentPlayback.track.id
      const attemptedUrl = currentSourceRef.current ?? audioUrls[trackId]

      if (!loggedFailuresRef.current.has(trackId)) {
        loggedFailuresRef.current.add(trackId)
        console.warn('[mindfulness] Falha ao carregar áudio:', {
          id: trackId,
          url: attemptedUrl,
        })
      }

      setAvailability((previous) => {
        if (previous[trackId] === 'missing') {
          return previous
        }
        return {
          ...previous,
          [trackId]: 'missing',
        }
      })

      setIsPlaying(false)
      setStatus(trackId, 'error')
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
  }, [audioUrls, currentPlayback, setStatus])

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

    const theme = THEME_BY_ID[lastPlayback.themeId]
    const track = theme?.tracks.find((item) => item.id === lastPlayback.trackId)
    const status = track ? availability[track.id] ?? 'checking' : 'missing'

    if (!theme || !track || status !== 'available') {
      return null
    }

    return { theme, track }
  }, [availability, lastPlayback])

  const handleToggleTrack = useCallback(
    async (theme: MindfulnessTheme, track: MindfulnessCollectionTrack) => {
      const availabilityStatus = availability[track.id] ?? 'checking'
      if (availabilityStatus === 'missing') {
        setStatus(track.id, 'error')
        return
      }

      const audio = audioRef.current
      if (!audio) return

      const src = audioUrls[track.id]
      currentSourceRef.current = src

      const previousPlayback = currentPlayback
      const previousLastPlayback = lastPlayback
      const isSameTrack = currentPlayback?.track.id === track.id
      const playFromStart = progressMap[track.id]?.current ?? 0

      if (isSameTrack && isPlaying) {
        audio.pause()
        return
      }

      setTrackStatus((previous) => {
        const next = { ...previous }
        if (previousPlayback && previousPlayback.track.id !== track.id) {
          next[previousPlayback.track.id] = next[previousPlayback.track.id] === 'error' ? 'error' : 'paused'
        }
        next[track.id] = 'loading'
        return next
      })

      const nextPlayback = { theme, track }
      const nextLast: LastPlayback = { themeId: theme.id, trackId: track.id }

      setCurrentPlayback(nextPlayback)
      setLastPlayback(nextLast)
      persistLastPlayback(nextLast)

      try {
        audio.pause()
        audio.src = src
        audio.load()

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

        await audio.play()
        setIsPlaying(true)
        setStatus(track.id, 'playing')
      } catch (error) {
        if (!loggedFailuresRef.current.has(track.id)) {
          loggedFailuresRef.current.add(track.id)
          console.warn('[mindfulness] Falha ao iniciar áudio:', {
            id: track.id,
            url: src,
          })
        }

        setAvailability((previous) => ({
          ...previous,
          [track.id]: 'missing',
        }))
        setStatus(track.id, 'error')
        setCurrentPlayback(previousPlayback ?? null)
        setLastPlayback(previousLastPlayback ?? null)
        persistLastPlayback(previousLastPlayback ?? null)
        setIsPlaying(false)
      }
    },
    [availability, audioUrls, currentPlayback, isPlaying, lastPlayback, persistLastPlayback, progressMap, setStatus]
  )

  const handleSeek = useCallback(
    (value: number) => {
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
    },
    [currentPlayback]
  )

  const handleSkip = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio || !currentPlayback) return

      const nextTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + delta))
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

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {THEMES.map((theme) => (
          <div key={theme.id} className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">{theme.title}</p>
            <ul className="space-y-2">
              {theme.tracks.map((track) => {
                const progress = progressMap[track.id]
                const isCurrent = currentPlayback?.track.id === track.id
                const status = trackStatus[track.id] ?? 'idle'
                const availabilityStatus = availability[track.id] ?? 'checking'
                const isTrackPlaying = status === 'playing'
                const isLastPlayed = lastPlayback?.trackId === track.id
                const currentProgress = progress ?? { current: 0, duration: 0 }
                const hasDuration = Number.isFinite(currentProgress.duration) && currentProgress.duration > 0
                const showSkeleton = isCurrent && status === 'loading'
                const isMissing = availabilityStatus === 'missing'
                const isChecking = availabilityStatus === 'checking'
                const isPlayable = availabilityStatus === 'available'

                return (
                  <li
                    key={track.id}
                    className={`flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-3 py-2 shadow-soft transition ${
                      isLastPlayed ? 'border-primary/50 shadow-elevated' : ''
                    } ${isTrackPlaying ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTrack(theme, track)}
                      aria-label={isTrackPlaying ? 'Pausar' : 'Tocar'}
                      disabled={!isPlayable && !isTrackPlaying}
                      className="shrink-0 rounded-full border border-primary/30 bg-white p-2 text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {isTrackPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-support-1">{track.title}</span>
                      {isMissing && (
                        <span className="text-xs text-support-2/90">Arquivo não encontrado</span>
                      )}
                      {isChecking && !isMissing && (
                        <span className="text-xs text-support-2">Verificando…</span>
                      )}
                      {status === 'error' && !isMissing && (
                        <span className="text-xs text-support-2/90">Não foi possível carregar o áudio. Tente novamente em instantes.</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      {showSkeleton || (isCurrent && status === 'loading') ? (
                        <span className="h-3 w-12 animate-pulse rounded-full bg-primary/15" aria-hidden />
                      ) : hasDuration ? (
                        <span className="text-xs font-medium text-support-2" aria-live={isCurrent ? 'polite' : 'off'}>
                          {formatTime(currentProgress.current)} / {formatTime(currentProgress.duration)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-support-2">--:--</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {currentPlayback && (
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
              <div className="min-w-[160px] flex-1">
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

      <audio ref={audioRef} preload="none" hidden crossOrigin="anonymous" />
    </Card>
  )
}
