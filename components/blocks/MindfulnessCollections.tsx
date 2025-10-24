import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import {
  MINDFULNESS_COLLECTIONS,
  MINDFULNESS_TRACKS,
  MindfulnessCollection,
  MindfulnessTrack,
  getCollectionById,
} from '@/data/mindfulnessManifest'

const AUDIO_BASE = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE?.replace(/\/$/, '') ?? ''
const STORAGE_KEY = 'materna360-mindfulness-heard'

const FILE_ALIASES: Record<string, string> = {
  'você-não-está-sozinha.mp3': 'voce-nao-esta-sozinha.mp3',
  'transforme-o-caos-em-equilíbrio.mp3': 'transforme-o-caos-em-equilibrio.mp3',
  'o-poder-do-toque.mp3': 'o-poder-do-toque-e-do-afeto.mp3',
  'encontre-a-paz-dentro-de-você.mp3': 'encontre-a-paz-dentro-de-voce.mp3',
  'saindo-do-piloto-automático.mp3': 'saindo-do-piloto-automatico.mp3',
  '/audio/mindfulness/o-poder-do-toque.mp3': 'o-poder-do-toque-e-do-afeto.mp3',
  '/audio/mindfulness/você-não-está-sozinha.mp3': 'voce-nao-esta-sozinha.mp3',
  '/audio/mindfulness/transforme-o-caos-em-equilíbrio.mp3': 'transforme-o-caos-em-equilibrio.mp3',
  '/audio/mindfulness/encontre-a-paz-dentro-de-você.mp3': 'encontre-a-paz-dentro-de-voce.mp3',
  '/audio/mindfulness/saindo-do-piloto-automático.mp3': 'saindo-do-piloto-automatico.mp3',
}

const TRACK_IDS = new Set(MINDFULNESS_TRACKS.map((track) => track.id))

const FILE_TO_TRACK_ID: Record<string, string> = MINDFULNESS_TRACKS.reduce<Record<string, string>>(
  (accumulator, track) => {
    accumulator[track.filename] = track.id
    accumulator[`mindfulness/${track.filename}`] = track.id
    accumulator[`/audio/mindfulness/${track.filename}`] = track.id
    return accumulator
  },
  {}
)

