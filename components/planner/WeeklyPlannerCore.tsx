'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

import type { MyDayTaskItem, TaskOrigin, TaskStatus } from '@/app/lib/myDayTasks.client'
import { MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'

import { Reveal } from '@/components/ui/Reveal'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { MoodQuickSelector } from '@/components/blocks/MoodQuickSelector'

import WeekView from './WeekView'
import AppointmentModal from './AppointmentModal'

/* ======================================================
   TIPAGENS
====================================================== */
type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
}

type PlannerData = {
  appointments: Appointment[]
  tasks: MyDayTaskItem[]
  notes: string
}

/* ======================================================
   HELPERS
====================================================== */
function safeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

function normalizeText(s: string) {
  return (s ?? '').trim().replace(/\s+/g, ' ')
}

/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */
export default function WeeklyPlannerCore() {
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const isGentleTone = euSignal.tone === 'gentil'

  const shortcutLabelTop3 = isGentleTone ? 'O que importa por agora' : 'O que realmente importa hoje'
  const shortcutLabelAgenda = isGentleTone ? 'Só registrar um combinado' : 'Compromissos e combinados'
  const shortcutLabelSelfcare = 'Como estou agora'
  const shortcutLabelFamily = isGentleTone ? 'Um cuidado importante' : 'Momentos e cuidados importantes'

  /* ======================================================
     REMINDER MODAL (REUTILIZADO PARA CHECK-IN)
  ====================================================== */
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [reminderDraft, setReminderDraft] = useState('')
  const [reminderOrigin, setReminderOrigin] = useState<TaskOrigin>('other')

  const openReminderModal = (origin: TaskOrigin, seed?: string) => {
    setReminderOrigin(origin)
    setReminderDraft(seed ?? '')
    setReminderModalOpen(true)

    try {
      track('planner.reminder_modal_opened', { tab: 'meu-dia', origin })
    } catch {}
  }

  const submitReminder = () => {
    const text = normalizeText(reminderDraft)
    if (!text) return

    const t: MyDayTaskItem = {
      id: safeId(),
      title: text,
      origin: reminderOrigin,
      done: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      source: MY_DAY_SOURCES.PLANNER,
    }

    setPlannerData((prev) => ({ ...prev, tasks: [...prev.tasks, t] }))
    setReminderDraft('')
    setReminderModalOpen(false)
  }

  /* ======================================================
     HYDRATION
  ====================================================== */
  useEffect(() => {
    setSelectedDateKey(getBrazilDateKey(new Date()))
    setIsHydrated(true)
  }, [])

  if (!isHydrated) return null

  return (
    <>
      <Reveal>
        <div className="space-y-6">

          {/* LEMBRETES */}
          <SoftCard className="rounded-3xl bg-white/95 border p-4 space-y-4">
            <h3 className="text-lg font-semibold">Lembretes do dia</h3>

            {/* ATALHOS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openReminderModal('top3')}
                className="rounded-2xl border px-3 py-3 text-sm font-semibold"
              >
                {shortcutLabelTop3}
              </button>

              <button
                onClick={() => openReminderModal('agenda')}
                className="rounded-2xl border px-3 py-3 text-sm font-semibold"
              >
                {shortcutLabelAgenda}
              </button>

              {/* 🔥 CHECK-IN EMOCIONAL */}
              <button
                onClick={() => openReminderModal('checkin')}
                className="rounded-2xl border px-3 py-3 text-sm font-semibold"
              >
                {shortcutLabelSelfcare}
              </button>

              <button
                onClick={() => openReminderModal('family')}
                className="rounded-2xl border px-3 py-3 text-sm font-semibold"
              >
                {shortcutLabelFamily}
              </button>
            </div>
          </SoftCard>
        </div>
      </Reveal>

      {/* MODAL REUTILIZADO */}
      {reminderModalOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/25"
            onClick={() => setReminderModalOpen(false)}
          />

          <div className="absolute left-1/2 top-[18%] w-[92%] max-w-md -translate-x-1/2">
            <SoftCard className="rounded-3xl bg-white p-4 shadow-xl">

              {/* 🔁 CHECK-IN */}
              {reminderOrigin === 'checkin' ? (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Como você está agora?</h3>

                  <MoodQuickSelector
                    silent
                    onDone={() => setReminderModalOpen(false)}
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={() => setReminderModalOpen(false)}
                      className="rounded-full px-4 py-2 text-xs font-semibold border"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                /* 🧾 MODAL ORIGINAL DE LEMBRETE */
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">O que você quer registrar?</h3>

                  <input
                    value={reminderDraft}
                    onChange={(e) => setReminderDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitReminder()}
                    className="w-full rounded-xl border px-3 py-3 text-sm"
                    autoFocus
                  />

                  <div className="flex justify-between">
                    <button
                      onClick={() => setReminderModalOpen(false)}
                      className="rounded-full px-4 py-2 text-xs border"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={submitReminder}
                      className="rounded-full px-4 py-2 text-xs bg-pink-600 text-white"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </SoftCard>
          </div>
        </div>
      )}

      <AppointmentModal
        open={false}
        mode="create"
        initialDateKey={selectedDateKey}
        initialTitle=""
        initialTime=""
        onClose={() => {}}
        onSubmit={() => {}}
      />
    </>
  )
}
