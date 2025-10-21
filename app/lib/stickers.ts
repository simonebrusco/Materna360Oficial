export type StickerInfo = {
  readonly label: string
  readonly asset: string
}

export const STICKERS = {
  'mae-carinhosa': { label: 'Mãe Carinhosa', asset: '/stickers/mae-carinhosa.svg' },
  'mae-leve': { label: 'Mãe Leve', asset: '/stickers/mae-leve.svg' },
  'mae-determinada': { label: 'Mãe Determinada', asset: '/stickers/mae-determinada.svg' },
  'mae-criativa': { label: 'Mãe Criativa', asset: '/stickers/mae-criativa.svg' },
  'mae-tranquila': { label: 'Mãe Tranquila', asset: '/stickers/mae-tranquila.svg' },
  default: { label: 'Minha Figurinha', asset: '/stickers/default.svg' },
} as const satisfies Record<string, StickerInfo>

export const PROFILE_STICKER_IDS = [
  'mae-carinhosa',
  'mae-leve',
  'mae-determinada',
  'mae-criativa',
  'mae-tranquila',
] as const

export type ProfileStickerId = (typeof PROFILE_STICKER_IDS)[number]

export const DEFAULT_STICKER_ID = 'default'

const PROFILE_STICKER_SET = new Set<string>(PROFILE_STICKER_IDS)

export const isProfileStickerId = (value: unknown): value is ProfileStickerId =>
  typeof value === 'string' && PROFILE_STICKER_SET.has(value)

export const getStickerInfo = (id?: string | null): StickerInfo => {
  if (typeof id !== 'string') {
    return STICKERS[DEFAULT_STICKER_ID]
  }

  return STICKERS[id] ?? STICKERS[DEFAULT_STICKER_ID]
}

export const STICKER_OPTIONS: ReadonlyArray<{ id: ProfileStickerId } & StickerInfo> =
  PROFILE_STICKER_IDS.map((id) => ({ id, ...STICKERS[id] }))
