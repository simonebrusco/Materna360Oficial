import { BADGES, type Badge } from './catalog'

export const LOCKED_STATUSES = ['Ganhando forma', 'Se fortalecendo', 'Em consolidação', 'Tomando corpo'] as const

export function statusForBadge(badge: Badge, unlocked: boolean) {
  // Badges comportamentais (infra P34.1): quando aparecem, já são reconhecidos.
  if (badge.id.startsWith('bb:')) return 'Reconhecido'

  if (unlocked) return 'Reconhecido'
  const idx = Math.max(0, BADGES.findIndex((b) => b.id === badge.id))
  return LOCKED_STATUSES[idx % LOCKED_STATUSES.length]
}
