// app/lib/stickers.ts
import type { LucideIcon } from 'lucide-react'
import { Feather, Shield, Sparkles, Target, Heart, Palette } from 'lucide-react'

export type ProfileStickerId =
  | 'mae-carinhosa'
  | 'mae-leve'
  | 'mae-determinada'
  | 'mae-criativa'
  | 'mae-tranquila'
  | 'mae-resiliente'

export type StickerInfo = {
  label: string
  subtitle: string
  Icon: LucideIcon
}

export const STICKERS = {
  'mae-carinhosa': {
    label: 'Mãe Carinhosa',
    subtitle: 'Amor nos pequenos gestos.',
    Icon: Heart,
  },
  'mae-leve': {
    label: 'Mãe Leve',
    subtitle: 'Equilíbrio e presença.',
    Icon: Feather,
  },
  'mae-determinada': {
    label: 'Mãe Determinada',
    subtitle: 'Força com doçura.',
    Icon: Target,
  },
  'mae-criativa': {
    label: 'Mãe Criativa',
    subtitle: 'Inventa e transforma.',
    Icon: Palette,
  },
  'mae-tranquila': {
    label: 'Mãe Tranquila',
    subtitle: 'Serenidade e autocuidado.',
    Icon: Sparkles,
  },
  'mae-resiliente': {
    label: 'Mãe Resiliente',
    subtitle: 'Cai, respira fundo e recomeça.',
    Icon: Shield,
  },
  default: {
    label: 'Minha vibe',
    subtitle: 'Um toque pessoal no seu perfil.',
    Icon: Sparkles,
  },
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
  ['mae-carinhosa', 'mae-leve', 'mae-determinada', 'mae-criativa', 'mae-tranquila', 'mae-resiliente'] as const
).map((id) => ({ id, ...STICKERS[id] }))
