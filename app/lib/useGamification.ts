import { useState, useCallback, useEffect } from 'react'

export type BadgeType =
  | 'first-step'
  | 'meditation-master'
  | 'organized-home'
  | 'caring-mom'
  | 'creative-action'
  | 'dedicated-reader'

export interface Badge {
  type: BadgeType
  emoji: string
  title: string
  description: string
  unlockedAt?: Date
}

export interface GamificationState {
  level: number
  xp: number
  xpToNextLevel: number
  streak: number
  totalPoints: number
  badges: Badge[]
  weeklyGoals: {
    selfCare: number
    childActivities: number
    housework: number
    familyConnection: number
  }
  weeklyGoalsTarget: number
}

const BADGE_DEFINITIONS: Record<BadgeType, Omit<Badge, 'unlockedAt'>> = {
  'first-step': {
    type: 'first-step',
    emoji: '👣',
    title: 'Primeiro Passo',
    description: 'Complete uma atividade',
  },
  'meditation-master': {
    type: 'meditation-master',
    emoji: '🧘',
    title: 'Mestre da Meditação',
    description: 'Meditou 10x',
  },
  'organized-home': {
    type: 'organized-home',
    emoji: '🏡',
    title: 'Casa Organizada',
    description: '20 tarefas completas',
  },
  'caring-mom': {
    type: 'caring-mom',
    emoji: '💛',
    title: 'Mãe Cuidadora',
    description: '30 momentos registrados',
  },
  'creative-action': {
    type: 'creative-action',
    emoji: '🎨',
    title: 'Criatividade em Ação',
    description: '10 atividades criadas',
  },
  'dedicated-reader': {
    type: 'dedicated-reader',
    emoji: '📚',
    title: 'Leitora Dedicada',
    description: '5 livros lidos',
  },
}

const XP_PER_LEVEL = 500
const MAX_LEVEL = 10
const MAX_XP_CAP = XP_PER_LEVEL * MAX_LEVEL

export function useGamification(initialState?: Partial<GamificationState>) {
  const [state, setState] = useState<GamificationState>(() => {
    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem('gamification-state')
        : null
    if (stored) {
      return JSON.parse(stored)
    }
    return {
      level: 5,
      xp: 450,
      xpToNextLevel: 500,
      streak: 7,
      totalPoints: 2450,
      badges: Object.values(BADGE_DEFINITIONS).map((b) => ({
        ...b,
        unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      })),
      weeklyGoals: {
        selfCare: 75,
        childActivities: 60,
        housework: 85,
        familyConnection: 70,
      },
      weeklyGoalsTarget: 100,
      ...initialState,
    }
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamification-state', JSON.stringify(state))
    }
  }, [state])

  const addXp = useCallback(
    (amount: number) => {
      setState((prev) => {
        let newXp = Math.min(prev.xp + amount, MAX_XP_CAP)
        let newLevel = prev.level
        let newXpToNextLevel = prev.xpToNextLevel

        while (newXp >= XP_PER_LEVEL && newLevel < MAX_LEVEL) {
          newXp -= XP_PER_LEVEL
          newLevel += 1
          newXpToNextLevel = XP_PER_LEVEL
        }

        if (newLevel > prev.level) {
          newXpToNextLevel = Math.max(0, XP_PER_LEVEL - newXp)
        } else {
          newXpToNextLevel = Math.max(0, XP_PER_LEVEL - newXp)
        }

        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          xpToNextLevel: newXpToNextLevel,
          totalPoints: prev.totalPoints + amount,
        }
      })
    },
    []
  )

  const incrementStreak = useCallback(() => {
    setState((prev) => ({
      ...prev,
      streak: prev.streak + 1,
    }))
  }, [])

  const unlockBadge = useCallback((badgeType: BadgeType) => {
    setState((prev) => {
      const hasBadge = prev.badges.some((b) => b.type === badgeType)
      if (hasBadge) return prev

      const badgeDef = BADGE_DEFINITIONS[badgeType]
      return {
        ...prev,
        badges: [
          ...prev.badges,
          {
            ...badgeDef,
            unlockedAt: new Date(),
          },
        ],
      }
    })
  }, [])

  const updateWeeklyGoal = useCallback(
    (goal: keyof GamificationState['weeklyGoals'], value: number) => {
      setState((prev) => ({
        ...prev,
        weeklyGoals: {
          ...prev.weeklyGoals,
          [goal]: Math.min(Math.max(0, value), prev.weeklyGoalsTarget),
        },
      }))
    },
    []
  )

  const resetWeeklyGoals = useCallback(() => {
    setState((prev) => ({
      ...prev,
      weeklyGoals: {
        selfCare: 0,
        childActivities: 0,
        housework: 0,
        familyConnection: 0,
      },
    }))
  }, [])

  return {
    ...state,
    addXp,
    incrementStreak,
    unlockBadge,
    updateWeeklyGoal,
    resetWeeklyGoals,
    levelProgress: Math.round((state.xp / state.xpToNextLevel) * 100),
  }
}
