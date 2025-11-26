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
  key: string
  inCurrentMonth: boolean
}

export default function WeeklyPlannerShell() {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  // mês visível no calendário (sempre dia 1)
  const [calendarMonth, setCalendarMonth] = useState<Date | null>(null)

  // modal de novo compromisso (calendário)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalType, setModalType] = useState('Compromisso')
  const [modalTime, setModalTime] = useState('')
  const [modalNotes, setModalNotes] = useState('')

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

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // ========= HYDRATAÇÃO INICIAL =========
  useEffect(() => {
    const now = new Date()
    const dateKey = getBrazilDateKey(now)
    setSelectedDateKey(dateKey)
    plannerHook.setDateKey(dateKey)
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setIsHydrated(true)
  }, [plannerHook])

  // quando o dia muda, atualiza o hook do planner
  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)
    }
  }, [selectedDateKey, isHydrated, plannerHook])

  // carrega dados do dia selecionado
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

  // salva blocos individuais
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

  // ========= HANDLERS PRINCIPAIS =========

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
    const newKey = getBrazilDateKey(date)
    setSelectedDateKey(newKey)
  }, [])

  const handleMonthChange = useCallback((delta: number) => {
    setCalendarMonth((prev) => {
      const base = prev ?? new Date()
      return new Date(base.getFullYear(), base.getMonth() + delta, 1)
    })
  }, [])

  const openModalForDate = useCallback(
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

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleModalSave = useCallback(() => {
    if (!modalDate) return

    handleAddAppointment({
      time: modalTime || 'Sem horário',
      title: modalType,
      tag: modalNotes || undefined,
    })

    setIsModalOpen(false)
  }, [handleAddAppointment, modalDate, modalNotes, modalTime, modalType])

  // ========= DERIVADOS =========

  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  // se ainda não setamos o mês do calendário, usa o mês da data selecionada
  useEffect(() => {
    if (!calendarMonth && selectedDate) {
      setCalendarMonth(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        ),
      )
    }
  }, [calendarMonth, selectedDate])

  const monthYearLabel = useMemo(() => {
    const base = calendarMonth ?? selectedDate
    return base.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [calendarMonth, selectedDate])

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

  const monthCells: MonthCell[] = useMemo(() => {
    const base = calendarMonth ?? new Date()
    const year = base.getFullYear()
    const month = base.getMonth()

    const firstOfMonth = new Date(year, month, 1)
    // DOM = 0 → queremos segunda = 0
    const weekDay = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    const cells: MonthCell[] = []

    // dias do mês anterior (para completar a primeira linha)
    for (let i = weekDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const d = new Date(year, month - 1, day)
      cells.push({
        date: d,
        key: getBrazilDateKey(d),
        inCurrentMonth: false,
      })
    }

    // dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      cells.push({
        date: d,
        key: getBrazilDateKey(d),
        inCurrentMonth: true,
      })
    }

    // dias do próximo mês (para fechar 6 linhas x 7 colunas = 42 células)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      const d = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1,
      )
      cells.push({
        date: d,
        key: getBrazilDateKey(d),
        inCurrentMonth: false,
      })
    }

    return cells
  }, [calendarMonth])

  const weekData = useMemo(() => {
    // versão simplificada de visão da semana: só exemplo, como antes
    const getMonday = (date: Date) => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff))
    }

    const monday = getMonday(selectedDate)
    return Array.from({ length: 7 }, (_, i) => {
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
  }, [selectedDate])

  if (!isHydrated) return null

  return (
    <>
      <Reveal delay={200}>
        <div className="space-y-6 md:space-y-8">
          {/* ================= CALENDÁRIO + TOGGLE ================= */}
         {/* ================= CALENDÁRIO + TOGGLE ================= */}
<SoftCard
  className="rounded-3xl bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all duration-150 will-change-transform hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] md:hover:-translate-y-[2px] p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)]"
>
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
        <AppIcon
          name="calendar"
          className="w-4 h-4 text-[var(--color-brand)]"
        />
      </span>

      {/* Título + setinhas de mês */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleMonthChange(-1)}
          className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
        >
          ‹
        </button>

        <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
          {monthYearLabel}
        </h2>

        <button
          type="button"
          onClick={() => handleMonthChange(1)}
          className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
        >
          ›
        </button>
      </div>
    </div>

    {/* Dia / Semana */}
    <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full self-start md:self-auto">
      <button
        className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
          viewMode === 'day'
            ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
        }`}
        onClick={() => setViewMode('day')}
      >
        Dia
      </button>
      <button
        className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
          viewMode === 'week'
            ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
        }`}
        onClick={() => setViewMode('week')}
      >
        Semana
      </button>
    </div>
  </div>

  {/* Cabeçalho dias da semana */}
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

    {/* Grade de dias – aqui entra a nossa lógica de monthCells */}
    <div className="grid grid-cols-7 gap-1.5 md:gap-2">
      {monthCells.map((cell) => {
        const dayNumber = cell.date.getDate()
        const isSelected = cell.key === selectedDateKey
        const isToday = cell.key === getBrazilDateKey(new Date())

        // estilos base do snippet
        let classes =
          'h-8 md:h-9 rounded-full text-xs md:text-sm flex items-center justify-center transition-all border '

        if (!cell.inCurrentMonth) {
          // dias fora do mês: só “ocupam espaço”
          classes +=
            'bg-transparent text-[var(--color-text-muted)]/40 border-transparent'
        } else if (isSelected) {
          // dia selecionado (bolinha rosa cheia)
          classes +=
            'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.45)]'
        } else if (isToday) {
          // hoje
          classes +=
            'bg-white/80 text-[var(--color-brand)] border-[var(--color-brand)]'
        } else {
          // dia normal do mês
          classes +=
            'bg-white/80 text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-strong)]/70'
        }

        return (
          <button
            key={cell.key}
            type="button"
            className={classes}
            onClick={() => openModalForDate(cell.date)}
          >
            {dayNumber}
          </button>
        )
      })}
    </div>
  </div>

  <div className="space-y-1 pt-2">
    <p className="text-xs md:text-sm text-[var(--color-text-muted)] text-center">
      Tudo aqui vale para:{' '}
      <span className="font-semibold">
        {capitalizedDateFormatted}
      </span>
    </p>
    <p className="text-[10px] md:text-xs text-[var(--color-text-muted)]/70 text-center">
      Toque em um dia para adicionar compromissos e organizar sua
      rotina.
    </p>
  </div>
