'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'

/** Tipo mínimo local, suficiente para este card (evita dependência de tipos não exportados) */
type RecipeLike = {
  title?: string
  description?: string
}

const generatePlannerId = (prefix: string, item?: RecipeLike): string => {
  if (!item?.title) return `${prefix}-unknown`
  return `${prefix}-${item.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')}`
}

interface ReceitinhasCardProps {
  item?: RecipeLike
  onSave?: (item: RecipeLike) => void

  /** Extras opcionais aceitos porque o bloco ReceitinhasIA envia esses campos */

  /** extras opcionais aceitos porque o bloco ReceitinhasIA envia esses campos */

  childAgeMonths?: number | null
  initialPlan?: string
}

export function ReceitinhasCard({ item, onSave }: ReceitinhasCardProps) {
  // Hooks sempre no topo
  const computedId = useMemo(() => generatePlannerId('recipe', item), [item])

  // Early return após hooks
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

            if (onSave && item) onSave(item)

          }}
        >
          Salvar
        </Button>
      </div>
    </Card>
  )
}
