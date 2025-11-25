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

  // NOVO: mês atual mostrado no calendário
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    () => new Date(),
  )

  // VISÃO: Dia x Semana
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // MODAL de compromisso por dia
  const [isDayModalOpen, setIsDayModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalType, setModalType] = useState<string>('Compromisso')
  const [modalTime, setModalTime] = useState<string>('')
  const [modalNotes, setModalNotes] = useState<string>('')

  // === HYDRATAÇÃO & CARREGAR DADOS =====================================

  useEffect(() => {
    const now = new Date()
    const dateKey = getBrazilDateKey(now)
    setSelectedDateKey(dateKey)
    plannerHook.setDateKey(dateKey)
    setCurrentMonthDate(
      new Date(now.getFullYear(), now.getMonth(), 1),
    )
    setIsHydrated(true)
  }, [plannerHook])

  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)

      // Sempre que o dia selecionado mudar, garantimos que o mês do
      // calendário acompanha esse dia
      const [year, month] = selectedDateKey.split('-').map(Number)
      setCurrentMonthDate(new Date(year, month - 1, 1))
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

  // === SALVAR DADOS ====================================================

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

  // === HANDLERS ========================================================

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

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  // Abrir modal ao clicar em um dia
  const handleOpenDayModal = (date: Date) => {
    handleDateSelect(date)
    setModalDate(date)
    setModalType('Compromisso')
    setModalTime('')
    setModalNotes('')
    setIsDayModalOpen(true)
  }

  const handleSaveDayModal = () => {
    if (!modalDate) return

    handleAddAppointment({
      time: modalTime || '--:--',
      title: modalNotes || modalType,
      tag: modalType,
    })

    setIsDayModalOpen(false)
    setModalDate(null)
  }

  const handleCloseDayModal = () => {
    setIsDayModalOpen(false)
    setModalDate(null)
  }

  // === DATAS FORMATADAS ================================================

  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  const monthYearLabel = useMemo(() => {
    const date = currentMonthDate
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [currentMonthDate])

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

  // Dados da semana para WeekView
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

  // === RENDER MÊS ======================================================

  const renderMonthGrid = () => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth() // 0–11

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // JS: 0 = domingo … 6 = sábado
    // Queremos: 0 = segunda … 6 = domingo
    const rawWeekday = firstDay.getDay()
    const startOffset = (rawWeekday + 6) % 7

    const cells: (Date | null)[] = []

    // Dias vazios antes do dia 1
    for (let i = 0; i < startOffset; i++) {
      cells.push(null)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day))
    }

    return (
      <div className="space-y-2 md:space-y-3">
        <div className="grid grid-cols-7 text-[10px] md:text-xs font-semibold text-[var(--color-text-muted)] text-center uppercase tracking-wide">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {cells.map((date, idx) => {
            if (!date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-8 md:h-9"
                />
              )
            }

            const dateKey = getBrazilDateKey(date)
            const isSelected = dateKey === selectedDateKey

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleOpenDayModal(date)}
                className={`h-8 md:h-9 rounded-full text-xs md:text-sm flex items-center justify-center transition-all border
                  ${
                    isSelected
                      ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.45)]'
                      : 'bg-white/80 text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-strong)]/70'
                  }`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (!isHydrated) return null

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* CALENDÁRIO PREMIUM — ESTRELA DO MEU DIA */}
        <SoftCard className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl border border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)]">
          {/* Header: mês + navegação + toggle Dia/Semana */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                <AppIcon
                  name="calendar"
                  className="w-4 h-4 text-[var(--color-brand)]"
                />
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                >
                  ‹
                </button>
                <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
                  {monthYearLabel}
                </h2>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full self-start md:self-auto">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

          {/* Corpo: grade mensal */}
          {renderMonthGrid()}

          <div className="space-y-1 pt-2">
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] text-center">
              Tudo aqui vale para:{' '}
              <span className="font-semibold">
                {capitalizedDateFormatted}
              </span>
            </p>
            <p className="text-[10px] md:text-xs text-[var(--color-text-muted)]/70 text-center">
              Toque em um dia para adicionar compromissos e organizar sua rotina.
            </p>
          </div>
        </SoftCard>

        {/* VISÃO SEMANA — mostra só o resumo quando a aba "Semana" estiver ativa */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-[var(--color-text-muted)]/80">
                Visão geral da sua semana. Toque em um dia no calendário para
                ajustar os detalhes.
              </p>
            </div>
            <WeekView weekData={weekData} />
          </div>
        )}

        {/* VISÃO DIA — planner completo abaixo do calendário */}
        {viewMode === 'day' && (
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
                  Receitas, ideias, brincadeiras e conteúdos que você salvou nos
                  mini-hubs para acessar quando precisar.
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
                    Quando você salvar receitas, brincadeiras ou conteúdos nos
                    mini-hubs, eles aparecem aqui.
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
        )}

        {/* MODAL DE COMPROMISSO POR DIA — CENTRALIZADO */}
        {isDayModalOpen && modalDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-[0_22px_55px_rgba(0,0,0,0.25)] p-5 md:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase">
                    Novo compromisso
                  </p>
                  <p className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                    {modalDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDayModal}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/80"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Tipo de compromisso
                  </label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-soft-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                  >
                    <option>Compromisso</option>
                    <option>Médico</option>
                    <option>Escola</option>
                    <option>Trabalho</option>
                    <option>Vacina</option>
                    <option>Mercado</option>
                    <option>Família</option>
                    <option>Outro</option>
                  </select>
                </div>

                <div className="grid grid-cols-[1fr,2fr] gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={modalTime}
                      onChange={(e) => setModalTime(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-soft-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Anotações importantes
                    </label>
                    <input
                      type="text"
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      placeholder="Ex.: levar exames, buscar na escola…"
                      className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-soft-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDayModal}
                  className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/80"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDayModal}
                  className="px-5 py-2 rounded-full text-xs md:text-sm font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_30px_rgba(255,20,117,0.35)] hover:bg-[var(--color-brand-deep)] transition-colors"
                >
                  Salvar compromisso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}
