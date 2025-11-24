'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import {
  MINDFULNESS_TRACKS,
  MindfulnessTrack,
  getMindfulnessUrl,
} from '@/data/mindfulnessManifest'

const STORAGE_KEY = 'materna360-mindfulness-heard'

const FILE_ALIASES: Record<string, string> = {
  'você-não-está-sozinha.mp3': 'voce-nao-esta-sozinha.mp3',
  'você-não-precisa-ser-perfeita.mp3': 'voce-nao-precisa-dar-conta.mp3',
  'voce-nao-precisa-ser-perfeita.mp3': 'voce-nao-precisa-dar-conta.mp3',
  'transforme-o-caos-em-equilíbrio.mp3': 'transforme-o-caos-em-serenidade.mp3',
  'transforme-o-caos-em-equilibrio.mp3': 'transforme-o-caos-em-serenidade.mp3',
  'suas-palavras-têm-poder.mp3': 'suas-palavras-tem-poder.mp3',
  'você-está-fazendo-o-seu-melhor.mp3': 'voce-esta-fazendo-o-seu-melhor.mp3',
  'voce-esta-fazendo-o-melhor.mp3': 'voce-esta-fazendo-o-seu-melhor.mp3',
  'celebre-os-pequenos-momentos.mp3': 'celebrando-pequenos-momentos.mp3',
  'encontre-a-paz-dentro-de-você.mp3': 'encontre-a-paz-dentro-de-voce.mp3',
  'saindo-do-piloto-automático.mp3': 'saindo-do-piloto-automatico.mp3',
  '/audio/mindfulness/voce-nao-precisa-ser-perfeita.mp3': 'voce-nao-precisa-dar-conta.mp3',
  '/audio/mindfulness/voce-esta-fazendo-o-seu-melhor.mp3': 'voce-esta-fazendo-o-seu-melhor.mp3',
  '/audio/mindfulness/celebre-os-pequenos-momentos.mp3': 'celebrando-pequenos-momentos.mp3',
  '/audio/mindfulness/transforme-o-caos-em-equilibrio.mp3': 'transforme-o-caos-em-serenidade.mp3',
  '/audio/mindfulness/o-poder-do-toque.mp3': 'o-poder-do-toque-e-do-afeto.mp3',
  '/audio/mindfulness/voce-esta-fazendo-o-melhor.mp3': 'voce-esta-fazendo-o-seu-melhor.mp3',
}

const byId: Record<string, MindfulnessTrack> = Object.fromEntries(
  MINDFULNESS_TRACKS.map((track) => [track.id, track])
)

const fileToIdMap = MINDFULNESS_TRACKS.reduce<Record<string, string>>((accumulator, track) => {
  accumulator[track.file] = track.id
  accumulator[`/audio/mindfulness/${track.file}`] = track.id
  return accumulator
}, {})

