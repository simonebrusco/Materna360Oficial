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
  /**
   * Chamado quando um conteúdo é marcado como concluído / descartado.
   * source: 'planner' | 'legacy'
   */
  onItemDone?: (args: { id: string; source: 'planner' | 'legacy' }) => void
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

// Mapeia origem técnica -> rótulo amigável para a mãe
const plannerOriginLabels: Record<string, string> = {
  'como-estou-hoje': 'Como Estou Hoje',
  'rotina-leve': 'Rotina Leve',
  'autocuidado-inteligente': 'Autocuidado Inteligente',
  'cuidar-com-amor': 'Cuidar com Amor',
  'minhas-conquistas': 'Minhas Conquistas',
  'biblioteca-materna': 'Biblioteca Materna',
  'meu-dia': 'Meu Dia',
}

// Helpers para pegar origem / meta sem quebrar tipagem
function getPlannerOrigin(item: PlannerSavedContent): string | undefined {
  const anyItem = item as any
  if (anyItem.originLabel) return anyItem.originLabel
  const origin = anyItem.origin as string | undefined
  if (!origin) return undefined
  return plannerOriginLabels[origin] ?? origin.replace(/-/g, ' ')
}

function getPlannerExtra(item: PlannerSavedContent): string | undefined {
  // Prioriza metaLabel se já existir
  const anyItem = item as any
  if (anyItem.metaLabel) return anyItem.metaLabel as string

  // Caso contrário, usa createdAt para um rótulo simples
  if (item.createdAt) {
    try {
      const date = new Date(item.createdAt)
      const today = new Date()
      const diffMs = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Salvo hoje'
      if (diffDays === 1) return 'Salvo ontem'
      return `Salvo em ${new Date(item.createdAt).toLocaleDateString('pt-BR')}`
    } catch {
      return undefined
    }
  }

  return undefined
}

// Agrupamento em “colunas kanban”
type KanbanColumnId =
  | 'legacy'
  | 'inspirations'
  | 'recipes'
  | 'checklists'
  | 'goals'
  | 'others'

type KanbanColumn = {
  id: KanbanColumnId
  eyebrow: string
  title: string
  description: string
  // Filtros de tipo para plannerContents
  types?: string[]
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'legacy',
    eyebrow: 'DO CLUBE',
    title: 'Favoritos do Clube',
    description:
      'Conteúdos que você salvou direto de artigos, histórias e inspirações do Materna360.',
  },
  {
    id: 'inspirations',
    eyebrow: 'INSPIRAÇÕES',
    title: 'Inspirações & frases',
    description:
      'Insights, notas e lembretes que tocam o coração e ajudam a trazer leveza.',
    types: ['insight', 'note'],
  },
  {
    id: 'recipes',
    eyebrow: 'ROTINA & COMIDINHAS',
    title: 'Receitas & ideias de rotina',
    description:
      'Sugestões da Rotina Leve e outras ideias práticas que você guardou.',
    types: ['recipe'],
  },
  {
    id: 'checklists',
    eyebrow: 'ORGANIZAÇÃO',
    title: 'Checklists & tarefas',
    description:
      'Listas, tarefas e lembretes que te ajudam a não esquecer o que importa.',
    types: ['checklist', 'task'],
  },
  {
    id: 'goals',
    eyebrow: 'PLANOS',
    title: 'Metas & eventos',
    description:
      'Metas e momentos especiais que você planejou com carinho.',
    types: ['goal', 'event'],
  },
  {
    id: 'others',
    eyebrow: 'OUTROS',
    title: 'Outros conteúdos',
    description:
      'Tudo que não se encaixa nas categorias acima, mas que continua importante.',
  },
]

