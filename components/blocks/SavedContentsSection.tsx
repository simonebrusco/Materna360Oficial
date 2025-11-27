'use client'

import React, { useMemo, useState } from 'react'
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
  /**
   * Chamado quando a mãe marca um conteúdo como "feito" / tira da lista.
   * Você pode usar isso depois para remover do storage, se quiser.
   */
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
  const hasLegacyContents = contents && contents.length > 0
  const hasPlannerContents = plannerContents && plannerContents.length > 0

  if (!hasLegacyContents && !hasPlannerContents) {
    return null
  }

  const combined: CombinedItem[] = useMemo(
    () => [
      // Itens legados (useSavedInspirations)
      ...contents.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description ?? '',
        tag: item.type ? typeLabels[item.type] ?? 'CONTEÚDO' : 'CONTEÚDO',
        source: 'legacy' as const,
        raw: null,
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
    ],
    [contents, plannerContents],
  )

  // Controle local para esconder o card quando a mãe marca como "feito"
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const visibleItems = combined.filter(
    item => !dismissedIds.includes(item.id),
  )

  // Limitador de quantos aparecem ao mesmo tempo (se quiser reduzir a poluição visual)
  const MAX_VISIBLE = 10
  const limitedItems =
    visibleItems.length > MAX_VISIBLE
      ? visibleItems.slice(0, MAX_VISIBLE)
      : visibleItems

  // Divide em 2 faixas horizontais (tipo "kanban" de duas linhas)
  const lane1 = limitedItems.filter((_, index) => index % 2 === 0)
  const lane2 = limitedItems.filter((_, index) => index % 2 === 1)

  const handleDone = (item: CombinedItem) => {
    setDismissedIds(prev => (prev.includes(item.id) ? prev : [...prev, item.id]))

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
      className="group relative min-w-[160px] max-w-[200px] rounded-2xl border border-[#FFE8F2] bg-white/90 px-3 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)] text-left transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)]"
    >
      {/* Botão 'feito' */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          handleDone(item)
        }}
        className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full border border-[var(--color-soft-strong)] bg-white/90 p-1 text-[10px] font-medium text-[var(--color-brand)] shadow-sm hover:bg-[var(--color-brand)] hover:text-white transition-colors"
        aria-label="Marcar como feito"
      >
        <AppIcon name="check" className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-2.5 md:gap-3 pr-4">
        <div className="mt-0.5 shrink-0">
          <AppIcon
            name={item.source === 'planner' ? 'target' : 'bookmark'}
            className="h-4 w-4 md:h-5 md:w-5 text-[var(--color-brand)]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[var(--color-text-main)] md:text-base">
              {item.title}
            </p>
            <span className="shrink-0 inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-[#FFE8F2]/60 px-2 py-0.5 text-[10px] font-medium text-[#C2285F] md:text-xs">
              {item.tag}
            </span>
          </div>
          {item.description && (
            <p className="line-clamp-3 text-[11px] text-[var(--color-text-muted)] md:text-xs">
              {item.description}
            </p>
          )}
          {item.source === 'planner' && onItemClick && (
            <p className="mt-1.5 text-[10px] text-[var(--color-brand)]/80 md:text-xs">
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
          <div className="space-y-3">
            {/* Faixa 1 */}
            {lane1.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {lane1.map(renderCard)}
              </div>
            )}

            {/* Faixa 2 */}
            {lane2.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {lane2.map(renderCard)}
              </div>
            )}

            {/* CTA 'Ver tudo' */}
            <div className="pt-1">
              <Link
                href="/descobrir/salvos"
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border-soft)] bg-white/80 px-4 py-3 text-center text-xs font-semibold text-[var(--color-text-muted)]/80 transition-all hover:border-[var(--color-brand)] hover:bg-white hover:text-[var(--color-brand)] md:w-auto md:text-sm"
              >
                <div className="flex items-center gap-1.5">
                  <AppIcon
                    name="plus"
                    className="h-4 w-4 text-[var(--color-text-muted)]/60"
                  />
                  <span className="uppercase tracking-wide">
                    Ver tudo que você salvou
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </SoftCard>
    </div>
  )
}
