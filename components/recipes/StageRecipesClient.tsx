'use client'

'use client'

import { useEffect, useMemo, useState } from 'react'

import type { RecipeStageKey, StageRecipe } from '@/data/healthyRecipesContent'

type StageMeta = {
  key: RecipeStageKey
  label: string
  tagline: string
  recipes: StageRecipe[]
}

type StageRecipesClientProps = {
  stages: StageMeta[]
  initialStage: RecipeStageKey
}

export function StageRecipesClient({ stages, initialStage }: StageRecipesClientProps) {
  const stageKeys = useMemo<RecipeStageKey[]>(() => stages.map((stage) => stage.key), [stages])

  const defaultStage = useMemo<RecipeStageKey | null>(() => {
    if (stageKeys.length === 0) {
      return null
    }
    if (stageKeys.includes(initialStage)) {
      return initialStage
    }
    return stageKeys[0]
  }, [initialStage, stageKeys])

  const [activeStage, setActiveStage] = useState<RecipeStageKey>(defaultStage ?? '6-8m')

  useEffect(() => {
    if (defaultStage && defaultStage !== activeStage) {
      setActiveStage(defaultStage)
    }
  }, [defaultStage, activeStage])

  const stageLabelMap = useMemo(() => {
    const map = new Map<RecipeStageKey, string>()
    for (const stage of stages) {
      map.set(stage.key, stage.label)
    }
    return map
  }, [stages])

  if (!defaultStage) {
    return null
  }

  const currentStage =
    stages.find((stage) => stage.key === activeStage) ??
    stages.find((stage) => stage.key === defaultStage) ??
    stages[0]

  if (!currentStage) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => {
          const isActive = stage.key === activeStage
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => setActiveStage(stage.key)}
              aria-pressed={isActive}
              aria-label={`Filtrar receitas para ${stage.label}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-gentle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                isActive
                  ? 'border-primary bg-primary text-white shadow-[0_4px_24px_rgba(47,58,86,0.08)]'
                  : 'border-white/70 bg-white/80 text-support-1 hover:bg-white'
              }`}
            >
              {stage.label}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-sm text-support-2/80">{currentStage.tagline}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {currentStage.recipes.map((recipe) => (
          <article
            key={recipe.id}
            className="h-full rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-transform duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]"
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-support-1">{recipe.title}</h3>
                <p className="mt-2 text-sm text-support-2/80">{recipe.summary}</p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold text-support-1">
                  {recipe.prepTime}
                </span>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {stageLabelMap.get(recipe.stage) ?? currentStage.label}
                </span>
              </div>
            </header>
            <ul className="mt-4 space-y-1.5 text-sm text-support-2/80">
              {recipe.keyIngredients.map((ingredient) => (
                <li key={ingredient} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