export default function SavedContentsSection({
  contents,
  plannerContents = [],
  onItemClick,
  onItemDone,
  hideTitle = false,
}: SavedContentsSectionProps) {
  const hasLegacyContents = contents.length > 0
  const hasPlannerContents = plannerContents.length > 0

  if (!hasLegacyContents && !hasPlannerContents) {
    return null
  }

  // Separa plannerContents por coluna de tipos
  const plannerByColumn: Record<KanbanColumnId, PlannerSavedContent[]> = {
    legacy: [], // não usamos planner aqui, apenas contents
    inspirations: [],
    recipes: [],
    checklists: [],
    goals: [],
    others: [],
  }

  plannerContents.forEach(item => {
    const type = item.type
    const column = KANBAN_COLUMNS.find(
      col => col.types && col.types.includes(type),
    )

    if (column) {
      plannerByColumn[column.id].push(item)
    } else {
      plannerByColumn.others.push(item)
    }
  })

  const showLegacyColumn = hasLegacyContents
  const showAnyPlannerColumn = Object.values(plannerByColumn).some(
    list => list.length > 0,
  )

  return (
    <div className="space-y-4">
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
            Aqui ficam as ideias, receitas, frases e lembretes que você decidiu
            guardar com carinho para revisar quando precisar.
          </p>
        </div>
      )}

      {/* Kanban horizontal */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        <div className="flex gap-4 md:gap-5 min-w-max pb-1">
          {KANBAN_COLUMNS.map(column => {
            // Coluna de conteúdos legacy (useSavedInspirations)
            if (column.id === 'legacy') {
              if (!showLegacyColumn) return null

              return (
                <div
                  key={column.id}
                  className="flex-shrink-0 w-[260px] md:w-[280px] rounded-3xl border border-[var(--color-border-soft)] bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 flex flex-col"
                >
                  <div className="space-y-1 mb-3">
                    <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--color-brand)]">
                      {column.eyebrow}
                    </p>
                    <h4 className="text-sm md:text-base font-semibold text-[var(--color-text-main)]">
                      {column.title}
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-muted)]/80">
                      {column.description}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {contents.map(content => (
                      <div
                        key={content.id}
                        className="group rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)]/90 px-3 py-2.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-2.5 py-0.5 text-[9px] font-semibold text-[var(--color-brand)] uppercase tracking-wide">
                            {typeLabels[content.type]}
                          </span>

                          {onItemDone && (
                            <button
                              type="button"
                              onClick={() =>
                                onItemDone({
                                  id: content.id,
                                  source: 'legacy',
                                })
                              }
                              className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-[var(--color-border-soft)] text-[10px] text-[var(--color-text-muted)] hover:bg-[#FFE8F2] hover:text-[var(--color-brand)] transition-colors"
                              aria-label="Marcar conteúdo como concluído"
                            >
                              ✓
                            </button>
                          )}
                        </div>

                        <Link
                          href={content.href || '#'}
                          className="block"
                        >
                          <p className="text-[13px] font-semibold text-[var(--color-text-main)] line-clamp-2">
                            {content.title}
                          </p>
                          <p className="text-[10px] text-[var(--color-text-muted)]/70 mt-1">
                            Salvo em{' '}
                            <span className="font-medium">
                              {content.origin}
                            </span>
                          </p>
                        </Link>
                      </div>
                    ))}

                    {contents.length === 0 && (
                      <p className="text-[11px] text-[var(--color-text-muted)]/70">
                        Assim que você salvar conteúdos nos hubs do Clube,
                        eles aparecem aqui.
                      </p>
                    )}
                  </div>
                </div>
              )
            }

            // Colunas baseadas em plannerContents
            const items = plannerByColumn[column.id]

            // Se nenhuma coluna planner tem conteúdo e essa coluna está vazia, podemos esconder todas
            if (!showAnyPlannerColumn && items.length === 0) {
              return null
            }

            // Se houver plannerContents no geral, mostramos todas as colunas principais,
            // mesmo vazias, com texto de estado, para a mãe entender a organização.
            const showEmptyState = items.length === 0

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-[260px] md:w-[280px] rounded-3xl border border-[var(--color-border-soft)] bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 flex flex-col"
              >
                <div className="space-y-1 mb-3">
                  <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--color-brand)]">
                    {column.eyebrow}
                  </p>
                  <h4 className="text-sm md:text-base font-semibold text-[var(--color-text-main)]">
                    {column.title}
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)]/80">
                    {column.description}
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {showEmptyState && (
                    <p className="text-[11px] text-[var(--color-text-muted)]/70">
                      Quando você salvar conteúdos desse tipo nos hubs,
                      eles aparecem organizados aqui.
                    </p>
                  )}

                  {items.map(item => {
                    const origin = getPlannerOrigin(item)
                    const extra = getPlannerExtra(item)

                    return (
                      <div
                        key={item.id}
                        className="group rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)]/90 px-3 py-2.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-2.5 py-0.5 text-[9px] font-semibold text-[var(--color-brand)] uppercase tracking-wide">
                            {plannerTypeLabels[item.type] ?? 'CONTEÚDO'}
                          </span>

                          {onItemDone && (
                            <button
                              type="button"
                              onClick={() =>
                                onItemDone({
                                  id: item.id,
                                  source: 'planner',
                                })
                              }
                              className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-[var(--color-border-soft)] text-[10px] text-[var(--color-text-muted)] hover:bg-[#FFE8F2] hover:text-[var(--color-brand)] transition-colors"
                              aria-label="Marcar conteúdo como concluído"
                            >
                              ✓
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onItemClick?.(item)}
                          className="block text-left w-full"
                        >
                          <p className="text-[13px] font-semibold text-[var(--color-text-main)] line-clamp-2">
                            {item.title}
                          </p>

                          {(origin || extra) && (
                            <p className="text-[10px] text-[var(--color-text-muted)]/70 mt-1">
                              {origin && (
                                <>
                                  Salvo em{' '}
                                  <span className="font-medium">
                                    {origin}
                                  </span>
                                </>
                              )}
                              {origin && extra && ' • '}
                              {extra && <span>{extra}</span>}
                            </p>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Coluna final – “Ver tudo” */}
          <Link
            href="/descobrir/salvos"
            className="flex-shrink-0 w-[220px] md:w-[240px] rounded-3xl border-2 border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)]/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] hover:border-[var(--color-brand)] hover:-translate-y-[1px] transition-all flex flex-col items-center justify-center text-center px-4 py-6"
          >
            <AppIcon
              name='folder'
              className="w-6 h-6 text-[var(--color-text-muted)]/50 mb-1.5"
            />
            <p className="text-xs font-semibold text-[var(--color-text-muted)]/70 uppercase tracking-[0.16em]">
              Ver tudo
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]/70 mt-1.5">
              Acesse a visão completa de tudo que você já salvou no Materna360.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
