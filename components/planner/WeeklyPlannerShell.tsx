'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import Link from 'next/link'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import {
  usePlannerSavedContents,
  type PlannerSavedContent,
} from '@/app/hooks/usePlannerSavedContents'

import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import WeekView from './WeekView'
import NotesSection from './NotesSection'
import { Reveal } from '@/components/ui/Reveal'
import { IntelligentSuggestionsSection } from '@/components/blocks/IntelligentSuggestionsSection'
import SavedContentsSection from '@/components/blocks/SavedContentsSection'

type Appointment = {
  id: string
  time: string
  title: string
  tag?: string
}

type Top3Item = {
  id: string
  title: string
  done: boolean
}

type CareItem = {
  id: string
  title: string
  done: boolean
  source?: 'manual' | 'from_hub'
  origin?: string
}

type PlannerData = {
  appointments: Appointment[]
  top3: Top3Item[]
  careItems: CareItem[]
  familyItems: CareItem[]
  notes: string
}

export default function WeeklyPlannerShell() {
  // ===========================
  // ESTADO PRINCIPAL
  // ===========================
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    top3: [],
    careItems: [],
    familyItems: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Planner (sincronizar data com mini-hubs)
  const plannerHook = usePlannerSavedContents()

  // Estado local para IA (humor + intenção do dia)
  const [mood, setMood] = useState<string | null>(null)
  const [dayIntention, setDayIntention] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Modal de compromisso (calendário)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Modal de conteúdo salvo (kanban)
  const [selectedSavedContent, setSelectedSavedContent] =
    useState<PlannerSavedContent | null>(null)

  // ===========================
  // HYDRATION
  // ===========================
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    plannerHook.setDateKey(dateKey)
    setIsHydrated(true)
  }, [plannerHook])

  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)
    }
  }, [selectedDateKey, isHydrated, plannerHook])

  // ===========================
  // LOAD DATA (localStorage)
  // ===========================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedData: PlannerData = {
      appointments:
        load(`planner/appointments/${selectedDateKey}`, []) ?? [],
      top3: load(`planner/top3/${selectedDateKey}`, []) ?? [],
      careItems:
        load(`planner/careItems/${selectedDateKey}`, []) ?? [],
      familyItems:
        load(`planner/familyItems/${selectedDateKey}`, []) ?? [],
      notes: load(`planner/notes/${selectedDateKey}`, '') ?? '',
    }

    setPlannerData(loadedData)
  }, [selectedDateKey, isHydrated])

  // ===========================
  // SAVE DATA
  // ===========================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(
      `planner/appointments/${selectedDateKey}`,
      plannerData.appointments,
    )
  }, [plannerData.appointments, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/top3/${selectedDateKey}`, plannerData.top3)
  }, [plannerData.top3, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(
      `planner/careItems/${selectedDateKey}`,
      plannerData.careItems,
    )
  }, [plannerData.careItems, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(
      `planner/familyItems/${selectedDateKey}`,
      plannerData.familyItems,
    )
  }, [plannerData.familyItems, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/notes/${selectedDateKey}`, plannerData.notes)
  }, [plannerData.notes, selectedDateKey, isHydrated])

  // ===========================
  // ACTIONS
  // ===========================
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDateKey(getBrazilDateKey(date))
  }, [])

  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }
      setPlannerData(prev => ({
        ...prev,
        appointments: [...prev.appointments, newAppointment],
      }))
    },
    [],
  )

  const openModalForDate = (date: Date) => {
    setModalDate(date)
    setIsModalOpen(true)
  }

  // ===========================
  // FORMATAÇÕES
  // ===========================
  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey
      .split('-')
      .map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (!isHydrated) return null

  // ===========================
  // MAPAS DE LABEL PARA HUMOR/INTENÇÃO
  // ===========================
  const moodLabel: Record<string, string> = {
    happy: 'Feliz',
    normal: 'Normal',
    stressed: 'Estressada',
  }

  const intentionLabel: Record<string, string> = {
    leve: 'leve',
    focado: 'focado',
    produtivo: 'produtivo',
    slow: 'slow',
    automático: 'automático',
  }

  const plannerTypeLabels: Record<string, string> = {
    recipe: 'RECEITA',
    checklist: 'CHECKLIST',
    insight: 'INSPIRAÇÃO',
    note: 'NOTA',
    task: 'TAREFA',
    goal: 'META',
    event: 'EVENTO',
  }

  const moodSummary =
    (mood ? moodLabel[mood] : null) &&
    (dayIntention ? intentionLabel[dayIntention] : null)
      ? `Hoje você está ${
          moodLabel[mood as keyof typeof moodLabel]
        } e escolheu um dia ${
          intentionLabel[
            dayIntention as keyof typeof intentionLabel
          ]
        }. Que tal começar definindo suas prioridades?`
      : 'Conte pra gente como você está e que tipo de dia você quer ter. Vamos organizar tudo a partir disso.'

  // ===========================
  // RENDER
  // ===========================
  return (
    <>
      <Reveal delay={150}>
        <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">
          {/* =====================================================
              CALENDÁRIO PREMIUM
          ===================================================== */}
          {/* ... (tudo do calendário e seções anteriores permanece igual) ... */}

          {/* (vou omitir aqui pra não ficar enorme, mas mantenha exatamente
              o mesmo código que você já tem do calendário, Lembretes,
              Comece pelo que faz sentido hoje e Hoje por aqui + sugestões) */}

          {/* =====================================================
              INSPIRAÇÕES & CONTEÚDOS SALVOS – AGORA COM KANBAN + MODAL
          ===================================================== */}
          <section>
            <SavedContentsSection
              contents={[]}
              plannerContents={plannerHook.items}
              onItemClick={item => setSelectedSavedContent(item)}
              onItemDone={({ id, source }) => {
                if (source === 'planner') {
                  plannerHook.removeItem(id)
                }
              }}
            />
          </section>

          {/* VISÃO SEMANA */}
          {viewMode === 'week' && (
            <div className="mt-4 pb-10">
              <WeekView weekData={generateWeekData(selectedDate)} />
            </div>
          )}
        </div>
      </Reveal>

      {/* =====================================================
          MODAL NOVO COMPROMISSO (CALENDÁRIO)
      ===================================================== */}
      {isModalOpen && modalDate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[var(--color-text-main)]">
                Novo compromisso –{' '}
                {modalDate.toLocaleDateString('pt-BR')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
              >
                ✕
              </button>
            </div>
            <ModalAppointmentForm
              onSubmit={data => {
                handleAddAppointment({
                  ...data,
                  date: modalDate!,
                })
                setIsModalOpen(false)
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL DETALHE DO CONTEÚDO SALVO (KANBAN)
      ===================================================== */}
      {selectedSavedContent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[998]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                  <AppIcon
                    name="target"
                    className="w-4 h-4 text-[var(--color-brand)]"
                  />
                </span>
                <div className="flex flex-col">
                  <span className="inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-[#FFE8F2]/60 px-2 py-0.5 text-[10px] font-medium text-[#C2285F]">
                    {plannerTypeLabels[selectedSavedContent.type] ??
                      'CONTEÚDO'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSavedContent(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] mb-2">
              {selectedSavedContent.title}
            </h3>

            {(() => {
              const anyItem = selectedSavedContent as any
              const payload = anyItem.payload ?? {}
              const description =
                anyItem.description ??
                payload.preview ??
                payload.description ??
                payload.text ??
                payload.excerpt ??
                ''

              return description ? (
                <p className="text-sm text-[var(--color-text-muted)] mb-3 whitespace-pre-line">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  Esse conteúdo foi salvo no planner. Em breve, você verá
                  mais detalhes aqui.
                </p>
              )
            })()}

            <p className="text-[11px] text-[var(--color-text-muted)]/80 mb-4">
              Salvo em: {selectedSavedContent.origin.replace('-', ' ')}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSavedContent(null)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  plannerHook.removeItem(selectedSavedContent.id)
                  setSelectedSavedContent(null)
                }}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
              >
                Marcar como feito
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// =====================================================
// GERADOR DO CALENDÁRIO
// (mantém igual ao que você já tinha)
// =====================================================
function generateMonthMatrix(
  currentDate: Date,
): (Date | null)[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const matrix: (Date | null)[] = []
  const offset = (firstDay.getDay() + 6) % 7

  for (let i = 0; i < offset; i++) matrix.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    matrix.push(new Date(year, month, d))
  }

  return matrix
}

function generateWeekData(base: Date) {
  const monday = new Date(base)
  const day = monday.getDay()
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('pt-BR', {
        weekday: 'long',
      }),
      agendaCount: 0,
      top3Count: 0,
      careCount: 0,
      familyCount: 0,
    }
  })
}

// =====================================================
// FORM DO MODAL (COMPROMISSO)
// =====================================================
function ModalAppointmentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (!title.trim()) return
        onSubmit({
          title,
          time,
        })
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">
          Título
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Ex: Consulta médica..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">
          Horário
        </label>
        <input
          type="time"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
        >
          Salvar compromisso
        </button>
      </div>
    </form>
  )
}
