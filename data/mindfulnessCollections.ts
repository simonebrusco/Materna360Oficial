import {
  MINDFULNESS_COLLECTIONS as COLLECTION_LIST,
  MINDFULNESS_COLLECTION_ORDER,
  MINDFULNESS_TRACKS,
  MINDFULNESS_TRACKS_BY_ID,
  MindfulnessCollection,
  MindfulnessCollectionId,
  MindfulnessCollectionTrack,
  MindfulnessTrack,
  getMindfulnessTrack,
  tracksFor,
} from './mindfulnessManifest'

export type { MindfulnessCollectionTrack, MindfulnessTrack }

export type MindfulnessCollectionKey = MindfulnessCollectionId

export { MINDFULNESS_COLLECTION_ORDER, getMindfulnessTrack, tracksFor }

export const MINDFULNESS_COLLECTIONS: Record<
  MindfulnessCollectionKey,
  MindfulnessCollection
> = COLLECTION_LIST.reduce(
  (accumulator, collection) => {
    accumulator[collection.id] = collection
    return accumulator
  },
  {} as Record<MindfulnessCollectionKey, MindfulnessCollection>
)

const DISABLED_TRACK_IDS = new Set(
  MINDFULNESS_TRACKS.filter((track) => track.enabled === false).map((track) => track.id)
)

export function getMindfulnessTrackById(id: string): MindfulnessCollectionTrack | undefined {
  const track = MINDFULNESS_TRACKS_BY_ID[id]
  if (!track) {
    console.warn(`[mindfulness] Track not found in manifest: ${id}`)
    return undefined
  }

  if (DISABLED_TRACK_IDS.has(id)) {
    return undefined
  }

  return track
}

export function getMindfulnessTrackIdByFilename(filename: string): string | undefined {
  const normalized = filename.replace(/^\/mindfulness\//, '').replace(/^\//, '')

  return MINDFULNESS_TRACKS.find((track) => track.filename === normalized)?.id
}
