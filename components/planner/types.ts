cat > components/planner/types.ts << 'EOF'
export type PlannerTask = {
  id: string
  title?: string
  text?: string
  done?: boolean
  completed?: boolean
  date?: string
  time?: string
  priority?: boolean
  [key: string]: unknown
}

export type PlannerContent = {
  id: string
  title?: string
  text?: string
  type?: string
  url?: string
  source?: string
  createdAt?: string
  tags?: string[]
  [key: string]: unknown
}
EOF
