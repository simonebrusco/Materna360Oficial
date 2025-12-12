// components/planner/types.ts

export type PlannerTaskPriority = 'alta' | 'baixa'

export type PlannerTask = {
  id: string

  /**
   * Alguns lugares antigos podem usar "title" ou "text".
   * Mantemos ambos para compatibilidade.
   */
  title?: string
  text?: string

  /**
   * Existem variações no projeto (done / completed).
   * Mantemos as duas; a UI deve decidir qual usar.
   */
  done?: boolean
  completed?: boolean

  date?: string
  time?: string

  /**
   * IMPORTANTE:
   * A UI compara `task.priority === 'alta'`, então priority NÃO pode ser boolean.
   * Usamos string union.
   */
  priority?: PlannerTaskPriority

  /**
   * Mantém compatibilidade com dados legados sem quebrar typecheck.
   */
  [key: string]: unknown
}

export type PlannerContentType = 'artigo' | 'receita' | 'ideia' | 'trilha'

export type PlannerContent = {
  id: string

  title?: string
  text?: string

  /**
   * IMPORTANTE:
   * Record<PlannerContent['type'], ...> exige que type seja SEMPRE definido.
   * Se algum conteúdo antigo não tiver type, a UI deve aplicar fallback antes de renderizar.
   */
  type: PlannerContentType

  url?: string
  source?: string
  createdAt?: string
  tags?: string[]

  [key: string]: unknown
}
