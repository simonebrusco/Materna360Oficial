export type MindfulnessTrack = {
  id: string
  title: string
  file: string
  enabled?: boolean
}

export const MINDFULNESS_TRACKS: MindfulnessTrack[] = [
  { id: 'acalme-sua-mente', title: 'Acalme sua mente', file: 'acalme-sua-mente.mp3' },
  { id: 'respire-e-conecte-se', title: 'Respire e conecte-se', file: 'respire-e-conecte-se.mp3' },
  { id: 'voce-nao-esta-sozinha', title: 'Você não está sozinha', file: 'voce-nao-esta-sozinha.mp3' },
  {
    id: 'voce-nao-precisa-ser-perfeita',
    title: 'Você não precisa ser perfeita',
    file: 'voce-nao-precisa-dar-conta.mp3',
  },
  {
    id: 'celebre-os-pequenos-momentos',
    title: 'Celebre os pequenos momentos',
    file: 'celebrando-pequenos-momentos.mp3',
  },
  {
    id: 'transforme-o-caos-em-equilibrio',
    title: 'Transforme o caos em equilíbrio',
    file: 'transforme-o-caos-em-serenidade.mp3',
  },
  { id: 'suas-palavras-tem-poder', title: 'Suas palavras têm poder', file: 'suas-palavras-tem-poder.mp3' },
  {
    id: 'voce-esta-fazendo-o-seu-melhor',
    title: 'Você está fazendo o seu melhor',
    file: 'voce-esta-fazendo-o-seu-melhor.mp3',
  },
  {
    id: 'encontre-a-paz-dentro-de-voce',
    title: 'Encontre a paz dentro de você',
    file: 'encontre-a-paz-dentro-de-voce.mp3',
  },
  { id: 'libertando-se-da-culpa', title: 'Libertando-se da culpa', file: 'libertando-se-da-culpa.mp3' },
  {
    id: 'saindo-do-piloto-automatico',
    title: 'Saindo do piloto automático',
    file: 'saindo-do-piloto-automatico.mp3',
  },
  {
    id: 'o-poder-do-toque',
    title: 'O poder do toque e do afeto',
    file: 'o-poder-do-toque-e-do-afeto.mp3',
  },
]

export const MINDFULNESS_TRACKS_BY_ID: Record<string, MindfulnessTrack> = MINDFULNESS_TRACKS.reduce(
  (accumulator, track) => {
    accumulator[track.id] = track
    return accumulator
  },
  {} as Record<string, MindfulnessTrack>
)

export function getMindfulnessTrack(id: string): MindfulnessTrack | undefined {
  const track = MINDFULNESS_TRACKS_BY_ID[id]
  if (!track) {
    console.warn(`[Mindfulness] Track not found in manifest: ${id}`)
    return undefined
  }

  if (track.enabled === false) {
    console.warn(`[Mindfulness] Track is disabled in manifest: ${id}`)
    return undefined
  }

  return track
}

export function getMindfulnessUrl(file: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE

  if (!base) {
    console.warn('[Mindfulness] NEXT_PUBLIC_SUPABASE_AUDIO_BASE is not configured.')
    return file
  }

  return `${base.replace(/\/$/, '')}/mindfulness/${file}`
}

export function getEnabledMindfulnessTracks(): MindfulnessTrack[] {
  return MINDFULNESS_TRACKS.filter((track) => track.enabled !== false)
}
