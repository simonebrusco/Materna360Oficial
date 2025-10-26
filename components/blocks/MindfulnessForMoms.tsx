'use client'

import { useState } from 'react'

import MindfulnessModal from '@/components/features/Mindfulness/MindfulnessModal'
import {
  TRACKS_ENCONTRE_CALMA,
  TRACKS_RECONCETE_SE,
  TRACKS_RENOVE_SUA_ENERGIA,
} from '@/components/features/Mindfulness/tracks'
import { Button } from '@/components/ui/Button'

const SHOW_FEATURED_PRACTICES = false

const SECONDARY_TRIGGER_CLASS =
  'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF3E79] to-[#FF6B9A] px-6 py-3 text-[18px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,62,121,0.35)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-primary/30 md:px-7 md:py-3.5 md:text-[19px]'

const FEATURED_COLLECTION_IDS = new Set(['acolhimento', 'clareza'])

const COLLECTIONS = [
  {
    id: 'reconectar',
    icon: '🌸',
    titulo: 'Reconecte-se',
    descricao:
      'Um convite para pausar, respirar e se reconectar com você mesma. Essas práticas ajudam a acalmar a mente e acolher o que você sente, com leveza e presença.',
  },
  {
    id: 'energia',
    icon: '☀️',
    titulo: 'Renove sua Energia',
    descricao:
      'Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma.',
  },
  {
    id: 'descanso',
    icon: '🌙',
    titulo: 'Encontre Calma',
    descricao:
      'Momentos para relaxar, descansar e liberar o cansaço emocional. Ideal para o fim do dia, quando tudo o que você precisa é de silêncio e acolhimento.',
  },
  {
    id: 'acolhimento',
    icon: '🤍',
    titulo: 'Acolher emoções',
    descricao: 'Meditações guiadas para reconhecer sentimentos e transformá-los em cuidado consigo mesma.',
  },
  {
    id: 'clareza',
    icon: '✨',
    titulo: 'Clareza e foco',
    descricao: 'Respirações focadas que ajudam a organizar pensamentos e priorizar com leveza.',
  },
]

export default function MindfulnessForMoms() {
  const [openReconecte, setOpenReconecte] = useState(false)
  const [openRenove, setOpenRenove] = useState(false)
  const [openCalma, setOpenCalma] = useState(false)

  const visibleCollections = SHOW_FEATURED_PRACTICES
    ? COLLECTIONS
    : COLLECTIONS.filter((collection) => !FEATURED_COLLECTION_IDS.has(collection.id))

  return (
    <section className="space-y-10">
      <header>
        <h2 className="mb-6 flex items-center gap-3 text-[28px] font-extrabold text-support-1 md:text-[34px]">
          <span aria-hidden="true" className="text-2xl md:text-3xl">
            🎧
          </span>
          Mindfulness para Mães
        </h2>
        <p className="max-w-3xl text-lg leading-relaxed text-support-2">
          Pausas guiadas, curtas e acolhedoras, para respirar com intenção e cuidar do coração enquanto a rotina acontece.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {visibleCollections.map((collection) => (
          <article
            key={collection.id}
            className="relative flex h-full flex-col rounded-[28px] bg-gradient-to-b from-white/92 to-white/70 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.10)] ring-1 ring-white/60 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_72px_rgba(0,0,0,0.12)] md:p-10"
          >
            <div>
              <span
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-2xl shadow-sm"
                aria-hidden="true"
              >
                {collection.icon}
              </span>
              <h3 className="mb-4 text-lg md:text-[22px] font-extrabold leading-tight text-support-1">{collection.titulo}</h3>
              <p className="text-[13.5px] md:text-[15px] leading-relaxed text-support-2">{collection.descricao}</p>
            </div>

            <div className="mt-auto pt-8">
              {collection.id === 'reconectar' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOpenReconecte(true)}
                  aria-label={`Ouvir ${collection.titulo}`}
                  className="rounded-2xl px-5"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    ▶︎
                  </span>
                  <span>Ouvir</span>
                </Button>
              ) : collection.id === 'energia' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOpenRenove(true)}
                  aria-label={`Ouvir ${collection.titulo}`}
                  className="rounded-2xl px-5"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    ▶︎
                  </span>
                  <span>Ouvir</span>
                </Button>
              ) : collection.id === 'descanso' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOpenCalma(true)}
                  aria-label={`Ouvir ${collection.titulo}`}
                  className="rounded-2xl px-5"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    ▶︎
                  </span>
                  <span>Ouvir</span>
                </Button>
              ) : (
                <a
                  href="#mindfulness"
                  aria-label={`Ouvir ${collection.titulo}`}
                  className={SECONDARY_TRIGGER_CLASS}
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    ▶︎
                  </span>
                  <span>Ouvir</span>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <MindfulnessModal
        open={openReconecte}
        onClose={() => setOpenReconecte(false)}
        icon="🌸"
        title="Reconecte-se"
        subtitle="Um convite para pausar, respirar e se reconectar com você mesma. Essas práticas ajudam a acalmar a mente e acolher o que você sente, com leveza e presença."
        tracks={TRACKS_RECONCETE_SE}
        testId="modal-reconecte"
      />

      <MindfulnessModal
        open={openRenove}
        onClose={() => setOpenRenove(false)}
        icon="🌞"
        title="Renove sua Energia"
        subtitle="Pequenas pausas para despertar alegria, esperança e equilíbrio. Essas meditações trazem leveza para o dia e ajudam a transformar o caos em calma."
        tracks={TRACKS_RENOVE_SUA_ENERGIA}
        testId="modal-renove"
      />

      <MindfulnessModal
        open={openCalma}
        onClose={() => setOpenCalma(false)}
        icon="🌙"
        title="Encontre Calma"
        subtitle="Momentos para relaxar, descansar e liberar o cansaço emocional. Ideal para o fim do dia, quando tudo o que você precisa é de silêncio e acolhimento."
        tracks={TRACKS_ENCONTRE_CALMA}
        testId="modal-calma"
      />
    </section>
  )
}
