export type MindfulnessTrack = {
  id: string
  title: string
  filename: string
  enabled?: boolean
}

export type MindfulnessCollectionId = 'reconecte-se' | 'renove-sua-energia' | 'encontre-calma'

export type MindfulnessCollection = {
  id: MindfulnessCollectionId
  title: string
  tracks: MindfulnessTrack[]
}

export type MindfulnessCollectionTrack = MindfulnessTrack & {
  collectionId: MindfulnessCollectionId
}

export const MINDFULNESS_COLLECTIONS: MindfulnessCollection[] = [
  {
    id: 'reconecte-se',
    title: 'Reconecte-se',
    tracks: [
      { id: 'acalme-sua-mente', title: 'Acalme sua mente', filename: 'acalme-sua-mente.mp3' },
      { id: 'respire-e-conecte-se', title: 'Respire e conecte-se', filename: 'respire-e-conecte-se.mp3' },
      { id: 'voce-nao-esta-sozinha', title: 'Você não está sozinha', filename: 'voce-nao-esta-sozinha.mp3' },
    ],
  },
  {
    id: 'renove-sua-energia',
    title: 'Renove sua Energia',
    tracks: [
      { id: 'um-novo-comeco', title: 'Um novo começo', filename: 'um-novo-comeco.mp3' },
      {
        id: 'celebre-os-pequenos-momentos',
        title: 'Celebre os pequenos momentos',
        filename: 'celebre-os-pequenos-momentos.mp3',
      },
      {
        id: 'transforme-o-caos-em-equilibrio',
        title: 'Transforme o caos em equilíbrio',
        filename: 'transforme-o-caos-em-equilibrio.mp3',
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
      { id: 'libertando-se-da-culpa', title: 'Libertando-se da culpa', filename: 'libertando-se-da-culpa.mp3' },
      { id: 'saindo-do-piloto-automatico', title: 'Saindo do piloto automático', filename: 'saindo-do-piloto-automatico.mp3' },
      { id: 'o-poder-do-toque', title: 'O poder do toque', filename: 'o-poder-do-toque-e-do-afeto.mp3' },
    ],
  },
]

const COLLECTIONS_BY_ID = MINDFULNESS_COLLECTIONS.reduce<Record<MindfulnessCollectionId, MindfulnessCollection>>(
  (accumulator, collection) => {
    accumulator[collection.id] = collection
    return accumulator
  },
  {} as Record<MindfulnessCollectionId, MindfulnessCollection>
)

const TRACKS_BY_COLLECTION = {
  'reconecte-se': [] as MindfulnessCollectionTrack[],
  'renove-sua-energia': [] as MindfulnessCollectionTrack[],
  'encontre-calma': [] as MindfulnessCollectionTrack[],
}

const TRACKS_WITH_COLLECTION: MindfulnessCollectionTrack[] = []

MINDFULNESS_COLLECTIONS.forEach((collection) => {
  const entries = collection.tracks.map<MindfulnessCollectionTrack>((track) => ({
    ...track,
    collectionId: collection.id,
  }))

  TRACKS_BY_COLLECTION[collection.id] = entries
  TRACKS_WITH_COLLECTION.push(...entries)
})

export const MINDFULNESS_COLLECTION_ORDER: MindfulnessCollectionId[] = MINDFULNESS_COLLECTIONS.map(
  (collection) => collection.id
)

export const MINDFULNESS_TRACKS: MindfulnessCollectionTrack[] = TRACKS_WITH_COLLECTION

export const MINDFULNESS_TRACKS_BY_ID = MINDFULNESS_TRACKS.reduce<Record<string, MindfulnessCollectionTrack>>(
  (accumulator, track) => {
    accumulator[track.id] = track
    return accumulator
  },
  {}
)

export function getCollectionById(id: MindfulnessCollectionId): MindfulnessCollection | undefined {
  return COLLECTIONS_BY_ID[id]
}

export function getMindfulnessTrack(id: string): MindfulnessCollectionTrack | undefined {
  const track = MINDFULNESS_TRACKS_BY_ID[id]
  if (!track) {
    console.warn(`[mindfulness] Track not found in manifest: ${id}`)
    return undefined
  }

  return track
}

export function tracksFor(collectionId: MindfulnessCollectionId): MindfulnessCollectionTrack[] {
  const tracks = TRACKS_BY_COLLECTION[collectionId]
  if (!tracks) {
    console.warn(`[mindfulness] Collection not found in manifest: ${collectionId}`)
    return []
  }

  return tracks
}
