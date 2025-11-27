'use client'

import React, { useMemo, useState } from 'react'
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
  onItemDone?: (params: {
    id: string
    source: 'legacy' | 'planner'
    raw?: PlannerSavedContent | null
  }) => void
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

type CombinedItem = {
  id: string
  title: string
  description: string
  tag: string
  source: 'legacy' | 'planner'
  raw: PlannerSavedContent | null
  href?: string
}

export default function SavedContentsSection({
  contents,
  plannerContents = [],
  onItemClick,
  onItemDone,
  hideTitle = false,
}: SavedContentsSectionProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Junta conteúdos legados + conteúdos do planner
  const combined: CombinedItem[] = useMemo(
    () => [
      ...contents.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description ?? '',
        tag: item.type ? typeLabels[item.type] ?? 'CONTEÚDO' : 'CONTEÚDO',
        source: 'legacy' as const,
        raw: null,
        href: item.href,
      })),
      ...plannerContents.map(item => {
        const anyItem = item as any
        const payload = anyItem.payload ?? {}

        const description =
          anyItem.description ??
          payload.preview ??
          payload.description ??
          payload.text ??
          payload.excerpt ??
          ''

        return {
          id: item.id,
          title: item.title,
          description: description ?? '',
          tag: plannerTypeLabels[item.type] ?? 'CONTEÚDO',
          source: 'planner' as const,
          raw: item,
          href: undefined as string | undefined,
        }
      }),
    ],
    [contents, plannerContents],
  )

  const visibleItems = combined.filter(
    item => !dismissedIds.includes(item.id),
  )

  // Máximo de 8 cards visíveis (4 x 2)
  const MAX_VISIBLE = 8
  const limitedItems =
    visibleItems.length > MAX_VISIBLE
      ? visibleItems.slice(0, MAX_VISIBLE)
      : visibleItems

  const handleDone = (item: CombinedItem) => {
    setDismissedIds(prev =>
      prev.includes(item.id) ? prev : [...prev, item.id],
    )

    if (onItemDone) {
      onItemDone({
        id: item.id,
        source: item.source,
        raw: item.raw,
      })
    }
  }

  const handleClick = (item: CombinedItem) => {
    if (item.source === 'planner' && item.raw && onItemClick) {
      onItemClick(item.raw)
      return
    }

    if (item.source === 'legacy' && item.href) {
      window.location.href = item.href
    }
  }

  const renderCard = (item: CombinedItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => handleClick(item)}
      className="group relative flex h-full flex-col rounded-2xl border border-[#FFE8F2] bg-white/90 px-3 py-3 text-left shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] md:px-4 md:py-4"
    >
      {/* Botão 'feito' */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          handleDone(item)
        }}
        className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full border border-[var(--color-soft-strong)] bg-white/90 p-1.5 text-[10px] font-medium text-[var(--color-brand)] shadow-sm transition-colors hover:bg-[var(--color-brand)] hover:text-white"
        aria-label="Marcar como feito"
      >
        <AppIcon name="check" className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-2.5 pr-5">
        <div className="mt-0.5 shrink-0">
          <AppIcon
            name={item.source === 'planner' ? 'target' : 'bookmark'}
            className="h-4 w-4 text-[var(--color-brand)] md:h-5 md:w-5"
          />
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-[#FFE8F2]/60 px-2 py-0.5 text-[9px] font-medium text-[#C2285F] md:text-[10px]">
            {item.tag}
          </span>

          <p className="mt-1.5 mb-1 text-[13px] font-semibold leading-snug text-[var(--color-text-main)] md:text-sm line-clamp-2">
            {item.title}
          </p>

          {item.description && (
            <p className="text-[11px] text-[var(--color-text-muted)] md:text-xs line-clamp-3">
              {item.description}
            </p>
          )}

          {item.source === 'planner' && onItemClick && (
            <p className="mt-1 text-[10px] text-[var(--color-brand)]/80 md:text-[11px]">
              Toque para ver mais detalhes desse conteúdo.
            </p>
          )}
        </div>
      </div>
    </button>
  )

  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-main)] md:text-xl">
            <AppIcon
              name="bookmark"
              className="h-4 w-4 text-[var(--color-brand)]"
            />
            Inspirações &amp; conteúdos salvos
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]/70 md:text-sm">
            Receitas, ideias, brincadeiras e conteúdos que você guardou para
            deixar seu dia mais leve.
          </p>
        </div>
      )}

      <SoftCard className="rounded-3xl border border-[var(--color-soft-strong)] bg-white/95 p-4 shadow-[0_10px_26px_rgba(0,0,0,0.06)] md:p-5">
        {limitedItems.length === 0 ? (
          <p className="text-center text-xs text-[var(--color-text-muted)] md:text-sm">
            Ainda não tem nada por aqui — e está tudo bem. Quando você salvar
            receitas, ideias ou brincadeiras nos mini-hubs, elas aparecem aqui.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {limitedItems.map(renderCard)}
          </div>
        )}
      </SoftCard>
    </div>
  )
}
