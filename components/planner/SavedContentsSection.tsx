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
          <h3 className="text-lg md:text-base font-semibold text-[#2f3a56] flex items-center gap-2">
            <AppIcon name="bookmark" className="w-4 h-4 text-[#ff005e]" />
            Inspirações & conteúdos salvos
          </h3>
          <p className="text-xs md:text-sm text-[#545454]/70 mt-0.5">
            Receitas, ideias e frases que você guardou para usar no seu dia.
          </p>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 min-w-min md:min-w-0 auto-cols-max md:auto-cols-fr">
          {/* Legacy saved contents (from useSavedInspirations) */}
          {contents.map(content => (
            <Link
              key={content.id}
              href={content.href || '#'}
              className="w-40 md:w-64 lg:w-72 h-40 md:h-48 flex flex-col p-4 md:p-5 rounded-2xl border border-gray-100/60 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[10px] md:text-xs font-semibold tracking-wide text-[#ff005e] uppercase w-fit">
                {typeLabels[content.type]}
              </span>
              <p className="text-sm md:text-base font-semibold text-[#2f3a56] line-clamp-3 mt-2 flex-1 group-hover:text-[#ff005e] transition-colors">
                {content.title}
              </p>
            </Link>
          ))}

          {/* New planner saved contents (from usePlannerSavedContents) */}
          {plannerContents.map(item => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="w-40 md:w-64 lg:w-72 h-40 md:h-48 flex flex-col p-4 md:p-5 rounded-2xl border border-gray-100/60 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer text-left group"
            >
              <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[10px] md:text-xs font-semibold tracking-wide text-[#ff005e] uppercase w-fit">
                {plannerTypeLabels[item.type] ?? 'CONTEÚDO'}
              </span>
              <p className="text-sm md:text-base font-semibold text-[#2f3a56] line-clamp-3 mt-2 flex-1 group-hover:text-[#ff005e] transition-colors">
                {item.title}
              </p>
            </button>
          ))}

          {/* Ver tudo link */}
          <Link
            href="/descobrir/salvos"
            className="w-40 md:w-64 lg:w-72 h-40 md:h-48 flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 hover:border-[#ff005e] hover:bg-[#ffd8e6]/10 transition-all cursor-pointer group"
          >
            <AppIcon name="plus" className="w-6 h-6 text-[#545454]/40 group-hover:text-[#ff005e] transition-colors" />
            <p className="text-[11px] md:text-xs font-semibold text-[#545454]/60 group-hover:text-[#ff005e] transition-colors mt-2 uppercase tracking-wide">
              Ver tudo
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
