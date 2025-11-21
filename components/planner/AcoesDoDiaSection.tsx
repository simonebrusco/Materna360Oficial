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
        <AppIcon name="check-circle" className="w-5 h-5 text-[#ff005e]" />
        <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">Ações do Dia</h2>
        <span className="text-xs font-medium bg-[#f5f5f5] text-[#545454] px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* High Priority Section */}
      {highPriority.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#ff005e] uppercase tracking-wide">Prioridade Alta</p>
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
          {highPriority.length > 0 && <p className="text-xs font-semibold text-[#545454]/50 uppercase tracking-wide mt-4">Outras Ações</p>}
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
            className="inline-flex items-center gap-2 text-sm font-medium text-[#ff005e] hover:text-[#ff005e]/80 transition-colors"
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
              className="flex-1 px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
              autoFocus
            />
            <button
              onClick={handleAddTask}
              className="px-3 py-2 bg-[#ff005e] text-white rounded-lg text-sm font-medium hover:bg-[#ff005e]/90 transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewTaskTitle('')
              }}
              className="px-3 py-2 bg-[#f5f5f5] text-[#545454] rounded-lg text-sm font-medium hover:bg-[#e5e5e5] transition-colors"
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
          ? 'bg-[#f5f5f5] border-[#ddd]'
          : 'bg-white border-[#ddd] hover:border-[#ff005e]/30'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
          task.done
            ? 'bg-[#ff005e] border-[#ff005e]'
            : 'border-[#ddd] hover:border-[#ff005e]'
        }`}
      >
        {task.done && <AppIcon name="check" className="w-4 h-4 text-white" />}
      </button>

      {/* Task Title */}
      <span
        className={`flex-1 text-sm font-medium transition-all ${
          task.done
            ? 'text-[#545454]/50 line-through'
            : 'text-[#2f3a56]'
        }`}
      >
        {task.title}
      </span>

      {/* Priority Toggle */}
      <button
        onClick={() => onTogglePriority(task.id)}
        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
          task.priority === 'alta'
            ? 'bg-[#ff005e]/10 text-[#ff005e]'
            : 'bg-[#f5f5f5] text-[#545454]/60 hover:bg-[#ff005e]/5'
        }`}
      >
        {task.priority === 'alta' ? '⭐ Alta' : 'Normal'}
      </button>
    </div>
  )
}
