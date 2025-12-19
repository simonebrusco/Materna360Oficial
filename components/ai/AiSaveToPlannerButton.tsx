'use client'

import { useState, type MouseEvent } from 'react'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import {
  saveQuickIdeaToPlanner,
  saveRecipeToPlanner,
  saveInspirationToPlanner,
  type PlannerOrigin,
} from '@/app/lib/ai/plannerBridge'

type AiSaveVariant = 'quick-idea' | 'recipe' | 'inspiration'

type AiSaveToPlannerButtonProps = {
  /**
   * Tipo de conteúdo de IA que será salvo.
   * - 'quick-idea'     → Ideias Rápidas (Rotina Leve)
   * - 'recipe'         → Receitas Inteligentes
   * - 'inspiration'    → Inspirações do Dia / Insights emocionais
   */
  variant: AiSaveVariant

  /**
   * Objeto retornado pela IA (sugestão, receita ou inspiração).
   * Pode ter qualquer formato, o botão só repassa para o planner.
   */
  data: any

  /**
   * Origem no Planner.
   * Default:
   *  - 'rotina-leve' para quick-idea e recipe
   *  - 'como-estou-hoje' para inspiration
   */
  origin?: PlannerOrigin

  /**
   * Label opcional para o botão.
   * Default: "Salvar no planner"
   */
  label?: string

  /**
   * Classe extra para estilização (opcional).
   */
  className?: string
}

/**
 * Botão reutilizável para salvar conteúdos gerados pela IA no Planner.
 *
 * Uso:
 *   const { addItem } = usePlannerSavedContents()
 *   <AiSaveToPlannerButton variant="recipe" data={recipe} />
 */
export function AiSaveToPlannerButton(props: AiSaveToPlannerButtonProps) {
  const { variant, data, origin, label, className } = props
  const { addItem } = usePlannerSavedContents()
  const [isSaving, setIsSaving] = useState(false)

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!data || isSaving) return

    try {
      setIsSaving(true)

      if (variant === 'quick-idea') {
        saveQuickIdeaToPlanner(
          (input) =>
            addItem({
              origin: origin ?? 'rotina-leve',
              type: 'task',
              title: input.title,
              payload: input.payload,
            }),
          data,
          origin ?? 'rotina-leve',
        )
      } else if (variant === 'recipe') {
        saveRecipeToPlanner(
          (input) =>
            addItem({
              origin: origin ?? 'rotina-leve',
              type: 'recipe',
              title: input.title,
              payload: input.payload,
            }),
          data,
          origin ?? 'rotina-leve',
        )
      } else if (variant === 'inspiration') {
        saveInspirationToPlanner(
          (input) =>
            addItem({
              origin: origin ?? 'como-estou-hoje',
              type: 'insight',
              title: input.title,
              payload: input.payload,
            }),
          data,
          origin ?? 'como-estou-hoje',
        )
      }
      // o próprio usePlannerSavedContents já dispara toast e telemetria
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSaving || !data}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-full border border-pink-300 px-3 py-1 text-sm font-medium text-pink-600 hover:bg-pink-50 disabled:opacity-60 disabled:cursor-not-allowed'
      }
    >
      {/* Ícone simples de “salvar” */}

      <span>{label ?? 'Salvar no planner'}</span>
    </button>
  )
}
