export type PlannerTask = {
  id: string

  // Alguns lugares usam title, outros usam text
  title?: string
  text?: string

  // compatibilidade entre telas antigas/novas
  done?: boolean
  completed?: boolean

  priority?: boolean | 'alta' | 'media' | 'baixa'

  date?: string
  time?: string
  note?: string
  icon?: string
  category?: string
  dateKey?: string

  // permite campos adicionais sem quebrar tipagem
  [key: string]: unknown
}

export type PlannerContent = {
  id: string
  title?: string
  description?: string
  url?: string
  source?: string
  origin?: string
  type: string
  createdAt?: string
  dateKey?: string
  tags?: string[]
  [key: string]: unknown
}
