export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
}

export interface UserProgress {
  userId: string
  totalPoints: number
  currentStreak: number
  badges: Badge[]
  level: number
  experiencePoints: number
}

export const calculateLevel = (experiencePoints: number): number => {
  return Math.floor(experiencePoints / 100) + 1
}

export const calculateProgress = (currentXP: number, nextLevelXP: number): number => {
  return (currentXP % 100) / 100
}

export const addPoints = (current: number, points: number): number => {
  return current + points
}

export const updateStreak = (lastActivityDate: Date): number => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastActivity = new Date(lastActivityDate)

  if (lastActivity.toDateString() === today.toDateString()) {
    return 0
  }

  if (lastActivity.toDateString() === yesterday.toDateString()) {
    return 1
  }

  return 0
}

export const badges: Badge[] = [
  {
    id: 'first-step',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira atividade',
    icon: '👣',
    unlocked: false,
  },
  {
    id: 'meditation-master',
    name: 'Mestre da Meditação',
    description: 'Complete 10 meditações',
    icon: '🧘',
    unlocked: false,
  },
  {
    id: 'organized-home',
    name: 'Casa Organizada',
    description: 'Complete 20 tarefas da casa',
    icon: '🏡',
    unlocked: false,
  },
  {
    id: 'caring-mother',
    name: 'Mãe Cuidadora',
    description: 'Registre 30 momentos com seus filhos',
    icon: '💛',
    unlocked: false,
  },
  {
    id: 'creative-activities',
    name: 'Criatividade em Ação',
    description: 'Crie 10 atividades para seus filhos',
    icon: '🎨',
    unlocked: false,
  },
]
