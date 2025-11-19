'use client'

import { useMemo } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { useSavedInspirations, type SavedContent } from '@/app/hooks/useSavedInspirations'
import { toast } from '@/app/lib/toast'
import { track } from '@/app/lib/telemetry'

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
  const { toggleSave, isSaved, isHydrated } = useSavedInspirations()
  const computedId = useMemo(() => generatePlannerId('recipe', item), [item])

  // Early return após hooks
  if (!item) return null

  const recipeId = `recipe-${computedId}`
  const saved = isHydrated ? isSaved(recipeId) : false

  const handleSaveRecipe = () => {
    if (!isHydrated) return

    const savedContent: SavedContent = {
      id: recipeId,
      title: item.title || 'Receita',
      type: 'receita',
      origin: 'Receitas',
      href: '#',
    }

    toggleSave(savedContent)
    toast.success(saved ? 'Receita removida' : 'Receita salva!')

    if (onSave && item) onSave(item)
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
          onClick={handleSaveRecipe}
          className="flex-1"
        >
          {saved ? '✓ Salvo' : 'Salvar'}
        </Button>
        <button
          onClick={handleSaveRecipe}
          className="p-2 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0"
          aria-label={saved ? 'Remover dos salvos' : 'Salvar receita'}
          title={saved ? 'Remover dos salvos' : 'Salvar receita'}
        >
          <AppIcon
            name="bookmark"
            className={`w-5 h-5 ${
              saved ? 'text-[#ff005e] fill-current' : 'text-[#ddd]'
            }`}
          />
        </button>
      </div>
    </Card>
  )
}
