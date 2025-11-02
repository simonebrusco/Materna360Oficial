'use client'

import { useEffect, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import type { FamilyRecipeSuggestion } from '@/data/healthyRecipesContent'

const STORAGE_KEY = 'recipes:unknown:expanded'

type FamilyRecipesToggleProps = {
  recipes: FamilyRecipeSuggestion[]
}

export function FamilyRecipesToggle({ recipes }: FamilyRecipesToggleProps) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setExpanded(true)
      }
    } catch {
      // ignore persistence errors silently
    }
  }, [])

  const handleToggle = () => {
    setExpanded((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
      } catch {
        // ignore persistence errors silently
      }
      return next
    })
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-300 ease-gentle hover:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
        aria-label="Ver ou esconder receitas para a família"
      >
        <span>Ver receitas para a família</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 transition-transform duration-300 ease-gentle ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={contentId}
        aria-hidden={!expanded}
        className={`overflow-hidden transition-all duration-500 ease-gentle ${
          expanded ? 'mt-4 max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <article
              key={recipe.id}
              className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft transition-transform duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <header className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-support-1">{recipe.title}</h3>
                <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-medium text-support-1">
                  {recipe.prepTime}
                </span>
              </header>
              <p className="mt-2 text-sm text-support-2/80">{recipe.description}</p>
              <ul className="mt-3 space-y-1 text-sm text-support-2/70">
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
    </div>
  )
}
