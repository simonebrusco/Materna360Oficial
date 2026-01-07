import type { BadgeId } from '@/app/lib/badges'
import { computeBadges } from '@/app/lib/badges'
import type { Badge } from '@/app/lib/minhas-conquistas/catalog'

// Mapeamento mínimo, sem inventar fluxo e sem UI nova.
// Apenas converte os badges “comportamentais” para o mesmo formato de card já existente.
function iconFor(id: BadgeId): Badge['icon'] {
  switch (id) {
    case 'autocuidado_7':
      return 'sparkles'
    case 'mae_presente':
      return 'heart'
    case 'conexao_sem_culpa':
      return 'star'
    default:
      return 'star'
  }
}

// Texto neutro, descritivo, sem prescrição, sem “você deveria”.
function descFor(id: BadgeId): string {
  switch (id) {
    case 'autocuidado_7':
      return 'Reconhecido por cuidado possível, no seu ritmo.'
    case 'mae_presente':
      return 'Reconhecido por presença registrada em pequenos gestos.'
    case 'conexao_sem_culpa':
      return 'Reconhecido por escolhas que aproximam, sem peso.'
    default:
      return 'Reconhecido com leveza, sem cobrança.'
  }
}

// Exporta no formato do grid atual (BadgeCard).
// minPoints vira 0 porque aqui o badge só aparece quando já está desbloqueado (computeBadges()).
export function getBehaviorBadgesForConquistas(): Badge[] {
  const raw = computeBadges()

  return raw.map((b) => ({
    id: `bb:${b.id}`, // prefixo para evitar colisão com ids narrativos ('b-1' etc.)
    title: b.label,
    desc: descFor(b.id),
    icon: iconFor(b.id),
    minPoints: 0,
  }))
}
