'use client'

import React, { useState } from 'react'

import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'

import WeekView from './WeekView'
import { useWeeklyPlannerCore } from './WeeklyPlannerCore'

export default function WeeklyPlannerShell() {
  const planner = useWeeklyPlannerCore()

  // ✅ GUARDA DE SEGURANÇA — evita quebra de build
  if (!planner) return null

  const {
    selectedDate,
    plannerData,
    toggleTask,
    addTask,
    weekData,
  } = planner

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  return (
    <Reveal>
      <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">

        {/* ============================= */}
        {/* HEADER / TOGGLE */}
        {/* ============================= */}
        <SoftCard className="rounded-3xl p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold capitalize">
              {selectedDate.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'font-bold' : ''}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'font-bold' : ''}
              >
                Semana
              </button>
            </div>
          </div>
        </SoftCard>

        {/* ============================= */}
        {/* VISÃO DIA */}
        {/* ============================= */}
        {viewMode === 'day' && (
          <SoftCard className="rounded-3xl p-4 md:p-6 space-y-3">
            <h3 className="font-semibold text-base">
              Lembretes do dia
            </h3>

            {plannerData.tasks.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhum lembrete ainda.
              </p>
            )}

            {plannerData.tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full text-left flex items-center gap-3"
              >
                <span>{task.done ? '✓' : '○'}</span>
                <span className={task.done ? 'line-through' : ''}>
                  {task.title}
                </span>
              </button>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button onClick={() => addTask('Prioridade do dia', 'top3')}>
                Prioridades
              </button>
              <button onClick={() => addTask('Compromisso', 'agenda')}>
                Agenda
              </button>
              <button onClick={() => addTask('Cuidar de mim', 'selfcare')}>
                Cuidar de mim
              </button>
              <button onClick={() => addTask('Meu filho', 'family')}>
                Meu filho
              </button>
            </div>
          </SoftCard>
        )}

        {/* ============================= */}
        {/* VISÃO SEMANA */}
        {/* ============================= */}
        {viewMode === 'week' && (
          <WeekView weekData={weekData} />
        )}
      </div>
    </Reveal>
  )
}
