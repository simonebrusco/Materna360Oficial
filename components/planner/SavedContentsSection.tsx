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

// Helpers para pegar origem / data sem quebrar o tipo
function getPlannerOrigin(item: PlannerSavedContent): string | undefined {
  return (item as any).originLabel ?? (item as any).origin
}

function getPlannerExtra(item: PlannerSavedContent): string | undefined {
  // se um dia você adicionar createdAt / savedAt, é só adaptar aqui
  return (item as any).metaLabel
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
            <AppIcon
              name="bookmark"
              className="w-4 h-4 text-[var(--color-brand)]"
            />
            Inspirações & conteúdos salvos
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]/70 mt-0.5">
            Receitas, ideias, brincadeiras e frases que você guardou para voltar
            quando precisar.
          </p>
        </div>
      )}

      {/* Kanban 2 x N com scroll horizontal */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        <div className="grid grid-rows-2 auto-flow-col gap-4 md:gap-5 min-w-max pb-1">
          {/* Legacy saved contents (useSavedInspirations) */}
          {contents.map((content) => (
            <Link
              key={content.id}
              href={content.href || '#'}
              className="flex-shrink-0 w-[240px] h-[140px] flex flex-col p-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[10px] font-semibold text-[var(--color-brand)] uppercase tracking-wide w-fit">
                {typeLabels[content.type]}
              </span>

              <p className="text-sm font-semibold text-[var(--color-text-main)] line-clamp-2 mt-2 flex-1">
                {content.title}
              </p>

              <p className="text-[10px] text-[var(--color-text-muted)]/70 mt-1">
                Salvo em <span className="font-medium">{content.origin}</span>
              </p>
            </Link>
          ))}

          {/* Planner saved contents (usePlannerSavedContents) */}
          {plannerContents.map((item) => {
            const origin = getPlannerOrigin(item)
            const extra = getPlannerExtra(item)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick?.(item)}
                className="flex-shrink-0 w-[240px] h-[140px] flex flex-col p-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer text-left group"
              >
                <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[10px] font-semibold text-[var(--color-brand)] uppercase tracking-wide w-fit">
                  {plannerTypeLabels[item.type] ?? 'CONTEÚDO'}
                </span>

                <p className="text-sm font-semibold text-[var(--color-text-main)] line-clamp-2 mt-2 flex-1">
                  {item.title}
                </p>

                {(origin || extra) && (
                  <p className="text-[10px] text-[var(--color-text-muted)]/70 mt-1">
                    {origin && (
                      <>
                        Salvo em{' '}
                        <span className="font-medium">{origin}</span>
                      </>
                    )}
                    {origin && extra && ' • '}
                    {extra && <span>{extra}</span>}
                  </p>
                )}
              </button>
            )
          })}

          {/* Card "Ver tudo" */}
          <Link
            href="/descobrir/salvos"
            className="flex-shrink-0 w-[240px] h-[140px] flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] hover:border-[var(--color-brand)] hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <AppIcon
              name="plus"
              className="w-5 h-5 text-[var(--color-text-muted)]/50 group-hover:text-[var(--color-brand)] transition-colors"
            />
            <p className="text-xs font-semibold text-[var(--color-text-muted)]/60 group-hover:text-[var(--color-brand)] transition-colors mt-1.5 uppercase tracking-wide">
              Ver tudo
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
