'use client'

import React, { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { PlannerTask } from './MeuDiaPremium'

interface AcoesDoDiaSectionProps {
  tasks: PlannerTask[]
  onToggle: (taskId: string) => void
  onTogglePriority: (taskId: string) => void
  onAddTask: (title: string) => void
}

const ORIGIN_LABELS: Record<PlannerTask['origin'], string> = {
  planner: 'Planner',
  rotina: 'Rotina',
  jornada: 'Jornada',
  autocuidado: 'Autocuidado',
  checkin: 'Check-in',
  carinho: 'Carinho',
  brincadeira: 'Brincadeira',
  biblioteca: 'Biblioteca',
}

export default function AcoesDoDiaSection({
  tasks,
  onToggle,
  onTogglePriority,
  onAddTask,
}: AcoesDoDiaSectionProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const highPriority = tasks.filter(t => t.priority === 'alta')
  const normalPriority = tasks.filter(t => t.priority === 'normal')

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle)
      setNewTaskTitle('')
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <AppIcon name="check-circle" className="w-5 h-5 text-[var(--color-brand)]" />
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-main)]">Ações do Dia</h2>
        <span className="text-xs font-medium bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* High Priority Section */}
      {highPriority.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-brand)] uppercase tracking-wide">Prioridade Alta</p>
          <div className="space-y-2">
            {highPriority.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onTogglePriority={onTogglePriority}
              />
            ))}
          </div>
        </div>
      )}

      {/* Normal Priority Section */}
      {normalPriority.length > 0 && (
        <div className="space-y-2">
          {highPriority.length > 0 && <p className="text-xs font-semibold text-[var(--color-text-muted)]/50 uppercase tracking-wide mt-4">Outras Ações</p>}
          <div className="space-y-2">
            {normalPriority.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onTogglePriority={onTogglePriority}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Task */}
      <div className="mt-4 pt-4 border-t border-[#ddd]">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar ação rápida
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Descreva a ação..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTask()
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
              autoFocus
            />
            <button
              onClick={handleAddTask}
              className="px-3 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-brand)]/90 transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewTaskTitle('')
              }}
              className="px-3 py-2 bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] rounded-lg text-sm font-medium hover:bg-[var(--color-soft-bg)]/80 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskItem({
  task,
  onToggle,
  onTogglePriority,
}: {
  task: PlannerTask
  onToggle: (taskId: string) => void
  onTogglePriority: (taskId: string) => void
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        task.done
          ? 'bg-[var(--color-soft-bg)] border-[#ddd]'
          : 'bg-white border-[#ddd] hover:border-[var(--color-brand)]/30'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
          task.done
            ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
            : 'border-[#ddd] hover:border-[var(--color-brand)]'
        }`}
      >
        {task.done && <AppIcon name="check" className="w-4 h-4 text-white" />}
      </button>

      {/* Task Title */}
      <span
        className={`flex-1 text-sm font-medium transition-all ${
          task.done
            ? 'text-[var(--color-text-muted)]/50 line-through'
            : 'text-[var(--color-text-main)]'
        }`}
      >
        {task.title}
      </span>

      {/* Priority Toggle */}
      <button
        onClick={() => onTogglePriority(task.id)}
        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
          task.priority === 'alta'
            ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
            : 'bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]/60 hover:bg-[var(--color-brand)]/5'
        }`}
      >
        {task.priority === 'alta' ? '⭐ Alta' : 'Normal'}
      </button>
    </div>
  )
}
