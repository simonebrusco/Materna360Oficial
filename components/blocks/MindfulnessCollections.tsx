'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import MindfulnessQuickModal from '@/components/mindfulness/MindfulnessQuickModal'
import { MINDFULNESS_COLLECTION_ORDER, getCollectionById } from '@/data/mindfulnessManifest'
import type { MindfulnessCollectionId, MindfulnessTrack } from '@/data/mindfulnessManifest'

type CollectionCard = {
  id: MindfulnessCollectionId
  title: string
  description: string
  durationLabel: string
  icon: string
}

const COLLECTION_DETAILS: Record<MindfulnessCollectionId, Omit<CollectionCard, 'id'>> = {
  'reconecte-se': {
    title: 'Reconecte-se',
    description: 'Práticas curtas para acalmar a mente, sentir o corpo e acolher o momento presente.',
    durationLabel: '5-8 min',
    icon: '🪷',
  },
  'renove-sua-energia': {
    title: 'Renove sua Energia',
    description: 'Respirações guiadas e visualizações que despertam leveza para seguir o dia com disposição.',
    durationLabel: '6-10 min',
    icon: '☀️',
  },
  'encontre-calma': {
    title: 'Encontre Calma',
    description: 'Momentos suaves para acolher emoções, respirar fundo e encontrar serenidade no fim do dia.',
    durationLabel: '7-9 min',
    icon: '🌙',
  },
}

export function MindfulnessCollections() {
  const cards: CollectionCard[] = MINDFULNESS_COLLECTION_ORDER.map((id) => ({
    id,
    ...COLLECTION_DETAILS[id],
  }))

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState<string>('Mindfulness')
  const [modalTracks, setModalTracks] = useState<MindfulnessTrack[]>([])

  const openCollection = (id: MindfulnessCollectionId) => {
    const collection = getCollectionById(id)
    if (collection) {
      setModalTitle(collection.title)
      setModalTracks(collection.tracks)
    } else {
      setModalTitle('Mindfulness')
      setModalTracks([])
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setModalTracks([])
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Reveal key={card.id} delay={index * 80} className="h-full">
            <Card className="section-card relative h-full overflow-hidden bg-gradient-to-br from-[#ffd8e6] via-white to-white text-left">
              <div className="flex h-full flex-col gap-5">
                <span className="text-3xl" aria-hidden="true">
                  {card.icon}
                </span>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-support-1 md:text-xl">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-support-2">{card.description}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    {card.durationLabel}
                  </span>
                </div>
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => openCollection(card.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                    aria-label={`Abrir áudios da coleção ${card.title}`}
                  >
                    <span>Praticar agora</span>
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <MindfulnessQuickModal
        open={modalOpen}
        onClose={handleCloseModal}
        collectionTitle={modalTitle}
        tracks={modalTracks}
      />
    </>
  )
}
