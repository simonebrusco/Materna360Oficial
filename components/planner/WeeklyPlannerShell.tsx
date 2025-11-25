'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { useSavedInspirations } from '@/app/hooks/useSavedInspirations'
import {
  usePlannerSavedContents,
  type PlannerSavedContent,
} from '@/app/hooks/usePlannerSavedContents'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import SavedContentDrawer from '@/components/ui/SavedContentDrawer'
import Top3Section from './Top3Section'
import CareSection from './CareSection'
import AgendaSection from './AgendaSection'
import NotesSection from './NotesSection'
import SavedContentsSection from './SavedContentsSection'
import WeekView from './WeekView'
import { Reveal } from '@/components/ui/Reveal'

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

type MonthCell = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

export default function WeeklyPlannerShell() {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [selectedSavedItem, setSelectedSavedItem] =
    useState<PlannerSavedContent | null>(null)
  const [isSavedItemOpen, setIsSavedItemOpen] = useState(false)

  const { savedItems: savedContents } = useSavedInspirations()
  const plannerHook = usePlannerSavedContents()

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    top3: [],
    careItems: [],
    familyItems: [],
    notes: '',
  })

  // mês atual mostrado no calendário (sempre dia 1)
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)

  // visão: mês ou semana
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  // ==== HYDRATAÇÃO INICIAL ====
  useEffect(() => {
    const today = new Date()
    const dateKey = getBrazilDateKey(today)

    setSelectedDateKey(dateKey)
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))

    plannerHook.setDateKey(dateKey)
    setIsHydrated(true)
  }, [plannerHook])

  // Mantém o hook do planner sincronizado com o dia selecionado
  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)
    }
  }, [selectedDateKey, isHydrated, plannerHook])

  // ==== CARREGAR ESTADO DO DIA ====
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedData: PlannerData = {
      appointments:
        load<Appointment[]>(
          `planner/appointments/${selectedDateKey}`,
          [],
        ) ?? [],
      top3:
        load<Top3Item[]>(`planner/top3/${selectedDateKey}`, []) ??
        [],
      careItems:
        load<CareItem[]>(
          `planner/careItems/${selectedDateKey}`,
          [],
        ) ?? [],
      familyItems:
        load<CareItem[]>(
          `planner/familyItems/${selectedDateKey}`,
          [],
        ) ?? [],
      notes:
        load<string>(`planner/notes/${selectedDateKey}`, '') ?? '',
    }

    setPlannerData(loadedData)
  }, [selectedDateKey, isHydrated])

  // ==== SALVAR QUANDO MUDA ====
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
    save(`planner/careItems/${selectedDateKey}`, plannerData.careItems)
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

  // ==== HANDLERS ====
  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }
      setPlannerData((prev) => ({
        ...prev,
        appointments: [...prev.appointments, newAppointment],
      }))
    },
    [],
  )

  const handleToggleTop3 = useCallback((id: string) => {
    setPlannerData((prev) => ({
      ...prev,
      top3: prev.top3.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    }))
  }, [])

  const handleAddTop3 = useCallback((title: string) => {
    setPlannerData((prev) => {
      if (prev.top3.length < 3) {
        const newItem: Top3Item = {
          id: Math.random().toString(36).slice(2, 9),
          title,
          done: false,
        }
        return { ...prev, top3: [...prev.top3, newItem] }
      }
      return prev
    })
  }, [])

  const handleToggleCareItem = useCallback(
    (id: string, type: 'care' | 'family') => {
      setPlannerData((prev) => {
        const field = type === 'care' ? 'careItems' : 'familyItems'
        return {
          ...prev,
          [field]: prev[field].map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        }
      })
    },
    [],
  )

  const handleAddCareItem = useCallback(
    (title: string, type: 'care' | 'family') => {
      setPlannerData((prev) => {
        const field = type === 'care' ? 'careItems' : 'familyItems'
        const newItem: CareItem = {
          id: Math.random().toString(36).slice(2, 9),
          title,
          done: false,
          source: 'manual',
        }
        return {
          ...prev,
          [field]: [...prev[field], newItem],
        }
      })
    },
    [],
  )

  const handleOpenSavedItem = useCallback(
    (item: PlannerSavedContent) => {
      setSelectedSavedItem(item)
      setIsSavedItemOpen(true)
    },
    [],
  )

  const handleCloseSavedItem = useCallback(() => {
    setIsSavedItemOpen(false)
    setSelectedSavedItem(null)
  }, [])

  const handleNotesChange = useCallback((content: string) => {
    setPlannerData((prev) => ({ ...prev, notes: content }))
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    const newDateKey = getBrazilDateKey(date)
    setSelectedDateKey(newDateKey)
  }, [])

  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentMonth((prev) => {
        if (!prev) return prev
        const next = new Date(prev)
        next.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
        return new Date(
          next.getFullYear(),
          next.getMonth(),
          1,
        )
      })
    },
    [],
  )

  // ==== DERIVADOS ====
  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  const monthYearLabel = useMemo(() => {
    if (!currentMonth) return ''
    return currentMonth.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [currentMonth])

  const capitalizedDateFormatted = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const selectedDateFormatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return (
      selectedDateFormatted.charAt(0).toUpperCase() +
      selectedDateFormatted.slice(1)
    )
  }, [selectedDateKey, isHydrated])

  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const monday = getMonday(selectedDate)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    const dayNumber = d.getDate()

    return {
      dayNumber,
      dayName:
        dayName.charAt(0).toUpperCase() + dayName.slice(1),
      agendaCount: Math.floor(Math.random() * 3),
      top3Count: Math.floor(Math.random() * 2),
      careCount: Math.floor(Math.random() * 2),
      familyCount: Math.floor(Math.random() * 2),
    }
  })

  const monthGrid: MonthCell[] = useMemo(() => {
    if (!currentMonth) return []

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstOfMonth = new Date(year, month, 1)
    const lastOfMonth = new Date(year, month + 1, 0)

    const startWeekday = firstOfMonth.getDay() === 0 ? 7 : firstOfMonth.getDay()
    const daysInMonth = lastOfMonth.getDate()

    const cells: MonthCell[] = []

    // dias anteriores para completar a primeira linha
    for (let i = startWeekday - 1; i > 0; i--) {
      const d = new Date(year, month, 1 - i)
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDate(d, new Date()),
        isSelected: isSameDateKey(d, selectedDateKey),
      })
    }

    // dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      cells.push({
        date: d,
        isCurrentMonth: true,
        isToday: isSameDate(d, new Date()),
        isSelected: isSameDateKey(d, selectedDateKey),
      })
    }

    // completa até 6 linhas (42 células)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      const d = new Date(last)
      d.setDate(last.getDate() + 1)
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDate(d, new Date()),
        isSelected: isSameDateKey(d, selectedDateKey),
      })
    }

    return cells
  }, [currentMonth, selectedDateKey])

  if (!isHydrated) return null

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* PLANNER — card mais compacto */}
        <SoftCard className="p-4 md:p-6 space-y-4 md:space-y-5 max-w-[520px] mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AppIcon
                name="calendar"
                className="w-5 h-5 text-[var(--color-brand)]"
              />
              <div className="flex flex-col">
                <span className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Seu planner de hoje
                </span>
                <span className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                  Tudo o que você organiza aqui vale para o dia selecionado.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navegação de mês (desktop) */}
              <div className="hidden md:flex items-center gap-2 rounded-full bg-[var(--color-soft-bg)] px-2 py-1">
                <button
                  type="button"
                  onClick={() => handleMonthChange('prev')}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-xs text-[var(--color-text-muted)] hover:bg-white/70 hover:text-[var(--color-brand)] transition-colors"
                >
                  ‹
                </button>
                <span className="text-[11px] font-medium text-[var(--color-text-main)] capitalize">
                  {monthYearLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthChange('next')}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-xs text-[var(--color-text-muted)] hover:bg-white/70 hover:text-[var(--color-brand)] transition-colors"
                >
                  ›
                </button>
              </div>

              {/* Toggle Mês / Semana */}
              <div className="flex gap-1.5 bg-[var(--color-soft-bg)] p-1 rounded-full">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-all ${
                    viewMode === 'month'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.12)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-all ${
                    viewMode === 'week'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.12)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }`}
                >
                  Semana
                </button>
              </div>
            </div>
          </div>

          {/* header de mês em mobile */}
          <div className="md:hidden flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleMonthChange('prev')}
              className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-[var(--color-text-muted)] hover:bg-white/70 hover:text-[var(--color-brand)] transition-colors"
            >
              ‹
            </button>
            <span className="text-xs font-medium text-[var(--color-text-main)] capitalize">
              {monthYearLabel}
            </span>
            <button
              type="button"
              onClick={() => handleMonthChange('next')}
              className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-[var(--color-text-muted)] hover:bg:white/70 hover:text-[var(--color-brand)] transition-colors"
            >
              ›
            </button>
          </div>

          {/* Calendário MENSAL compacto */}
          {viewMode === 'month' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em]">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {monthGrid.map((cell, index) => {
                  const dayNumber = cell.date.getDate()
                  const isDisabled = !cell.isCurrentMonth
                  const isSelected = cell.isSelected
                  const isToday = cell.isToday

                  return (
                    <button
                      key={`${cell.date.toISOString()}-${index}`}
                      type="button"
                      onClick={() => handleDateSelect(cell.date)}
                      className={[
                        'aspect-square rounded-full flex items-center justify-center text-[11px] transition-all',
                        isDisabled
                          ? 'text-[var(--color-text-muted)]/35'
                          : 'text-[var(--color-text-main)]',
                        isSelected &&
                          'bg-[var(--color-brand)] text-white shadow-[0_6px_18px_rgba(253,37,151,0.35)]',
                        !isSelected &&
                          !isDisabled &&
                          'hover:bg-[var(--color-soft-strong)] hover:text-[var(--color-brand)]',
                        isToday && !isSelected && 'ring-1 ring-[var(--color-brand)]/35',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {dayNumber}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-1 text-center">
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Tudo aqui vale para:{' '}
                  <span className="font-semibold">
                    {capitalizedDateFormatted}
                  </span>
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]/70">
                  Toque em outro dia para adicionar compromissos e organizar sua rotina.
                </p>
              </div>
            </div>
          )}

          {/* Visão SEMANA dentro do card */}
          {viewMode === 'week' && (
            <div className="mt-1">
              <p className="text-[11px] text-[var(--color-text-muted)] text-center mb-3">
                Visão geral da semana de{' '}
                <span className="font-semibold">
                  {capitalizedDateFormatted}
                </span>
                .
              </p>
              <WeekView weekData={weekData} />
            </div>
          )}
        </SoftCard>

        {/* VISÃO DIA — cards abaixo do planner */}
        <div className="mt-6 md:mt-10 space-y-6 md:space-y-8 pb-12">
          {/* PAR 1 — Prioridades + Agenda */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
            <div className="flex h-full">
              <div className="space-y-3 w-full flex flex-col">
                <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                  Você
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                    Prioridades do dia
                  </h2>
                  <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                    Escolha até três coisas que realmente importam hoje.
                  </p>
                </div>
                <Top3Section
                  items={plannerData.top3}
                  onToggle={handleToggleTop3}
                  onAdd={handleAddTop3}
                  hideTitle
                />
              </div>
            </div>

            <div className="flex h-full">
              <div className="space-y-3 w-full flex flex-col">
                <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                  Rotina
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                    Agenda &amp; compromissos
                  </h2>
                  <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                    Compromissos com horário, para enxergar seu dia com clareza.
                  </p>
                </div>
                <AgendaSection
                  items={plannerData.appointments}
                  onAddAppointment={handleAddAppointment}
                  hideTitle
                />
              </div>
            </div>
          </section>

          {/* PAR 2 — Cuidar de mim + Cuidar do meu filho */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
            <div className="flex h-full">
              <div className="space-y-3 w-full flex flex-col">
                <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                  Você
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                    Cuidar de mim
                  </h2>
                  <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                    Pequenos gestos que cuidam da sua energia.
                  </p>
                </div>
                <CareSection
                  title="Cuidar de mim"
                  subtitle="Atividades de autocuidado."
                  icon="heart"
                  items={plannerData.careItems}
                  onToggle={(id) => handleToggleCareItem(id, 'care')}
                  onAdd={(title) => handleAddCareItem(title, 'care')}
                  placeholder="Novo gesto de autocuidado…"
                  hideTitle
                />
              </div>
            </div>

            <div className="flex h-full">
              <div className="space-y-3 w-full flex flex-col">
                <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                  Seu filho
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                    Cuidar do meu filho
                  </h2>
                  <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                    Um momento de conexão faz diferença no dia.
                  </p>
                </div>
                <CareSection
                  title="Cuidar da família"
                  subtitle="Tarefas com os filhos."
                  icon="smile"
                  items={plannerData.familyItems}
                  onToggle={(id) =>
                    handleToggleCareItem(id, 'family')
                  }
                  onAdd={(title) =>
                    handleAddCareItem(title, 'family')
                  }
                  placeholder="Novo momento com a família…"
                  hideTitle
                />
              </div>
            </div>
          </section>

          {/* INSPIRAÇÕES */}
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
              Inspirações
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                Inspirações &amp; conteúdos salvos
              </h2>
              <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                Receitas, ideias, brincadeiras e conteúdos que você salvou nos mini-hubs para acessar quando precisar.
              </p>
            </div>

            {plannerHook.items.length > 0 ||
            savedContents.length > 0 ? (
              <>
                <SavedContentsSection
                  contents={savedContents}
                  plannerContents={plannerHook.items}
                  onItemClick={handleOpenSavedItem}
                  hideTitle
                />
                <SavedContentDrawer
                  open={isSavedItemOpen}
                  onClose={handleCloseSavedItem}
                  item={selectedSavedItem}
                />
              </>
            ) : (
              <SoftCard className="p-5 md:p-6 text-center py-6">
                <AppIcon
                  name="bookmark"
                  className="w-8 h-8 text-[var(--color-border-muted)] mx-auto mb-3"
                />
                <p className="text-sm text-[var(--color-text-muted)]/70 mb-3">
                  Quando você salvar receitas, brincadeiras ou conteúdos nos mini-hubs, eles aparecem aqui.
                </p>
                <a
                  href="/biblioteca-materna"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
                >
                  Ver tudo na Biblioteca Materna
                  <AppIcon name="arrow-right" className="w-4 h-4" />
                </a>
              </SoftCard>
            )}
          </div>

          {/* LEMBRETES */}
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
              Lembretes
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                Lembretes rápidos
              </h2>
              <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                Anotações soltas para não esquecer — como um post-it digital.
              </p>
            </div>
            <NotesSection
              content={plannerData.notes}
              onChange={handleNotesChange}
              hideTitle
            />
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// helpers locais
function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isSameDateKey(date: Date, key: string) {
  if (!key) return false
  const [year, month, day] = key.split('-').map(Number)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}
