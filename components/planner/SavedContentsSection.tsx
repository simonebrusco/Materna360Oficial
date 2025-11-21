'use client'

import React from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import { PlannerSavedContent } from '@/app/hooks/usePlannerSavedContents'

type SavedContent = {
  id: string
  title: string
  type: 'artigo' | 'receita' | 'ideia' | 'frase'
  origin: string
  href?: string
}

type SavedContentsSectionProps = {
  contents: SavedContent[]
  plannerContents?: PlannerSavedContent[]
  onItemClick?: (item: PlannerSavedContent) => void
  hideTitle?: boolean
}

const typeLabels: Record<SavedContent['type'], string> = {
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
  const hasLegacyContents = contents.length > 0
  const hasPlannerContents = plannerContents.length > 0

  if (!hasLegacyContents && !hasPlannerContents) {
    return null
  }

  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div>
          <h3 className="text-lg md:text-base font-semibold text-[var(--color-text-main)] flex items-center gap-2">
            <AppIcon name="bookmark" className="w-4 h-4 text-[var(--color-brand)]" />
            Inspira��ões & conteúdos salvos
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]/70 mt-0.5">
            Receitas, ideias e frases que você guardou para usar no seu dia.
          </p>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        <div className="flex gap-4 md:gap-5 min-w-min pb-1">
          {/* Legacy saved contents (from useSavedInspirations) */}
          {contents.map(content => (
            <Link
              key={content.id}
              href={content.href || '#'}
              className="flex-shrink-0 w-[280px] h-[130px] flex flex-col p-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)] uppercase w-fit">
                {typeLabels[content.type]}
              </span>
              <p className="text-sm font-semibold text-[var(--color-text-main)] line-clamp-2 mt-2 flex-1">
                {content.title}
              </p>
            </Link>
          ))}

          {/* New planner saved contents (from usePlannerSavedContents) */}
          {plannerContents.map(item => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="flex-shrink-0 w-[280px] h-[130px] flex flex-col p-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all cursor-pointer text-left group"
            >
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)] uppercase w-fit">
                {plannerTypeLabels[item.type] ?? 'CONTEÚDO'}
              </span>
              <p className="text-sm font-semibold text-[var(--color-text-main)] line-clamp-2 mt-2 flex-1">
                {item.title}
              </p>
            </button>
          ))}

          {/* Ver tudo link */}
          <Link
            href="/descobrir/salvos"
            className="flex-shrink-0 w-[280px] h-[130px] flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.09)] hover:border-[var(--color-brand)] hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <AppIcon name="plus" className="w-5 h-5 text-[var(--color-text-muted)]/50 group-hover:text-[var(--color-brand)] transition-colors" />
            <p className="text-xs font-semibold text-[var(--color-text-muted)]/60 group-hover:text-[var(--color-brand)] transition-colors mt-1.5 uppercase tracking-wide">
              Ver tudo
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
