'use client'

'use client'

import React, { useEffect, useState } from 'react'

import { HealthyRecipesSection as HealthyRecipesSectionInner } from '@/components/blocks/HealthyRecipes'

const LoadingCard = () => (
  <div className="h-40 animate-pulse rounded-2xl border border-white/60 bg-white/60" aria-hidden />
)

export default function HealthyRecipesSection() {
  const [shouldRenderInner, setShouldRenderInner] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let allowed = true

    try {
      const globalNamespace = (globalThis as Record<string, unknown> | undefined)?.materna360
      if (globalNamespace && typeof globalNamespace === 'object') {
        const flag = (globalNamespace as { recipesAllowed?: boolean }).recipesAllowed
        if (flag === false) {
          allowed = false
        }
      }

      const directFlag = (globalThis as Record<string, unknown> | undefined)?.__recipesAllowed
      if (directFlag === false) {
        allowed = false
      }
    } catch (error) {
      console.warn('[HealthyRecipesSection] Falha ao ler flags globais:', error)
    }

    setBlocked(!allowed)
    setShouldRenderInner(true)
  }, [])

  if (blocked) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft">
        <h3 className="text-base font-semibold text-support-1">Receitas para seu momento</h3>
        <p className="mt-2 text-sm text-support-2/80">
          Parece que as receitas personalizadas estão indisponíveis agora. Atualize o perfil no Eu360 ou tente novamente mais tarde.
        </p>
      </div>
    )
  }

  if (!shouldRenderInner) {
    return <LoadingCard />
  }

  return <HealthyRecipesSectionInner />
}
