// components/planner/types.ts

export type PlannerTask = {
  id: string
  title: string

  // Compat: alguns componentes usam "done", outros usam "completed"
  done?: boolean
  completed?: boolean

  // Compat: algumas telas podem marcar prioridade
  priority?: boolean

  time?: string
  note?: string
  icon?: string
  category?: string
  dateKey?: string
}
