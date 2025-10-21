export type ProfileStickerId =
  | 'mae-carinhosa'
  | 'mae-leve'
  | 'mae-determinada'
  | 'mae-criativa'
  | 'mae-tranquila'

export type StickerInfo = { label: string; asset: string }

export const STICKERS = {
  'mae-carinhosa': { label: 'Mãe Carinhosa', asset: '/stickers/mae-carinhosa.svg' },
  'mae-leve': { label: 'Mãe Leve', asset: '/stickers/mae-leve.svg' },
  'mae-determinada': { label: 'Mãe Determinada', asset: '/stickers/mae-determinada.svg' },
  'mae-criativa': { label: 'Mãe Criativa', asset: '/stickers/mae-criativa.svg' },
  'mae-tranquila': { label: 'Mãe Tranquila', asset: '/stickers/mae-tranquila.svg' },
  default: { label: 'Minha Figurinha', asset: '/stickers/default.svg' },
} as const

export const DEFAULT_STICKER_ID = 'default' as const

type StickerKey = keyof typeof STICKERS

function isStickerId(id: unknown): id is ProfileStickerId {
  return typeof id === 'string' && id in STICKERS && id !== DEFAULT_STICKER_ID
}

export function resolveSticker(id: unknown): StickerInfo {
  const key = (isStickerId(id) ? id : DEFAULT_STICKER_ID) as StickerKey
  return STICKERS[key]
}

export const isProfileStickerId = (value: unknown): value is ProfileStickerId => isStickerId(value)

export const getStickerInfo = (id?: string | null): StickerInfo => resolveSticker(id)

export const STICKER_OPTIONS: ReadonlyArray<{ id: ProfileStickerId } & StickerInfo> = (
  ['mae-carinhosa', 'mae-leve', 'mae-determinada', 'mae-criativa', 'mae-tranquila'] as const
).map((id) => ({ id, ...STICKERS[id] }))
