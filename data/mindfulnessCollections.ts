import { MINDFULNESS_TRACKS, MINDFULNESS_TRACKS_BY_ID, MindfulnessTrack } from './mindfulnessManifest'

export const MINDFULNESS_COLLECTIONS = {
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

export type MindfulnessCollectionKey = keyof typeof MINDFULNESS_COLLECTIONS

export const MINDFULNESS_COLLECTION_ORDER: MindfulnessCollectionKey[] = [
  'reconecteSe',
  'renoveSuaEnergia',
  'confieEmVoce',
]

const DISABLED_TRACK_IDS = new Set(
  MINDFULNESS_TRACKS.filter((track) => track.enabled === false).map((track) => track.id)
)

export function getMindfulnessTrackById(id: string): MindfulnessTrack | undefined {
  const track = MINDFULNESS_TRACKS_BY_ID[id]
  if (!track) {
    console.warn(`[Mindfulness] Track not found in manifest: ${id}`)
    return undefined
  }

  if (DISABLED_TRACK_IDS.has(id)) {
    return undefined
  }

  return track
}

export function tracksFor(key: MindfulnessCollectionKey): MindfulnessTrack[] {
  return MINDFULNESS_COLLECTIONS[key]
    .map((id) => getMindfulnessTrackById(id))
    .filter((track): track is MindfulnessTrack => Boolean(track))
}

export function getMindfulnessTrackIdByFile(file: string): string | undefined {
  const normalized = file.replace(/^\/audio\/mindfulness\//, '')
  const direct = MINDFULNESS_TRACKS.find((track) => track.file === normalized)

  if (direct) {
    return direct.id
  }

  return Object.values(MINDFULNESS_TRACKS_BY_ID).find((track) => track.file === file)?.id
}