</SoftCard>

          {/* ================= VISÃO DIA ================= */}
          {viewMode === 'day' && (
            <div className="mt-6 md:mt-10 space-y-6 md:space-y-8 pb-12">
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
                        Escolha até três coisas que realmente importam
                        hoje.
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
                        Compromissos com horário, para enxergar seu dia
                        com clareza.
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
                      onToggle={(id) =>
                        handleToggleCareItem(id, 'care')
                      }
                      onAdd={(title) =>
                        handleAddCareItem(title, 'care')
                      }
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
                    Receitas, ideias, brincadeiras e conteúdos que você
                    salvou nos mini-hubs para acessar quando precisar.
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
                      Quando você salvar receitas, brincadeiras ou
                      conteúdos nos mini-hubs, eles aparecem aqui.
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
          )}

          {/* ================= VISÃO SEMANA ================= */}
          {viewMode === 'week' && (
            <div className="space-y-4 pb-10">
              <div className="text-center mb-4">
                <p className="text-sm text-[var(--color-text-muted)]/70">
                  Visão geral da sua semana. Toque em um dia no calendário
                  para ver em detalhes.
                </p>
              </div>
              <WeekView weekData={weekData} />
            </div>
          )}
        </div>
      </Reveal>

      {/* ================= MODAL DE NOVO COMPROMISSO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-[0_16px_60px_rgba(0,0,0,0.18)] p-6 md:p-7 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Novo compromisso
                </p>
                <p className="text-sm md:text-base font-semibold text-[var(--color-text-main)]">
                  {modalDate?.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)] hover:text-[var(--color-brand)] transition"
                aria-label="Fechar"
              >
                <AppIcon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">
                  Tipo de compromisso
                </label>
                <select
                  className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-soft-bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                  value={modalType}
                  onChange={(e) => setModalType(e.target.value)}
                >
                  <option>Compromisso</option>
                  <option>Médico</option>
                  <option>Escola</option>
                  <option>Trabalho</option>
                  <option>Vacina</option>
                  <option>Mercado</option>
                  <option>Outro</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">
                    Horário
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-soft-bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">
                  Anotações importantes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-soft-bg)] px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                  placeholder="Ex.: levar exame, buscar na escola, avisar alguém…"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-2xl text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-soft-bg)] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleModalSave}
                className="px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-deep)] shadow-[0_8px_24px_rgba(255,0,94,0.45)] transition"
              >
                Salvar compromisso
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
