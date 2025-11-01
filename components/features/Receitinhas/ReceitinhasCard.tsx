'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import type { CmsRecShelfItem } from '@/app/types/recProducts'

const generatePlannerId = (prefix: string, item?: CmsRecShelfItem): string => {
  if (!item?.title) return `${prefix}-unknown`
  return `${prefix}-${item.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')}`
}

interface ReceitinhasCardProps {
  item?: CmsRecShelfItem
  onSave?: (item: CmsRecShelfItem) => void
  /** extras aceitos porque ReceitinhasIA envia esses campos */
  childAgeMonths?: number | null
  initialPlan?: string // ex.: 'premium' | outras variantes
}

export function ReceitinhasCard({ item, onSave }: ReceitinhasCardProps) {
  // Hooks sempre no topo (sem condicional)
  const computedId = useMemo(() => generatePlannerId('recipe', item), [item])

  // Early return após os hooks
  if (!item) return null

  return (
    <Card className="flex flex-col gap-3" data-computed-id={computedId}>
      <div>
        <h3 className="font-semibold text-support-1">{item.title}</h3>
        <p className="text-sm text-support-2/80">{item.description}</p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            if (onSave) onSave(item)
          }}
        >
          Salvar
        </Button>
      </div>
    </Card>
  )
}
