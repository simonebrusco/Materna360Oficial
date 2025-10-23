'use client'

'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

interface MindfulnessTrack {
  file: string
  title: string
}

interface MindfulnessTrackItemProps {
  track: MindfulnessTrack
  isHeard: boolean
  onToggle: () => void
}

interface MindfulnessGroup {
  key: string
  icon: string
  title: string
  description: string
  tracks: MindfulnessTrack[]
}

const STORAGE_KEY = 'materna360-mindfulness-heard'

const LEGACY_FILE_MAP: Record<string, string> = {
  'você-não-está-sozinha.mp3': 'voce-nao-esta-sozinha.mp3',
  'confie-em-você.mp3': 'confie-em-voce.mp3',
  'um-novo-começo.mp3': 'um-novo-comeco.mp3',
  'transforme-o-caos-em-equilíbrio.mp3': 'transforme-o-caos-em-serenidade.mp3',
  'transforme-o-caos-em-equilibrio.mp3': 'transforme-o-caos-em-serenidade.mp3',
  'suas-palavras-têm-poder.mp3': 'suas-palavras-tem-poder.mp3',
  'você-está-fazendo-o-seu-melhor.mp3': 'voce-esta-fazendo-o-melhor.mp3',
  'voce-esta-fazendo-o-seu-melhor.mp3': 'voce-esta-fazendo-o-melhor.mp3',
  'você-não-precisa-ser-perfeita.mp3': 'voce-nao-precisa-dar-conta.mp3',
  'voce-nao-precisa-ser-perfeita.mp3': 'voce-nao-precisa-dar-conta.mp3',
  'celebre-os-pequenos-momentos.mp3': 'celebrando-pequenos-momentos.mp3',
  'encontre-a-paz-dentro-de-você.mp3': 'encontre-a-paz-dentro-de-voce.mp3',
  'saindo-do-piloto-automático.mp3': 'saindo-do-piloto-automatico.mp3',
  '/audio/mindfulness/um-novo-comeco.mp3': 'um-novo-comeco.mp3',
  '/audio/mindfulness/transforme-o-caos-em-equilibrio.mp3': 'transforme-o-caos-em-serenidade.mp3',
  '/audio/mindfulness/celebre-os-pequenos-momentos.mp3': 'celebrando-pequenos-momentos.mp3',
  '/audio/mindfulness/voce-esta-fazendo-o-seu-melhor.mp3': 'voce-esta-fazendo-o-melhor.mp3',
  '/audio/mindfulness/o-poder-do-toque.mp3': 'o-poder-do-toque-e-do-afeto.mp3',
  '/audio/mindfulness/voce-nao-precisa-ser-perfeita.mp3': 'voce-nao-precisa-dar-conta.mp3',
}

const normalizeHeardTracks = (entries: Record<string, boolean>) => {
  const normalized: Record<string, boolean> = {}

  Object.entries(entries).forEach(([file, status]) => {
    const key = LEGACY_FILE_MAP[file] ?? file
    normalized[key] = status
  })

  return normalized
}

const AUDIO_FILE_SRC_MAP: Record<string, string> = {
  'um-novo-comeco.mp3': '/audio/mindfulness/um-novo-comeco.mp3',
  'um-novo-começo.mp3': '/audio/mindfulness/um-novo-comeco.mp3',
  'transforme-o-caos-em-serenidade.mp3': '/audio/mindfulness/transforme-o-caos-em-serenidade.mp3',
  'transforme-o-caos-em-equilibrio.mp3': '/audio/mindfulness/transforme-o-caos-em-serenidade.mp3',
  'transforme-o-caos-em-equilíbrio.mp3': '/audio/mindfulness/transforme-o-caos-em-serenidade.mp3',
  'celebrando-pequenos-momentos.mp3': '/audio/mindfulness/celebrando-pequenos-momentos.mp3',
  'celebre-os-pequenos-momentos.mp3': '/audio/mindfulness/celebrando-pequenos-momentos.mp3',
  'voce-esta-fazendo-o-melhor.mp3': '/audio/mindfulness/voce-esta-fazendo-o-melhor.mp3',
  'voce-esta-fazendo-o-seu-melhor.mp3': '/audio/mindfulness/voce-esta-fazendo-o-melhor.mp3',
  'o-poder-do-toque-e-do-afeto.mp3': '/audio/mindfulness/o-poder-do-toque-e-do-afeto.mp3',
  'o-poder-do-toque.mp3': '/audio/mindfulness/o-poder-do-toque-e-do-afeto.mp3',
  'voce-nao-precisa-dar-conta.mp3': '/audio/mindfulness/voce-nao-precisa-dar-conta.mp3',
  'voce-nao-precisa-ser-perfeita.mp3': '/audio/mindfulness/voce-nao-precisa-dar-conta.mp3',
  'suas-palavras-tem-poder.mp3': '/audio/mindfulness/suas-palavras-tem-poder.mp3',
}

