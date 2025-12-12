export type PlannerTask = {
  id: string
  title?: string
  text?: string
  done?: boolean
  completed?: boolean
  date?: string
  time?: string
  [key: string]: unknown
}
