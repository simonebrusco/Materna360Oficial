'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { save, load } from '@/app/lib/persist'
import { toast } from '@/app/lib/toast'

export interface RoutineItem {
  id: string
  title: string
  description?: string
  frequency?: 'daily' | 'weekly' | 'monthly'
  completed: boolean
  lastCompletedDate?: string
  createdAt: string
}

interface RotinasDaMaeProps {
  storageKey?: string
}

const DEFAULT_ROUTINES: RoutineItem[] = [
  {
    id: '1',
    title: 'Momento de pausa para mim',
    description: '5-10 minutos de respiração ou meditação',
    frequency: 'daily',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Registrar humor e energia',
    description: 'Marque como você se sentiu hoje',
    frequency: 'daily',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Tempo de qualidade com os filhos',
    description: 'Pelo menos 20 minutos sem distrações',
    frequency: 'daily',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Revisar metas semanais',
    description: 'Refletir sobre o progresso da semana',
    frequency: 'weekly',
    completed: false,
    createdAt: new Date().toISOString(),
  },
]

export function RotinasDaMae({ storageKey = 'maternar:routines' }: RotinasDaMaeProps) {
  const [routines, setRoutines] = useState<RoutineItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRoutineTitle, setNewRoutineTitle] = useState('')
  const [newRoutineDescription, setNewRoutineDescription] = useState('')
  const [newRoutineFrequency, setNewRoutineFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    const saved = load<RoutineItem[]>(storageKey)
    if (Array.isArray(saved) && saved.length > 0) {
      setRoutines(saved)
    } else {
      setRoutines(DEFAULT_ROUTINES)
      save(storageKey, DEFAULT_ROUTINES)
    }
  }, [storageKey])

  const handleToggleRoutine = (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    const updated = routines.map((routine) =>
      routine.id === id
        ? { ...routine, completed: !routine.completed, lastCompletedDate: !routine.completed ? today : routine.lastCompletedDate }
        : routine
    )
    setRoutines(updated)
    save(storageKey, updated)

    const routine = updated.find((r) => r.id === id)
    if (routine?.completed) {
      toast.success(`"${routine.title}" marcada como concluída!`)
    }
  }

  const handleAddRoutine = () => {
    if (!newRoutineTitle.trim()) {
      toast.danger('Por favor, digite o nome da rotina.', 'Atenção')
      return
    }

    const newRoutine: RoutineItem = {
      id: Date.now().toString(),
      title: newRoutineTitle,
      description: newRoutineDescription || undefined,
      frequency: newRoutineFrequency,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    const updated = [...routines, newRoutine]
    setRoutines(updated)
    save(storageKey, updated)

    setNewRoutineTitle('')
    setNewRoutineDescription('')
    setNewRoutineFrequency('daily')
    setShowAddForm(false)
    toast.success('Rotina adicionada com sucesso!')
  }

  const handleDeleteRoutine = (id: string) => {
    const updated = routines.filter((r) => r.id !== id)
    setRoutines(updated)
    save(storageKey, updated)
    toast.success('Rotina removida.')
  }

  const completedCount = routines.filter((r) => r.completed).length
  const progressPercent = routines.length > 0 ? (completedCount / routines.length) * 100 : 0

  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return 'Diária'
      case 'weekly':
        return 'Semanal'
      case 'monthly':
        return 'Mensal'
      default:
        return 'Diária'
    }
  }

  const getFrequencyColor = (frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-700'
      case 'weekly':
        return 'bg-purple-100 text-purple-700'
      case 'monthly':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-support-1">Progresso do dia</h4>
          <span className="text-xs text-support-2">{completedCount} de {routines.length}</span>
        </div>
        <div className="h-2 bg-support-3/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Routines List */}
      <div className="space-y-2">
        {routines.length > 0 ? (
          routines.map((routine) => (
            <div
              key={routine.id}
              className={`rounded-2xl border p-3 shadow-soft transition-all ${
                routine.completed
                  ? 'bg-green-50/50 border-green-200/40'
                  : 'bg-white/50 border-white/40 hover:shadow-elevated'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleRoutine(routine.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    routine.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-support-3/40 hover:border-primary'
                  }`}
                >
                  {routine.completed && (
                    <AppIcon name="check" size={12} className="text-white" decorative />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4
                      className={`font-semibold text-sm ${
                        routine.completed ? 'text-support-3 line-through' : 'text-support-1'
                      }`}
                    >
                      {routine.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="text-support-3 hover:text-support-1 transition-colors flex-shrink-0"
                      title="Remover rotina"
                    >
                      <AppIcon name="x" size={16} decorative />
                    </button>
                  </div>

                  {routine.description && (
                    <p className="text-xs text-support-2 mb-2">{routine.description}</p>
                  )}

                  <span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${getFrequencyColor(routine.frequency)}`}>
                    {getFrequencyLabel(routine.frequency)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-support-3/40 bg-white/40 px-4 py-6 text-center">
            <AppIcon name="list" size={24} className="text-support-3 mx-auto mb-2" decorative />
            <p className="text-xs text-support-2">Nenhuma rotina definida ainda.</p>
          </div>
        )}
      </div>

      {/* Add Routine Form */}
      {!showAddForm && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <AppIcon name="plus" size={16} decorative />
          Adicionar Rotina
        </Button>
      )}

      {showAddForm && (
        <div className="rounded-2xl bg-white/50 border border-white/40 p-4 space-y-3">
          <input
            type="text"
            value={newRoutineTitle}
            onChange={(e) => setNewRoutineTitle(e.target.value)}
            placeholder="Nome da rotina"
            className="w-full rounded-lg border border-white/40 bg-white/70 px-3 py-2 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <textarea
            value={newRoutineDescription}
            onChange={(e) => setNewRoutineDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full rounded-lg border border-white/40 bg-white/70 px-3 py-2 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            rows={2}
          />

          <select
            value={newRoutineFrequency}
            onChange={(e) => setNewRoutineFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="w-full rounded-lg border border-white/40 bg-white/70 px-3 py-2 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddRoutine}
              className="flex-1"
            >
              Salvar
            </Button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-primary bg-white/40 hover:bg-white/60 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
