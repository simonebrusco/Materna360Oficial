'use client'

import React from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import type { PlannerSavedContent } from '@/app/hooks/usePlannerSavedContents'

type SavedContent = {
  id: string
  title: string
  type?: 'artigo' | 'receita' | 'ideia' | 'frase'
  origin?: string
  href?: string
  description?: string
}

type SavedContentsSectionProps = {
  contents: SavedContent[]
  plannerContents?: PlannerSavedContent[]
  onItemClick?: (item: PlannerSavedContent) => void
  hideTitle?: boolean
}

const typeLabels: Record<string, string> = {
  artigo: 'ARTIGO',
  receita: 'RECEITA',
  ideia: 'IDEIA',
  frase: 'FRASE',
}

const plannerTypeLabels: Record<string, string> = {
  recipe: 'RECEITA',
  checklist: 'CHECKLIST',
  insight: 'INSPIRAÇÃO',
  note: 'NOTA',
  task: 'TAREFA',
  goal: 'META',
  event: 'EVENTO',
}

export default function SavedContentsSection({
  contents,
  plannerContents = [],
  onItemClick,
  hideTitle = false,
}: SavedContentsSectionProps) {
  const hasLegacyContents = contents && contents.length > 0
  const hasPlannerContents = plannerContents && plannerContents.length > 0

  if (!hasLegacyContents && !hasPlannerContents) {
    return null
  }

  // junta tudo pra fazer o "kanban"
  const combined = [
    // Itens legados (useSavedInspirations)
    ...contents.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      tag: item.type ? typeLabels[item.type] ?? 'CONTEÚDO' : 'CONTEÚDO',
      source: 'legacy' as const,
      raw: null as PlannerSavedContent | null,
      href: item.href,
    })),
    // Itens novos do planner
    ...plannerContents.map(item => ({
      id: item.id,
      title: item.title,
      description: (item as any).description ?? '',
      tag: plannerTypeLabels[item.type] ?? 'CONTEÚDO',
      source: 'planner' as const,
      raw: item,
      href: undefined as string | undefined,
    })),
  ]

  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] flex items-center gap-2">
            <AppIcon
              name="bookmark"
              className="w-4 h-4 text-[var(--color-brand)]"
            />
            Inspirações &amp; conteúdos salvos
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]/70 mt-0.5">
            Receitas, ideias e frases que você guardou para usar no seu dia.
          </p>
        </div>
      )}

      <SoftCard className="rounded-3xl border border-[var(--color-soft-strong)] bg-white/95 shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {combined.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.source === 'planner' && item.raw && onItemClick) {
                  onItemClick(item.raw)
                }
                if (item.source === 'legacy' && item.href) {
                  // para os legados, deixamos a navegação por href opcional
                  window.location.href = item.href
                }
              }}
              className="group text-left rounded-2xl border border-[#FFE8F2] bg-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.04)] px-3 py-3 md:px-4 md:py-4 transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start gap-2.5 md:gap-3">
                <div className="mt-0.5">
                  <AppIcon
                    name={item.source === 'planner' ? 'target' : 'bookmark'}
                    className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-brand)]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm md:text-base font-semibold text-[var(--color-text-main)] truncate">
                      {item.title}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-[#FFE8F2]/60 px-2 py-0.5 text-[10px] md:text-xs font-medium text-[#C2285F] shrink-0">
                      {item.tag}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] md:text-xs text-[var(--color-text-muted)] line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  {item.source === 'planner' && onItemClick && (
                    <p className="mt-2 text-[10px] md:text-xs text-[var(--color-brand)]/80">
                      Toque para ver mais detalhes desse conteúdo.
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Card "Ver tudo" */}
          <Link
            href="/descobrir/salvos"
            className="flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border-soft)] bg-white/80 px-4 py-4 text-center text-xs md:text-sm font-semibold text-[var(--color-text-muted)]/70 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] hover:bg-white transition-all"
          >
            <div className="flex flex-col items-center gap-1.5">
              <AppIcon
                name="plus"
                className="w-5 h-5 text-[var(--color-text-muted)]/50"
              />
              <span className="uppercase tracking-wide">
                Ver tudo que você salvou
              </span>
            </div>
          </Link>
        </div>
      </SoftCard>
    </div>
  )
}