Object.entries(FILE_ALIASES).forEach(([legacy, canonical]) => {
  const canonicalFile = canonical.replace(/^\/audio\/mindfulness\//, '')
  const trackId = fileToIdMap[canonicalFile]
  if (trackId) {
    fileToIdMap[legacy] = trackId
  }
})

const COLLECTIONS = {
  reconecteSe: [
    'acalme-sua-mente',
    'respire-e-conecte-se',
    'voce-nao-esta-sozinha',
    'voce-nao-precisa-ser-perfeita',
  ],
  renoveSuaEnergia: [
    'celebre-os-pequenos-momentos',
    'transforme-o-caos-em-equilibrio',
    'voce-esta-fazendo-o-seu-melhor',
  ],
  confieEmVoce: [
    'encontre-a-paz-dentro-de-voce',
    'libertando-se-da-culpa',
    'saindo-do-piloto-automatico',
    'o-poder-do-toque',
  ],
} as const

type CollectionKey = keyof typeof COLLECTIONS

type CollectionGroup = {
  key: CollectionKey
  icon: string
  title: string
  description: string
  tracks: MindfulnessTrack[]
}

const COLLECTION_DETAILS: Record<CollectionKey, { icon: string; title: string; description: string }> = {
  reconecteSe: {
    icon: '🪷',
    title: 'Reconecte-se',
    description:
      'Um convite para pausar, respirar e se reconectar com você mesma. Essas práticas ajudam a acalmar a mente e acolher o que você sente, com leveza e presença.',
  },
  renoveSuaEnergia: {
    icon: '☀️',
    title: 'Renove sua energia',
    description:
      'Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma.',
  },
  confieEmVoce: {
    icon: '🌙',
    title: 'Confie em você',
    description:
      'Momentos para relaxar, descansar e liberar o cansaço emocional. Ideal para o fim do dia, quando tudo o que você precisa é de silêncio e acolhimento.',
  },
}

const COLLECTION_ORDER: CollectionKey[] = ['reconecteSe', 'renoveSuaEnergia', 'confieEmVoce']

function tracksFor(key: CollectionKey): MindfulnessTrack[] {
  return COLLECTIONS[key]
    .map((id) => {
      const track = byId[id]
      if (!track) {
        console.warn(`[Mindfulness] Track not found in manifest: ${id}`)
        return null
      }

      if (track.enabled === false) {
        return null
      }

      return track
    })
    .filter((track): track is MindfulnessTrack => Boolean(track))
}

const GROUPS: CollectionGroup[] = COLLECTION_ORDER.map((key) => ({
  key,
  icon: COLLECTION_DETAILS[key].icon,
  title: COLLECTION_DETAILS[key].title,
  description: COLLECTION_DETAILS[key].description,
  tracks: tracksFor(key),
}))

function normalizeStorageKey(key: string): string | null {
  if (!key) return null

  if (byId[key]) {
    return key
  }

  const sanitized = key
    .replace(/^https?:\/\/[^/]+\//, '/')
    .replace(/^\/audio\/mindfulness\//, '')
    .replace(/\?.*$/, '')

  const aliasCandidate = FILE_ALIASES[sanitized] ?? FILE_ALIASES[key] ?? sanitized
  const canonicalFile = aliasCandidate.replace(/^\/audio\/mindfulness\//, '')
  const trackId = fileToIdMap[canonicalFile] ?? fileToIdMap[aliasCandidate]

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
  const src = useMemo(() => getMindfulnessUrl(track.file), [track.file])
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [duration, setDuration] = useState<number | null>(null)

  return (
    <li className="CardElevate section-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-support-1 md:text-base">{track.title}</p>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-support-2">
            <input
              type="checkbox"
              checked={isHeard}
              onChange={onToggle}
              className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary/40"
            />
            Já ouvi
          </label>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-64">
          <audio
            controls
            preload="none"
            playsInline
            controlsList="nodownload"
            className="w-full"
            onLoadedMetadata={(event) => {
              const audio = event.currentTarget
              const audioDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null
              setDuration(audioDuration)
              setIsMetadataLoading(false)
            }}
            onPlay={(event) => {
              const audio = event.currentTarget
              audio.muted = false
            }}
            onError={(event) => {
              setIsMetadataLoading(false)
              console.warn('[Mindfulness] Falha ao carregar áudio:', event.currentTarget.currentSrc)
            }}
          >
            <source src={src} type="audio/mpeg" />
            Seu navegador não suporta a reprodução de áudio.
          </audio>
          <div className="flex justify-end">
            {isMetadataLoading ? (
              <span className="h-3 w-12 animate-pulse rounded-full bg-primary/15" aria-hidden />
            ) : (
              <span className="text-xs font-medium text-support-2">{formatDuration(duration)}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export function MindfulnessCollections() {
  const [activeGroupKey, setActiveGroupKey] = useState<CollectionKey | null>(null)
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

  const activeGroup = useMemo(
    () => GROUPS.find((group) => group.key === activeGroupKey) ?? null,
    [activeGroupKey]
  )

  useEffect(() => {
    if (!activeGroupKey || typeof window === 'undefined') {
      return undefined
    }

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousOverflow
    }
  }, [activeGroupKey])

  const handleToggleHeard = (trackId: string) => {
    setHeardTracks((previous) => ({
      ...previous,
      [trackId]: !previous[trackId],
    }))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
        {GROUPS.map((group, index) => (
          <Reveal key={group.key} delay={index * 90} className="h-full">
            <Card className="CardElevate section-card relative h-full overflow-hidden bg-gradient-to-br from-[#ffd8e6] via-white to-white text-left">
              <div className="flex h-full flex-col gap-5">
                <span className="text-3xl" aria-hidden="true">
                  {group.icon}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-support-1 md:text-xl">{group.title}</h3>
                  <p className="text-sm leading-relaxed text-support-2">{group.description}</p>
                </div>
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveGroupKey(group.key)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                    aria-label={`Abrir áudios da categoria ${group.title}`}
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

      {activeGroup && isMounted &&
        createPortal(
          <>
            <div className="modal-overlay" onClick={() => setActiveGroupKey(null)} />
            <div
              className="modal-container"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`mindfulness-modal-${activeGroup.key}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="CardElevate section-card relative mx-auto w-full max-w-2xl bg-white/95">
                <button
                  type="button"
                  onClick={() => setActiveGroupKey(null)}
                  className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-support-1 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="pr-6 sm:pr-10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {activeGroup.icon}
                    </span>
                    <h3
                      id={`mindfulness-modal-${activeGroup.key}`}
                      className="text-xl font-semibold text-support-1 md:text-2xl"
                    >
                      {activeGroup.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-support-2">{activeGroup.description}</p>
                </div>

                <ul className="mt-6 space-y-4">
                  {activeGroup.tracks.map((track) => {
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
                  <Button variant="outline" size="sm" onClick={() => setActiveGroupKey(null)}>
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