Object.entries(FILE_ALIASES).forEach(([legacy, canonical]) => {
  const normalizedCanonical = canonical.replace(/^\/audio\/mindfulness\//, '').replace(/^mindfulness\//, '')
  const trackId = FILE_TO_TRACK_ID[normalizedCanonical] ?? FILE_TO_TRACK_ID[canonical]

  if (trackId) {
    FILE_TO_TRACK_ID[legacy] = trackId
    FILE_TO_TRACK_ID[`mindfulness/${legacy}`] = trackId
    FILE_TO_TRACK_ID[`/audio/mindfulness/${legacy}`] = trackId
    FILE_TO_TRACK_ID[canonical] = trackId
    FILE_TO_TRACK_ID[`mindfulness/${canonical}`] = trackId
    FILE_TO_TRACK_ID[`/audio/mindfulness/${canonical}`] = trackId
  }
})

type MindfulnessCollectionId = MindfulnessCollection['id']

const COLLECTION_DETAILS: Record<MindfulnessCollectionId, { icon: string; description: string }> = {
  'reconecte-se': {
    icon: '🪷',
    description:
      'Um convite para pausar, respirar e se reconectar com você mesma. Essas práticas ajudam a acalmar a mente e acolher o que você sente, com leveza e presença.',
  },
  'renove-sua-energia': {
    icon: '☀️',
    description:
      'Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma.',
  },
  'encontre-calma': {
    icon: '🌙',
    description:
      'Momentos para relaxar, descansar e liberar o cansaço emocional. Ideal para encerrar o dia com serenidade e presença.',
  },
}

const COLLECTION_CARDS = MINDFULNESS_COLLECTIONS.map((collection) => {
  const detail = COLLECTION_DETAILS[collection.id]
  return {
    id: collection.id,
    title: collection.title,
    icon: detail.icon,
    description: detail.description,
  }
})

function normalizeStorageKey(key: string): string | null {
  if (!key) return null

  if (TRACK_IDS.has(key)) {
    return key
  }

  const sanitized = key
    .replace(/^https?:\/\/[^/]+\//, '/')
    .replace(/^\/audio\/mindfulness\//, '')
    .replace(/^mindfulness\//, '')
    .replace(/\?.*$/, '')

  const aliasCandidate = FILE_ALIASES[sanitized] ?? FILE_ALIASES[key] ?? sanitized
  const normalized = aliasCandidate.replace(/^\/audio\/mindfulness\//, '').replace(/^mindfulness\//, '')
  const trackId = FILE_TO_TRACK_ID[normalized] ?? FILE_TO_TRACK_ID[aliasCandidate]

  return trackId ?? null
}

function normalizeHeardTracks(entries: Record<string, boolean>) {
  const normalized: Record<string, boolean> = {}

  Object.entries(entries).forEach(([key, value]) => {
    const trackId = normalizeStorageKey(key)
    if (!trackId) return
    normalized[trackId] = Boolean(value)
  })

  return normalized
}

function formatDuration(value: number | null) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return '00:00'
  }

  const totalSeconds = Math.round(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface MindfulnessTrackItemProps {
  track: MindfulnessTrack
  isHeard: boolean
  onToggle: () => void
}

function MindfulnessTrackItem({ track, isHeard, onToggle }: MindfulnessTrackItemProps) {
  const audioSrc = useMemo(() => (AUDIO_BASE ? `${AUDIO_BASE}/mindfulness/${track.filename}` : ''), [track.filename])
  const [isMetadataLoading, setIsMetadataLoading] = useState(Boolean(audioSrc))
  const [duration, setDuration] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setDuration(null)
    setHasError(false)
    setIsMetadataLoading(Boolean(audioSrc))
  }, [audioSrc])

  const missingConfiguration = audioSrc === ''
  const badgeLabel = hasError ? 'Arquivo indisponível' : missingConfiguration ? 'Fonte não configurada' : null
  const durationLabel = hasError || missingConfiguration ? '--:--' : formatDuration(duration)

  return (
    <li className="section-card p-5 transition-shadow duration-300 hover:shadow-elevated">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-support-1 md:text-base">{track.title}</p>
            {badgeLabel ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {badgeLabel}
              </span>
            ) : null}
          </div>
          <p className="text-xs font-medium text-support-2/80">{track.filename}</p>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-support-2">
            <input
              type="checkbox"
              checked={isHeard}
              onChange={onToggle}
              className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary/40"
            />
            Já ouvi
          </label>
          {hasError && audioSrc ? (
            <p className="text-xs text-support-2/90">Não foi possível carregar o áudio. Tente novamente em instantes.</p>
          ) : null}
          {missingConfiguration ? (
            <p className="text-xs text-support-2/90">Configure a fonte dos áudios para reproduzir os conteúdos.</p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 md:w-64">
          <audio
            controls
            src={audioSrc}
            preload="none"
            playsInline
            controlsList="nodownload"
            crossOrigin="anonymous"
            style={{ width: '100%' }}
            onLoadedMetadata={(event) => {
              const metadataDuration = event.currentTarget.duration
              setDuration(Number.isFinite(metadataDuration) && metadataDuration > 0 ? metadataDuration : null)
              setIsMetadataLoading(false)
              setHasError(false)
            }}
            onError={() => {
              if (!audioSrc) {
                return
              }

              setIsMetadataLoading(false)
              setHasError(true)
            }}
          >
            Seu navegador não suporta a reprodução de áudio.
          </audio>
          <div className="flex justify-end">
            {isMetadataLoading && !missingConfiguration ? (
              <span className="h-3 w-12 animate-pulse rounded-full bg-primary/15" aria-hidden />
            ) : (
              <span className="text-xs font-medium text-support-2">{durationLabel}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export function MindfulnessCollections() {
  const [activeCollectionId, setActiveCollectionId] = useState<MindfulnessCollectionId | null>(null)
  const [heardTracks, setHeardTracks] = useState<Record<string, boolean>>({})
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>
        const normalized = normalizeHeardTracks(parsed)
        setHeardTracks(normalized)
      }
    } catch (error) {
      console.error('Não foi possível carregar o progresso das meditações:', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(heardTracks))
    } catch (error) {
      console.error('Não foi possível salvar o progresso das meditações:', error)
    }
  }, [heardTracks])

  const activeCollection = useMemo(() => {
    if (!activeCollectionId) {
      return null
    }

    const collection = getCollectionById(activeCollectionId)
    if (!collection) {
      return null
    }

    const detail = COLLECTION_DETAILS[activeCollectionId]

    return {
      id: collection.id,
      title: collection.title,
      icon: detail.icon,
      description: detail.description,
      tracks: collection.tracks,
    }
  }, [activeCollectionId])

  useEffect(() => {
    if (!activeCollectionId || typeof window === 'undefined') {
      return undefined
    }

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousOverflow
    }
  }, [activeCollectionId])

  const handleToggleHeard = (trackId: string) => {
    setHeardTracks((previous) => ({
      ...previous,
      [trackId]: !previous[trackId],
    }))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
        {COLLECTION_CARDS.map((card, index) => (
          <Reveal key={card.id} delay={index * 90} className="h-full">
            <Card className="section-card relative h-full overflow-hidden bg-gradient-to-br from-[#ffd8e6] via-white to-white text-left">
              <div className="flex h-full flex-col gap-5">
                <span className="text-3xl" aria-hidden="true">
                  {card.icon}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-support-1 md:text-xl">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-support-2">{card.description}</p>
                </div>
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveCollectionId(card.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                    aria-label={`Abrir áudios da categoria ${card.title}`}
                  >
                    <span>Ouvir</span>
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {activeCollection && isMounted &&
        createPortal(
          <>
            <div className="modal-overlay" onClick={() => setActiveCollectionId(null)} />
            <div
              className="modal-container"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`mindfulness-modal-${activeCollection.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="section-card relative mx-auto w-full max-w-2xl bg-white/95">
                <button
                  type="button"
                  onClick={() => setActiveCollectionId(null)}
                  className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-support-1 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="pr-6 sm:pr-10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {activeCollection.icon}
                    </span>
                    <h3 id={`mindfulness-modal-${activeCollection.id}`} className="text-xl font-semibold text-support-1 md:text-2xl">
                      {activeCollection.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-support-2">{activeCollection.description}</p>
                </div>

                <ul className="mt-6 space-y-4">
                  {activeCollection.tracks.map((track) => {
                    const isHeard = Boolean(heardTracks[track.id])

                    return (
                      <MindfulnessTrackItem
                        key={track.id}
                        track={track}
                        isHeard={isHeard}
                        onToggle={() => handleToggleHeard(track.id)}
                      />
                    )
                  })}
                </ul>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setActiveCollectionId(null)}>
                    Fechar
                  </Button>
                </div>
              </Card>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
