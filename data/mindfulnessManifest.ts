export type MindfulnessTrack = {
  id: string
  title: string
  filename: string
  durationHint?: string
  enabled?: boolean
}

export type MindfulnessCollectionId = 'reconecte-se' | 'renove-sua-energia' | 'encontre-calma'

export type MindfulnessCollection = {
  id: MindfulnessCollectionId
  title: string
  tracks: MindfulnessCollectionTrack[]
}

export type MindfulnessCollectionTrack = MindfulnessTrack & {
  collectionId: MindfulnessCollectionId
}

const COLLECTION_DEFINITIONS: Array<{
  id: MindfulnessCollectionId
  title: string
  tracks: MindfulnessTrack[]
}> = [
  {
    id: 'reconecte-se',
    title: 'Reconecte-se',
    tracks: [
      {
        id: 'acalme-sua-mente',
        title: 'Acalme sua mente',
        filename: 'acalme-sua-mente.mp3',
        durationHint: '5–8 min',
      },
      {
        id: 'respire-e-conecte-se',
        title: 'Respire e conecte-se',
        filename: 'respire-e-conecte-se.mp3',
      },
      {
        id: 'voce-nao-esta-sozinha',
        title: 'Você não está sozinha',
        filename: 'voce-nao-esta-sozinha.mp3',
      },
      {
        id: 'voce-nao-precisa-ser-perfeita',
        title: 'Você não precisa ser perfeita',
        filename: 'voce-nao-precisa-dar-conta.mp3',
      },
    ],
  },
  {
    id: 'renove-sua-energia',
    title: 'Renove sua Energia',
    tracks: [
      {
        id: 'celebre-os-pequenos-momentos',
        title: 'Celebre os pequenos momentos',
        filename: 'celebrando-pequenos-momentos.mp3',
      },
      {
        id: 'transforme-o-caos-em-equilibrio',
        title: 'Transforme o caos em equilíbrio',
        filename: 'transforme-o-caos-em-serenidade.mp3',
      },
      {
        id: 'voce-esta-fazendo-o-seu-melhor',
        title: 'Você está fazendo o seu melhor',
        filename: 'voce-esta-fazendo-o-seu-melhor.mp3',
      },
    ],
  },
  {
    id: 'encontre-calma',
    title: 'Encontre Calma',
    tracks: [
      {
        id: 'encontre-a-paz-dentro-de-voce',
        title: 'Encontre a paz dentro de você',
        filename: 'encontre-a-paz-dentro-de-voce.mp3',
      },
      {
        id: 'libertando-se-da-culpa',
        title: 'Libertando-se da culpa',
        filename: 'libertando-se-da-culpa.mp3',
      },
      {
        id: 'saindo-do-piloto-automatico',
        title: 'Saindo do piloto automático',
        filename: 'saindo-do-piloto-automatico.mp3',
      },
      {
        id: 'o-poder-do-toque',
        title: 'O poder do toque e do afeto',
        filename: 'o-poder-do-toque-e-do-afeto.mp3',
      },
    ],
  },
]

export const MINDFULNESS_COLLECTION_ORDER = COLLECTION_DEFINITIONS.map((collection) => collection.id)

export const MINDFULNESS_COLLECTIONS: Record<
  MindfulnessCollectionId,
  MindfulnessCollection
> = COLLECTION_DEFINITIONS.reduce((accumulator, collection) => {
  accumulator[collection.id] = {
    id: collection.id,
    title: collection.title,
    tracks: collection.tracks.map((track) => ({
      ...track,
      collectionId: collection.id,
    })),
  }
  return accumulator
}, {} as Record<MindfulnessCollectionId, MindfulnessCollection>)

export const MINDFULNESS_TRACKS: MindfulnessCollectionTrack[] = Object.values(MINDFULNESS_COLLECTIONS)
  .flatMap((collection) => collection.tracks)
  .filter((track) => track.enabled !== false)

export const MINDFULNESS_TRACKS_BY_ID: Record<string, MindfulnessCollectionTrack> = MINDFULNESS_TRACKS.reduce(
  (accumulator, track) => {
    accumulator[track.id] = track
    return accumulator
  },
  {} as Record<string, MindfulnessCollectionTrack>
)

export function getMindfulnessTrack(id: string): MindfulnessCollectionTrack | undefined {
  const track = MINDFULNESS_TRACKS_BY_ID[id]
  if (!track) {
    console.warn(`[mindfulness] Track not found in manifest: ${id}`)
    return undefined
  }

  return track
}

export function tracksFor(collectionId: MindfulnessCollectionId): MindfulnessCollectionTrack[] {
  const collection = MINDFULNESS_COLLECTIONS[collectionId]
  if (!collection) {
    console.warn(`[mindfulness] Collection not found in manifest: ${collectionId}`)
    return []
  }

  return collection.tracks
}
