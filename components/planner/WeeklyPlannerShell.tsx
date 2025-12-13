'use client'

import React, { useState } from 'react'

import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'

import WeekView from './WeekView'
import { useWeeklyPlannerCore } from './WeeklyPlannerCore'

/* ======================================================
   SHELL — UI + ORQUESTRAÇÃO
====================================================== */
export default function WeeklyPlannerShell() {
  const {
    selectedDate,
    selectDate,
    plannerData,
    toggleTask,
    addTask,
    weekData,
  } = useWeeklyPlannerCore()

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  return (
    <Reveal>
      <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">

        {/* ============================= */}
        {/* CALENDÁRIO + TOGGLE */}
        {/* ============================= */}
        <SoftCard
          className="
            rounded-3xl 
            bg-white 
            border border-[var(--color-soft-strong)] 
            shadow-[0_22px_55px_rgba(253,37,151,0.12)] 
            p-4 md:p-6 
            space-y-4
          "
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            {/* MÊS / ANO */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                <AppIcon
                  name="calendar"
                  className="w-4 h-4 text-[var(--color-brand)]"
                />
              </span>

              <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
                {selectedDate.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
            </div>

            {/* TOGGLE DIA / SEMANA */}
            <div className="
              flex gap-2 
              bg-[var(--color-soft-bg)]/80 
              p-1 rounded-full
            ">
              <button
                onClick={() => setViewMode('day')}
                className={`
                  px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition
                  ${
                    viewMode === 'day'
                      ? 'bg-white text-[var(--color-brand)] shadow'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }
                `}
              >
                Dia
              </button>

              <button
                onClick={() => setViewMode('week')}
                className={`
                  px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition
                  ${
                    viewMode === 'week'
                      ? 'bg-white text-[var(--color-brand)] shadow'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }
                `}
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
          <SoftCard
            className="
              rounded-3xl 
              bg-white 
              border border-[var(--color-soft-strong)] 
              shadow-[0_16px_38px_rgba(0,0,0,0.06)] 
              p-4 md:p-6 
              space-y-4
            "
          >
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                Lembretes do dia
              </p>
              <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                O que precisa da sua atenção hoje?
              </h3>
            </div>

            {/* LISTA DE TAREFAS */}
            <div className="space-y-2">
              {plannerData.tasks.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Nenhum lembrete ainda. Use os atalhos abaixo para começar.
                </p>
              )}

              {plannerData.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`
                    w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm text-left
                    ${
                      task.done
                        ? 'bg-[#FFE8F2] border-[#FFB3D3] line-through text-[var(--color-text-muted)]'
                        : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
                    }
                  `}
                >
                  <span
                    className={`
                      flex h-4 w-4 items-center justify-center rounded-full border text-[10px]
                      ${
                        task.done
                          ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                          : 'border-[#FFB3D3] text-[var(--color-brand)]'
                      }
                    `}
                  >
                    {task.done ? '✓' : ''}
                  </span>

                  <span className="flex-1">{task.title}</span>
                </button>
              ))}
            </div>

            {/* ATALHOS */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => addTask('Prioridade do dia', 'top3')}
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-[var(--color-brand)]"
              >
                Prioridades
              </button>

              <button
                onClick={() => addTask('Compromisso importante', 'agenda')}
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-[var(--color-brand)]"
              >
                Agenda
              </button>

              <button
                onClick={() => addTask('Gesto de autocuidado', 'selfcare')}
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-[var(--color-brand)]"
              >
                Cuidar de mim
              </button>

              <button
                onClick={() => addTask('Cuidado com meu filho', 'family')}
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-[var(--color-brand)]"
              >
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
