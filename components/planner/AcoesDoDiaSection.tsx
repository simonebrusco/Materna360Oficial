'use client'

import React, { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'

// ✅ Tipagem local para não depender do MeuDiaPremium
// (mantém o build estável mesmo que a estrutura de task evolua)
export type PlannerTask = {
  id: string
  title?: string
  text?: string
  done?: boolean
  completed?: boolean
  date?: string
  time?: string
  // permite campos adicionais sem quebrar tipagem
  [key: string]: unknown
}

interface AcoesDoDiaSectionProps {
  tasks: PlannerTask[]
}

export default function AcoesDoDiaSection({ tasks }: AcoesDoDiaSectionProps) {
  const [open, setOpen] = useState(false)

  const total = Array.isArray(tasks) ? tasks.length : 0
  const doneCount = (tasks || []).filter((t) => Boolean(t?.done ?? t?.completed)).length

  return (
    <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-4 md:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center">
            <AppIcon name="check" size={20} className="text-[#fd2597]" />
          </div>
          <div className="text-left">
            <h3 className="text-[15px] md:text-[16px] font-semibold text-[#2f3a56]">
              Ações do dia
            </h3>
            <p className="text-[12px] md:text-[13px] text-[#6a6a6a]">
              {doneCount}/{total} concluídas
            </p>
          </div>
        </div>

        <AppIcon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          className="text-[#2f3a56]"
        />
      </button>

      {open && (
        <div className="mt-4 space-y-2">
          {(tasks || []).slice(0, 8).map((t) => {
            const label = (t.title ?? t.text ?? 'Tarefa').toString()
            const isDone = Boolean(t.done ?? t.completed)

            return (
              <div
                key={String(t.id)}
                className="flex items-center justify-between rounded-xl bg-white/70 border border-white/60 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isDone ? 'bg-[#fd2597]' : 'bg-[#bdbdbd]'
                    }`}
                    aria-hidden
                  />
                  <span className="text-[13px] md:text-[14px] text-[#2f3a56]">
                    {label}
                  </span>
                </div>

                {isDone && (
                  <span className="text-[11px] font-semibold text-[#b8236b]">
                    Feita
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
