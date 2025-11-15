'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/app/lib/telemetry'
import AppIcon from '@/components/ui/AppIcon'

interface MaternarHubItem {
  id: string
  title: string
  subtitle?: string
  iconName?: string
  targetId?: string
  href?: string
}

const HUB_ITEMS: MaternarHubItem[] = [
  {
    id: 'weekly-summary',
    title: 'Resumo da semana',
    subtitle: 'Visão geral do seu progresso',
    iconName: 'calendar',
    targetId: 'maternar-resumo-semana',
  },
  {
    id: 'maternal-habits',
    title: 'Hábitos maternos',
    subtitle: 'Pequenos gestos que transformam',
    iconName: 'heart',
    targetId: 'maternar-habitos-maternos',
  },
  {
    id: 'moments-with-child',
    title: 'Momentos com seu filho',
    subtitle: 'Cenas que valem a pena guardar',
    iconName: 'sparkles',
    targetId: 'maternar-momentos-filho',
  },
  {
    id: 'emotional-evolution',
    title: 'Sua evolução emocional',
    subtitle: 'Acompanhe seu crescimento',
    iconName: 'target',
    targetId: 'maternar-evolucao-emocional',
  },
  {
    id: 'mothers-journal',
    title: 'Diário da mãe',
    subtitle: 'Um espaço só seu',
    iconName: 'edit',
    targetId: 'maternar-diario-mae',
  },
  {
    id: 'premium-trails',
    title: 'Trilhas premium',
    subtitle: 'Caminhos guiados para você',
    iconName: 'crown',
    targetId: 'maternar-trilhas-premium',
  },
]

export default function MaternarScrollHub() {
  const router = useRouter()

  const handleClick = (item: MaternarHubItem) => {
    // Track the interaction
    track('maternar_hub_click', {
      itemId: item.id,
      action: item.href ? 'navigate' : 'scroll',
    })

    // Navigation to another tab
    if (item.href) {
      router.push(item.href)
      return
    }

    // Local scroll to section
    if (item.targetId && typeof window !== 'undefined') {
      const el = document.getElementById(item.targetId)
      if (!el) return

      const offset = 80 // Header height offset
      const y = el.getBoundingClientRect().top + window.scrollY - offset

      window.scrollTo({
        top: y,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6 md:py-8">
      <div className="mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-support-2">
          Navegação rápida
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {HUB_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            className="
              group relative flex flex-col items-center justify-center
              rounded-xl overflow-hidden
              border border-white/60 bg-white/80 backdrop-blur-sm
              shadow-sm hover:shadow-md
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
              p-3
              aspect-square
              text-center
            "
            aria-label={item.subtitle ? `${item.title}: ${item.subtitle}` : item.title}
          >
            <div className="flex flex-col items-center justify-center h-full gap-2">
              {item.iconName && (
                <div className="flex-shrink-0 mb-0.5">
                  <AppIcon
                    name={item.iconName}
                    size={22}
                    variant="brand"
                    decorative
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                <h3 className="text-sm font-semibold text-support-1 line-clamp-1 leading-tight">
                  {item.title}
                </h3>

                {item.subtitle && (
                  <p className="text-xs text-support-2 line-clamp-2 leading-snug">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
