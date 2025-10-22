'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'

interface MindfulnessTrack {
  file: string
  title: string
}

interface MindfulnessGroup {
  key: string
  icon: string
  title: string
  description: string
  tracks: MindfulnessTrack[]
}

const STORAGE_KEY = 'materna360-mindfulness-heard'

const GROUPS: MindfulnessGroup[] = [
  {
    key: 'reconnect',
    icon: '🌸',
    title: 'Reconecte-se',
    description:
      'Um convite para pausar, respirar e se reconectar com você mesma. Essas práticas ajudam a acalmar a mente e acolher o que você sente, com leveza e presença.',
    tracks: [
      { file: 'acalme-sua-mente.mp3', title: 'Acalme sua mente' },
      { file: 'respire-e-conecte-se.mp3', title: 'Respire e conecte-se' },
      { file: 'voce-nao-esta-sozinha.mp3', title: 'Você não está sozinha' },
      { file: 'voce-nao-precisa-ser-perfeita.mp3', title: 'Você não precisa ser perfeita' },
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
      { file: 'celebre-os-pequenos-momentos.mp3', title: 'Celebre os pequenos momentos' },
      { file: 'transforme-o-caos-em-equilibrio.mp3', title: 'Transforme o caos em equilíbrio' },
      { file: 'suas-palavras-tem-poder.mp3', title: 'Suas palavras têm poder' },
      { file: 'voce-esta-fazendo-o-seu-melhor.mp3', title: 'Você está fazendo o seu melhor' },
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
      { file: 'o-poder-do-toque.mp3', title: 'O poder do toque' },
    ],
  },
]

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
        setHeardTracks(parsed)
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

    const { body, documentElement } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    documentElement.classList.add('isMindfulnessOpen')

    return () => {
      documentElement.classList.remove('isMindfulnessOpen')
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
                <span className="text-3xl" aria-hidden>
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
              onClick={() => setActiveGroupKey(null)}
            />
            <div
              className="mindfulness-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`mindfulness-modal-${activeGroup.key}`}
            >
              <Card className="relative w-full rounded-3xl p-7" onClick={(event) => event.stopPropagation()}>
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
                    <span className="text-2xl" aria-hidden>
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
                      <li
                        key={track.file}
                        className="rounded-2xl bg-white/90 p-4 shadow-soft transition-shadow duration-300 hover:shadow-elevated"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-support-1 md:text-base">{track.title}</p>
                            <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-support-2">
                              <input
                                type="checkbox"
                                checked={isHeard}
                                onChange={() => handleToggleHeard(track.file)}
                                className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary/40"
                              />
                              Já ouvi
                            </label>
                          </div>
                          <audio
                            controls
                            className="w-full rounded-2xl bg-white/70 md:w-64"
                            preload="none"
                          >
                            <source src={`/audio/mindfulness/${track.file}`} type="audio/mpeg" />
                            Seu navegador não suporta a reprodução de áudio.
                          </audio>
                        </div>
                      </li>
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
