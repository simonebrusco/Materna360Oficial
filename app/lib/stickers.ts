export type ProfileStickerId =
  | 'mae-carinhosa'
  | 'mae-leve'
  | 'mae-determinada'
  | 'mae-criativa'
  | 'mae-tranquila'

export type StickerInfo = { label: string; asset: string }

export const STICKERS = {
  'mae-carinhosa': { label: 'Mãe Carinhosa', asset: '/stickers/mae-carinhosa.png' },
  'mae-leve': { label: 'Mãe Leve', asset: '/stickers/mae-leve.png' },
  'mae-determinada': { label: 'Mãe Determinada', asset: '/stickers/mae-determinada.png' },
  'mae-criativa': { label: 'Mãe Criativa', asset: '/stickers/mae-criativa.png' },
  'mae-tranquila': { label: 'Mãe Tranquila', asset: '/stickers/mae-tranquila.png' },
  default: { label: 'Minha Figurinha', asset: '/stickers/mae-carinhosa.png' },
} as const

export const DEFAULT_STICKER_ID = 'default' as const

type StickerKey = keyof typeof STICKERS

export function isStickerId(id: unknown): id is ProfileStickerId {
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
