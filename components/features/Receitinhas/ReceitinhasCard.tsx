import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import type { RecProductT } from '@/app/lib/discoverSchemas'

export const PLANNER_CATEGORIES = [
  'Descobrir',
  'Meu Dia',
  'Cuide-se',
  'Eu360',
] as const

const generatePlannerId = (prefix: string, item?: RecProductT): string => {
  if (!item?.title) return `${prefix}-unknown`
  return `${prefix}-${item.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')}`
}

interface ReceitinhasCardProps {
  item?: RecProductT
  onSave?: (item: RecProductT) => void
}

export function ReceitinhasCard({ item, onSave }: ReceitinhasCardProps) {
  const computedId = useMemo(() => generatePlannerId('recipe', item), [item])

  if (!item) {
    return null
  }

  return (
    <Card className="flex flex-col gap-3">
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
