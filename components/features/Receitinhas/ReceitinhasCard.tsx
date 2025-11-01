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
}

export function ReceitinhasCard({ item, onSave }: ReceitinhasCardProps) {
  // ✅ Hooks devem ser chamados sempre, independentemente de condições
  const computedId = useMemo(() => generatePlannerId('recipe', item), [item])

  // Early return só DEPOIS dos hooks
  if (!item) {
    return null
  }

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
            if (onSave) {
              onSave(item)
            }
          }}
        >
          Salvar
        </Button>
      </div>
    </Card>
  )
}
