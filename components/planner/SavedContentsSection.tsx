'use client'

import React from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
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
  artigo: 'Artigo',
  receita: 'Receita',
  ideia: 'Ideia',
  frase: 'Frase',
}

const typeIcons: Record<SavedContent['type'], string> = {
  artigo: 'book-open',
  receita: 'star',
  ideia: 'idea',
  frase: 'sparkles',
}

const plannerTypeIcons: Record<string, string> = {
  recipe: 'star',
  checklist: 'list-check',
  insight: 'lightbulb',
  note: 'book-open',
  task: 'check-square',
  goal: 'target',
  event: 'calendar',
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
          <h3 className="text-lg md:text-base font-semibold text-[#2f3a56] flex items-center gap-2">
            <AppIcon name="bookmark" className="w-4 h-4 text-[#ff005e]" />
            Inspirações & conteúdos salvos
          </h3>
          <p className="text-xs md:text-sm text-[#545454]/70 mt-0.5">
            Receitas, ideias e frases que você guardou para usar no seu dia.
          </p>
        </div>
      )}

      <SoftCard className="p-5 md:p-6">
        <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0 pb-2">
          <div className="flex gap-3 min-w-min">
            {/* Legacy saved contents (from useSavedInspirations) */}
            {contents.map(content => (
              <Link
                key={content.id}
                href={content.href || '#'}
                className="flex-shrink-0 w-48 md:w-56 inline-flex items-start gap-2.5 p-4 md:p-5 rounded-lg border border-[#ddd] bg-white hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe3f0] flex items-center justify-center">
                  <AppIcon
                    name={typeIcons[content.type] as any}
                    className="w-3.5 h-3.5 text-[#ff005e]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff005e]/70">
                    {typeLabels[content.type]}
                  </span>
                  <p className="text-xs font-medium text-[#2f3a56] line-clamp-2 mt-1">
                    {content.title}
                  </p>
                </div>
              </Link>
            ))}

            {/* New planner saved contents (from usePlannerSavedContents) */}
            {plannerContents.map(item => (
              <button
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="flex-shrink-0 w-48 md:w-56 inline-flex items-start gap-2.5 p-4 md:p-5 rounded-lg border border-[#ddd] bg-white hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all text-left"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe3f0] flex items-center justify-center">
                  <AppIcon
                    name={plannerTypeIcons[item.type] || 'bookmark'}
                    className="w-3.5 h-3.5 text-[#ff005e]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff005e]/70">
                    {plannerTypeLabels[item.type] ?? 'CONTEÚDO'}
                  </span>
                  <p className="text-xs font-medium text-[#2f3a56] line-clamp-2 mt-1">
                    {item.title}
                  </p>
                </div>
              </button>
            ))}

            <Link
              href="/descobrir/salvos"
              className="flex-shrink-0 w-48 md:w-56 inline-flex items-center justify-center p-4 md:p-5 rounded-lg border-2 border-dashed border-[#ddd] bg-white hover:bg-[#fafafa] hover:border-[#ff005e] transition-all"
            >
              <div className="text-center space-y-1">
                <AppIcon name="plus" className="w-5 h-5 text-[#545454]/40 mx-auto" />
                <p className="text-[10px] font-medium text-[#545454]/60">
                  Ver tudo
                </p>
              </div>
            </Link>
          </div>
        </div>
      </SoftCard>
    </div>
  )
}
