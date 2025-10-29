export const DEFAULT_STICKER_ID = 'default'

export type ProfileStickerId = 'default' | 'mae-carinhosa' | 'mae-leve' | 'mae-determinada' | 'mae-criativa' | 'mae-tranquila'

export const STICKERS: Record<string, any> = {
  default: {
    id: 'default',
    name: 'Padrão',
    label: 'Padrão',
    asset: 'https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc?width=100',
  },
  'mae-carinhosa': {
    id: 'mae-carinhosa',
    name: 'Mãe Carinhosa',
    label: 'Carinhosa',
    asset: 'https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc?width=100',
  },
  'mae-leve': {
    id: 'mae-leve',
    name: 'Mãe Leve',
    label: 'Leve',
    asset: 'https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc?width=100',
  },
  'mae-determinada': {
    id: 'mae-determinada',
    name: 'Mãe Determinada',
    label: 'Determinada',
    asset: 'https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc?width=100',
  },
  'mae-criativa': {
    id: 'mae-criativa',
    name: 'Mãe Criativa',
    label: 'Criativa',
    asset: 'https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc?width=100',
  },
  'mae-tranquila': {
    id: 'mae-tranquila',
    name: 'Mãe Tranquila',
    label: 'Tranquila',
    asset: 'https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc?width=100',
  },
}

export const STICKER_OPTIONS = Object.values(STICKERS)

export function isProfileStickerId(id: string | undefined): id is ProfileStickerId {
  return id !== undefined && id in STICKERS
}

export function resolveSticker(id: string): any {
  return STICKERS[id] || STICKERS.default
}
