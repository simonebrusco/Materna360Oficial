export const DEFAULT_STICKER_ID = 'default'

export const STICKERS: Record<string, any> = {
  default: { id: 'default', name: 'Default' },
}

export function isProfileStickerId(id: string): boolean {
  return id in STICKERS
}

export function resolveSticker(id: string): any {
  return STICKERS[id] || STICKERS.default
}