const GROUPS: MindfulnessGroup[] = [
  {
    key: 'reconnect',
    icon: '🪷',
    title: 'Reconecte-se',
    description:
      'Um convite para pausar, respirar e se reconectar com você mesma. Essas práticas ajudam a acalmar a mente e acolher o que você sente, com leveza e presença.',
    tracks: [
      { file: 'acalme-sua-mente.mp3', title: 'Acalme sua mente' },
      { file: 'respire-e-conecte-se.mp3', title: 'Respire e conecte-se' },
      { file: 'voce-nao-esta-sozinha.mp3', title: 'Você não está sozinha' },
      { file: 'voce-nao-precisa-dar-conta.mp3', title: 'Você não precisa ser perfeita' },
      { file: 'desconecte-se-para-o-essencial.mp3', title: 'Desconecte-se para o essencial' },
      { file: 'confie-em-voce.mp3', title: 'Confie em você' },
    ],
  },
  {
    key: 'renew',
    icon: '☀️',
    title: 'Renove sua Energia',
    description:
      'Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma.',
    tracks: [
      { file: 'um-novo-comeco.mp3', title: 'Um novo começo' },
      { file: 'celebrando-pequenos-momentos.mp3', title: 'Celebre os pequenos momentos' },
      { file: 'transforme-o-caos-em-serenidade.mp3', title: 'Transforme o caos em equilíbrio' },
      { file: 'suas-palavras-tem-poder.mp3', title: 'Suas palavras têm poder' },
      { file: 'voce-esta-fazendo-o-melhor.mp3', title: 'Você está fazendo o seu melhor' },
    ],
  },
  {
    key: 'calm',
    icon: '🌙',
    title: 'Encontre Calma',
    description:
      'Momentos para relaxar, descansar e liberar o cansaço emocional. Ideal para o fim do dia, quando tudo o que você precisa é de silêncio e acolhimento.',
    tracks: [
      { file: 'antes-de-dormir.mp3', title: 'Antes de dormir' },
      { file: 'encontre-a-paz-dentro-de-voce.mp3', title: 'Encontre a paz dentro de você' },
      { file: 'libertando-se-da-culpa.mp3', title: 'Libertando-se da culpa' },
      { file: 'saindo-do-piloto-automatico.mp3', title: 'Saindo do piloto automático' },
      { file: 'o-poder-do-toque-e-do-afeto.mp3', title: 'O poder do toque' },
    ],
  },
]

const resolveTrackFile = (file: string) => {
  const normalized = LEGACY_FILE_MAP[file] ?? file
  return AUDIO_FILE_SRC_MAP[normalized] ?? normalized
}

function buildSrc(file: string) {
  const resolved = resolveTrackFile(file)
  if (resolved.startsWith('/')) return resolved

  const encoded = encodeURIComponent(resolved)
  return `/audio/mindfulness/${encoded}`
}

function MindfulnessTrackItem({ track, isHeard, onToggle }: MindfulnessTrackItemProps) {
  const src = useMemo(() => buildSrc(track.file), [track.file])
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch(src, { method: 'HEAD', cache: 'no-store' })
      .then((response) => {
        if (!isMounted) return
        console.log('Mindfulness audio check:', src, response.status)
        setIsAvailable(response.ok)
      })
      .catch((error) => {
        if (!isMounted) return
        console.log('Mindfulness audio check:', src, 'error')
        console.error('Mindfulness audio availability error:', src, error)
        setIsAvailable(false)
      })

    return () => {
      isMounted = false
    }
  }, [src])

  return (
    <li className="rounded-2xl bg-white/90 p-4 shadow-soft transition-shadow duration-300 hover:shadow-elevated">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-support-1 md:text-base">{track.title}</p>
            {isAvailable === false && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                arquivo não encontrado
              </span>
            )}
          </div>
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
            style={{ width: '100%' }}
            onLoadedMetadata={(event) => {
              const audio = event.currentTarget
              console.log('AUDIO METADATA:', audio.currentSrc, 'duration=', audio.duration)
            }}
            onPlay={(event) => {
              const audio = event.currentTarget
              audio.muted = false
              try {
                audio.volume = 1
              } catch {}
              console.log('AUDIO PLAY:', audio.currentSrc, 'muted=', audio.muted, 'volume=', audio.volume)
            }}
            onError={(event) => {
              console.error('AUDIO ERROR:', event.currentTarget.currentSrc)
            }}
          >
            <source src={src} type="audio/mpeg" />
            Seu navegador não suporta a reprodução de áudio.
          </audio>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            src: {src} ·{' '}
            <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
              Abrir arquivo
            </a>
          </p>
        </div>
      </div>
    </li>
  )
}

export function MindfulnessCollections() {
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
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

  const handleToggleHeard = (file: string) => {
    setHeardTracks((previous) => ({
      ...previous,
      [file]: !previous[file],
    }))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {GROUPS.map((group, index) => (
          <Reveal key={group.key} delay={index * 90} className="h-full">
            <Card className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#ffd8e6] via-white to-white p-7 text-left">
              <div className="flex h-full flex-col gap-4">
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
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-elevated"
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
            <div
              className="mindfulness-overlay"
              style={{ position: 'fixed', inset: 0, zIndex: 2147483606, background: 'rgba(0,0,0,0.25)', pointerEvents: 'auto' }}
              onClick={() => setActiveGroupKey(null)}
            />
            <div
              className="mindfulness-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`mindfulness-modal-${activeGroup.key}`}
              style={{
                position: 'fixed',
                inset: 0,
                margin: 'auto',
                maxWidth: '720px',
                width: 'calc(100% - 32px)',
                zIndex: 2147483607,
                maxHeight: 'calc(100% - 48px)',
                overflowY: 'auto',
                pointerEvents: 'auto',
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <Card className="relative w-full rounded-3xl p-7">
                <button
                  type="button"
                  onClick={() => setActiveGroupKey(null)}
                  className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-support-1 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="pr-10">
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
                    const isHeard = Boolean(heardTracks[track.file])

                    return (
                      <MindfulnessTrackItem
                        key={track.file}
                        track={track}
                        isHeard={isHeard}
                        onToggle={() => handleToggleHeard(track.file)}
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
