// components/planner/types.ts

export type PlannerTask = {
  id: string
  title: string
  done?: boolean
  time?: string
  note?: string
  icon?: string
  category?: string
  dateKey?: string
}
