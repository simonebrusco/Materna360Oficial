'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { Reveal } from '@/components/ui/Reveal'
import PlannerHeader from './PlannerHeader'
import PlannerSummary from './PlannerSummary'
import AcoesDoDiaSection from './AcoesDoDiaSection'
import CuidarDeMimSection from './CuidarDeMimSection'
import CuidarDoMeuFilhoSection from './CuidarDoMeuFilhoSection'
import InspiracoesConteudosSection from './InspiracoesConteudosSection'

export type PlannerTask = {
  id: string
  title: string
  done: boolean
  priority: 'normal' | 'alta'
  origin: 'planner' | 'rotina' | 'jornada' | 'autocuidado' | 'checkin' | 'carinho' | 'brincadeira' | 'biblioteca'
  createdAt: string
  tags?: string[]
}

export type PlannerContent = {
  id: string
  title: string
  description?: string
  image?: string
  type: 'artigo' | 'receita' | 'ideia'
  origin: string
  savedAt: string
}

export type PlannerState = {
  tasks: PlannerTask[]
  contents: PlannerContent[]
  dayTag: 'leve' | 'focado' | 'produtivo' | 'slow' | null
  mood: 'happy' | 'okay' | 'stressed' | null
}

interface MeuDiaPremiumProps {
  currentDateKey?: string
}

export default function MeuDiaPremium({ currentDateKey = '' }: MeuDiaPremiumProps) {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')
  const [plannerState, setPlannerState] = useState<PlannerState>({
    tasks: [
      {
        id: '1',
        title: 'Planejar o dia',
        done: false,
        priority: 'alta',
        origin: 'planner',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Meditação matinal',
        done: false,
        priority: 'normal',
        origin: 'autocuidado',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Atividade com a criança',
        done: false,
        priority: 'alta',
        origin: 'brincadeira',
        createdAt: new Date().toISOString(),
      },
    ],
    contents: [
      {
        id: 'c1',
        title: 'Receita: Bolo saudável',
        type: 'receita',
        origin: 'biblioteca',
        savedAt: new Date().toISOString(),
      },
    ],
    dayTag: null,
    mood: null,
  })

  // Greeting based on time
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : 'Mãe'
    const timeGreeting = getTimeGreeting(firstName)
    setGreeting(timeGreeting)

    const interval = setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName)
      setGreeting(updatedGreeting)
    }, 60000)

    return () => clearInterval(interval)
  }, [name])

  // Get daily message
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length)
  const dailyMessage = DAILY_MESSAGES[dayIndex]

  // Task management
  const toggleTask = (taskId: string) => {
    setPlannerState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, done: !task.done } : task
      ),
    }))
  }

  const togglePriority = (taskId: string) => {
    setPlannerState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, priority: task.priority === 'alta' ? 'normal' : 'alta' }
          : task
      ),
    }))
  }

  const addTask = (title: string, origin: PlannerTask['origin'], priority: 'normal' | 'alta' = 'normal') => {
    const newTask: PlannerTask = {
      id: Math.random().toString(36).slice(2, 9),
      title,
      done: false,
      priority,
      origin,
      createdAt: new Date().toISOString(),
    }
    setPlannerState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }))
  }

  // Group tasks by origin (section)
  const acoesDodia = plannerState.tasks.filter(t =>
    ['planner', 'rotina', 'jornada'].includes(t.origin)
  )
  const cuidarDeMim = plannerState.tasks.filter(t =>
    ['autocuidado', 'checkin'].includes(t.origin)
  )
  const cuidarDoMeuFilho = plannerState.tasks.filter(t =>
    ['carinho', 'brincadeira'].includes(t.origin)
  )

  const completedCount = plannerState.tasks.filter(t => t.done).length

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <Reveal delay={0}>
        <PlannerHeader greeting={greeting} onMoodSelect={mood => setPlannerState(prev => ({ ...prev, mood }))} />
      </Reveal>

      {/* Summary */}
      <Reveal delay={100}>
        <PlannerSummary completedCount={completedCount} totalCount={plannerState.tasks.length} dailyMessage={dailyMessage} />
      </Reveal>

      {/* Ações do Dia */}
      {acoesDodia.length > 0 && (
        <Reveal delay={200}>
          <AcoesDoDiaSection
            tasks={acoesDodia}
            onToggle={toggleTask}
            onTogglePriority={togglePriority}
            onAddTask={(title) => addTask(title, 'planner')}
          />
        </Reveal>
      )}

      {/* Cuidar de Mim */}
      {cuidarDeMim.length > 0 && (
        <Reveal delay={300}>
          <CuidarDeMimSection
            tasks={cuidarDeMim}
            onToggle={toggleTask}
            onTogglePriority={togglePriority}
            onAddTask={(title) => addTask(title, 'autocuidado')}
          />
        </Reveal>
      )}

      {/* Cuidar do Meu Filho */}
      {cuidarDoMeuFilho.length > 0 && (
        <Reveal delay={400}>
          <CuidarDoMeuFilhoSection
            tasks={cuidarDoMeuFilho}
            onToggle={toggleTask}
            onTogglePriority={togglePriority}
            onAddTask={(title) => addTask(title, 'brincadeira')}
          />
        </Reveal>
      )}

      {/* Inspirações & Conteúdos */}
      {plannerState.contents.length > 0 && (
        <Reveal delay={500}>
          <InspiracoesConteudosSection contents={plannerState.contents} />
        </Reveal>
      )}
    </div>
  )
}
