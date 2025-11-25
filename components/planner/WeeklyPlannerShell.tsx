'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  FormEvent,
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

type ViewMode = 'month' | 'week'

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

  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // ----- ESTADO DO MODAL DE COMPROMISSO -----
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalType, setModalType] = useState('Compromisso')
  const [modalTime, setModalTime] = useState('')
  const [modalNotes, setModalNotes] = useState('')

  // =========================================
  // HYDRATE + CARREGAR / SALVAR DADOS
  // =========================================

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

  // =========================================
  // HANDLERS PRINCIPAIS
  // =========================================

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
      if (!selectedDateKey) return
      const [year, month, day] = selectedDateKey
        .split('-')
        .map(Number)
      const current = new Date(year, month - 1, day)
      current.setMonth(
        current.getMonth() + (direction === 'next' ? 1 : -1),
      )
      setSelectedDateKey(getBrazilDateKey(current))
    },
    [selectedDateKey],
  )

  // =========================================
  // MODAL DE NOVO COMPROMISSO
  // =========================================

  const openNewAppointmentModal = useCallback(
    (date: Date) => {
      setModalDate(date)
      setSelectedDateKey(getBrazilDateKey(date))
      setModalType('Compromisso')
      setModalTime('')
      setModalNotes('')
      setIsModalOpen(true)
    },
    [],
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleSubmitModal = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!modalDate) return

      const title =
        modalNotes.trim().length > 0
          ? modalNotes.trim()
          : modalType

      handleAddAppointment({
        title,
        time: modalTime || '--:--',
        tag: modalType,
      })

      setIsModalOpen(false)
    },
    [modalDate, modalNotes, modalTime, modalType, handleAddAppointment],
  )

  // =========================================
  // DERIVADOS DE DATA
  // =========================================

  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  const monthYearLabel = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    const [year, month] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDateKey, isHydrated])

  const capitalizedDateFormatted = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const formatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
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
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      agendaCount: Math.floor(Math.random() * 3),
      top3Count: Math.floor(Math.random() * 2),
      careCount: Math.floor(Math.random() * 2),
      familyCount: Math.floor(Math.random() * 2),
    }
  })

  // MATRIZ DO MÊS (6 linhas x 7 colunas)
  const monthMatrix = useMemo(() => {
    const base = selectedDate
    const year = base.getFullYear()
    const month = base.getMonth()

    const firstDay = new Date(year, month, 1)
    // segunda-feira = coluna 0
    const startWeekDay = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: (Date | null)[] = Array(42).fill(null)

    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekDay + day - 1
      cells[index] = new Date(year, month, day)
    }

    return cells
  }, [selectedDate])

  if (!isHydrated) return null

  // =========================================
  // RENDER
  // =========================================

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* ===========================
            CALENDÁRIO MENSAL PREMIUM
        ============================ */}
        <div className="rounded-3xl bg-white/80 border border-white/60 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-2xl p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Cabeçalho: mês + navegação + toggle */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <AppIcon name="calendar" className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  Seu planner de hoje
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleMonthChange('prev')}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white/80 px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand-soft)] transition-colors"
                    aria-label="Mês anterior"
                  >
                    <AppIcon name="chevron-left" className="w-4 h-4" />
                  </button>
                  <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
                    {monthYearLabel}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleMonthChange('next')}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white/80 px-2 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand-soft)] transition-colors"
                    aria-label="Próximo mês"
                  >
                    <AppIcon name="chevron-right" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex self-start md:self-auto gap-2 bg-[var(--color-soft-bg)]/80 px-1 py-1 rounded-full">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

          {/* Semana x Mês */}
          {viewMode === 'month' ? (
            <>
              {/* Cabeçalho dos dias da semana */}
              <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] md:text-xs font-semibold text-[var(--color-text-muted)]/80 mt-2">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>

              {/* Grade do mês */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2 mt-1 md:mt-2">
                {monthMatrix.map((cell, index) => {
                  if (!cell) {
                    return (
                      <div
                        key={index}
                        className="aspect-square flex items-center justify-center text-xs text-transparent"
                      >
                        .
                      </div>
                    )
                  }

                  const cellKey = getBrazilDateKey(cell)
                  const isSelected = cellKey === selectedDateKey
                  const isToday =
                    cell.toDateString() === new Date().toDateString()

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => openNewAppointmentModal(cell)}
                      className={`aspect-square flex items-center justify-center rounded-full text-xs md:text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--color-brand)] text-white shadow-[0_10px_25px_rgba(255,0,94,0.35)]'
                          : isToday
                          ? 'border border-[var(--color-brand-soft)] bg-white text-[var(--color-brand)]'
                          : 'border border-transparent text-[var(--color-text-main)] hover:border-[var(--color-brand-soft)] hover:bg-white'
                      }`}
                    >
                      {cell.getDate()}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-1 pt-3 md:pt-4 text-center">
                <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                  Tudo aqui vale para:{' '}
                  <span className="font-semibold">
                    {capitalizedDateFormatted}
                  </span>
                </p>
                <p className="text-[0.7rem] md:text-xs text-[var(--color-text-muted)]/70">
                  Toque em um dia para adicionar compromissos e organizar
                  sua rotina.
                </p>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <p className="text-xs md:text-sm text-[var(--color-text-muted)]/70 text-center mb-4">
                Visão geral da sua semana. Toque em um dia para ver em
                detalhes.
              </p>
              <WeekView weekData={weekData} />
            </div>
          )}
        </div>

        {/* ===========================
            VISÃO DIA (CARDS)
        ============================ */}
        <div className="mt-4 md:mt-6 space-y-6 md:space-y-8 pb-12">
          {/* PAR 1 — Prioridades + Casa & rotina */}
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
                    Compromissos com horário, para enxergar seu dia com
                    clareza.
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
                  onToggle={(id) => handleToggleCareItem(id, 'family')}
                  onAdd={(title) => handleAddCareItem(title, 'family')}
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
                Receitas, ideias, brincadeiras e conteúdos que você salvou
                nos mini-hubs para acessar quando precisar.
              </p>
            </div>

            {plannerHook.items.length > 0 || savedContents.length > 0 ? (
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
                  Quando você salvar receitas, brincadeiras ou conteúdos
                  nos mini-hubs, eles aparecem aqui.
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
                Anotações soltas para não esquecer — como um post-it
                digital.
              </p>
            </div>
            <NotesSection
              content={plannerData.notes}
              onChange={handleNotesChange}
              hideTitle
            />
          </div>
        </div>

        {/* ===========================
            MODAL NOVO COMPROMISSO
        ============================ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-10">
            {/* fundo blur */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute inset-0 bg-black/25 backdrop-blur-[18px]"
              aria-label="Fechar"
            />
            {/* card */}
            <div className="relative z-[90] w-full max-w-md rounded-3xl bg-white/90 border border-white/70 shadow-[0_20px_55px_rgba(0,0,0,0.35)] p-5 md:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                    Novo compromisso
                  </p>
                  <p className="text-sm md:text-base font-semibold text-[var(--color-text-main)] mt-1">
                    {modalDate?.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                  aria-label="Fechar modal"
                >
                  <AppIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitModal} className="space-y-4">
                {/* Tipo */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Tipo de compromisso
                  </label>
                  <div className="relative">
                    <select
                      value={modalType}
                      onChange={(e) => setModalType(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-white/90 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
                    >
                      <option value="Compromisso">Compromisso</option>
                      <option value="Médico">Médico</option>
                      <option value="Trabalho">Trabalho</option>
                      <option value="Escola">Escola</option>
                      <option value="Vacina">Vacina</option>
                      <option value="Mercado">Mercado</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <AppIcon
                      name="chevron-down"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]"
                    />
                  </div>
                </div>

                {/* Horário */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-white/90 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
                  />
                </div>

                {/* Notas */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Anotações importantes
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: levar exames, buscar na escola..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-white/90 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-2 rounded-2xl text-xs md:text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-soft-bg)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-deep)] transition-colors shadow-[0_10px_25px_rgba(255,0,94,0.35)]"
                  >
                    <AppIcon name="check" className="w-4 h-4" />
                    Salvar compromisso
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}
