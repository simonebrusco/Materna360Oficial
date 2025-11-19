'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { useSavedInspirations } from '@/app/hooks/useSavedInspirations'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import Top3Section from './Top3Section'
import CareSection from './CareSection'
import AgendaSection from './AgendaSection'
import NotesSection from './NotesSection'
import SavedContentsSection from './SavedContentsSection'
import DayCalendarStrip from './DayCalendarStrip'
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
  // Initialize selected date key (single source of truth)
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load global saved inspirations
  const { savedItems: savedContents } = useSavedInspirations()

  // Initialize per-day planner data
  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    top3: [],
    careItems: [],
    familyItems: [],
    notes: '',
  })

  // View mode state
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Hydrate selected date on client side only
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    setIsHydrated(true)
  }, [])

  // Load planner data for the selected date whenever selectedDateKey changes
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedData: PlannerData = {
      appointments: load<Appointment[]>(`planner/appointments/${selectedDateKey}`, []) ?? [],
      top3: load<Top3Item[]>(`planner/top3/${selectedDateKey}`, []) ?? [],
      careItems: load<CareItem[]>(`planner/careItems/${selectedDateKey}`, []) ?? [],
      familyItems: load<CareItem[]>(`planner/familyItems/${selectedDateKey}`, []) ?? [],
      notes: load<string>(`planner/notes/${selectedDateKey}`, '') ?? '',
    }

    setPlannerData(loadedData)
  }, [selectedDateKey, isHydrated])

  // Save appointments whenever they change
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/appointments/${selectedDateKey}`, plannerData.appointments)
  }, [plannerData.appointments, selectedDateKey, isHydrated])

  // Save top3 whenever they change
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/top3/${selectedDateKey}`, plannerData.top3)
  }, [plannerData.top3, selectedDateKey, isHydrated])

  // Save care items whenever they change
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/careItems/${selectedDateKey}`, plannerData.careItems)
  }, [plannerData.careItems, selectedDateKey, isHydrated])

  // Save family items whenever they change
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/familyItems/${selectedDateKey}`, plannerData.familyItems)
  }, [plannerData.familyItems, selectedDateKey, isHydrated])

  // Save notes whenever they change
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/notes/${selectedDateKey}`, plannerData.notes)
  }, [plannerData.notes, selectedDateKey, isHydrated])

  // Handlers for each section
  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }
      setPlannerData(prev => ({
        ...prev,
        appointments: [...prev.appointments, newAppointment],
      }))
    },
    []
  )

  const handleToggleTop3 = useCallback((id: string) => {
    setPlannerData(prev => ({
      ...prev,
      top3: prev.top3.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }))
  }, [])

  const handleAddTop3 = useCallback((title: string) => {
    setPlannerData(prev => {
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

  const handleToggleCareItem = useCallback((id: string, type: 'care' | 'family') => {
    setPlannerData(prev => {
      const field = type === 'care' ? 'careItems' : 'familyItems'
      return {
        ...prev,
        [field]: prev[field].map(item =>
          item.id === id ? { ...item, done: !item.done } : item
        ),
      }
    })
  }, [])

  const handleAddCareItem = useCallback((title: string, type: 'care' | 'family') => {
    setPlannerData(prev => {
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
  }, [])

  const handleNotesChange = useCallback((content: string) => {
    setPlannerData(prev => ({ ...prev, notes: content }))
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    const newDateKey = getBrazilDateKey(date)
    setSelectedDateKey(newDateKey)
  }, [])

  // Get current month and year for display
  const monthYear = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    // Parse the date key (YYYY-MM-DD format)
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDateKey, isHydrated])

  // Format selected date for contextual text
  const capitalizedDateFormatted = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    // Parse the date key (YYYY-MM-DD format)
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const selectedDateFormatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return selectedDateFormatted.charAt(0).toUpperCase() + selectedDateFormatted.slice(1)
  }, [selectedDateKey, isHydrated])

  // Get selected date for calendar
  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  // Generate week data for WeekView
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

  if (!isHydrated) {
    return null
  }

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* MINI CALENDAR STRIP & VIEW TOGGLE */}
        <SoftCard className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppIcon name="calendar" className="w-5 h-5 text-[#ff005e]" />
              <h2 className="text-lg md:text-xl font-bold text-[#2f3a56] capitalize">
                {monthYear}
              </h2>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-[#f5f5f5] p-1 rounded-full">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-[#ff005e] shadow-[0_2px_8px_rgba(255,0,94,0.1)]'
                    : 'text-[#545454] hover:text-[#ff005e]'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[#ff005e] shadow-[0_2px_8px_rgba(255,0,94,0.1)]'
                    : 'text-[#545454] hover:text-[#ff005e]'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

          {/* Day Calendar Strip */}
          <DayCalendarStrip
            selectedDate={selectedDate}
            selectedDateKey={selectedDateKey}
            onDateSelect={handleDateSelect}
          />

          {/* Contextual date caption */}
          <div className="space-y-1">
            <p className="text-sm text-[#545454] text-center">
              Tudo aqui vale para: <span className="font-semibold">{capitalizedDateFormatted}</span>
            </p>
            <p className="text-xs text-[#545454]/60 text-center">
              Toque em outro dia para planejar ou rever sua semana.
            </p>
          </div>
        </SoftCard>

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <div className="mt-6 md:mt-10 space-y-6 md:space-y-8 pb-12">
            {/* PAIR 1: Prioridades do dia + Casa & rotina */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                    VOCÊ
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] font-poppins">
                      Prioridades do dia
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454] font-poppins">
                      Escolha até três coisas que realmente importam hoje.
                    </p>
                  </div>
                  <Top3Section
                    items={plannerData.top3}
                    onToggle={handleToggleTop3}
                    onAdd={handleAddTop3}
                    hideTitle={true}
                  />
                </div>
              </div>
              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                    ROTINA
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] font-poppins">
                      Casa &amp; rotina
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454] font-poppins">
                      Compromissos com horário, para enxergar seu dia com clareza.
                    </p>
                  </div>
                  <AgendaSection
                    items={plannerData.appointments}
                    onAddAppointment={handleAddAppointment}
                    hideTitle={true}
                  />
                </div>
              </div>
            </section>

            {/* PAIR 2: Cuidar de mim + Cuidar do meu filho */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                    VOCÊ
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] font-poppins">
                      Cuidar de mim
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454] font-poppins">
                      Pequenos gestos que cuidam da sua energia.
                    </p>
                  </div>
                  <CareSection
                    title="Cuidar de mim"
                    subtitle="Atividades de autocuidado."
                    icon="heart"
                    items={plannerData.careItems}
                    onToggle={id => handleToggleCareItem(id, 'care')}
                    onAdd={title => handleAddCareItem(title, 'care')}
                    placeholder="Novo gesto de autocuidado…"
                    hideTitle={true}
                  />
                </div>
              </div>
              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                    SEU FILHO
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] font-poppins">
                      Cuidar do meu filho
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454] font-poppins">
                      Um momento de conexão faz diferença no dia.
                    </p>
                  </div>
                  <CareSection
                    title="Cuidar da família"
                    subtitle="Tarefas com os filhos."
                    icon="smile"
                    items={plannerData.familyItems}
                    onToggle={id => handleToggleCareItem(id, 'family')}
                    onAdd={title => handleAddCareItem(title, 'family')}
                    placeholder="Novo momento com a família…"
                    hideTitle={true}
                  />
                </div>
              </div>
            </section>

            {/* Lembretes rápidos */}
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                LEMBRETES
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] font-poppins">
                  Lembretes rápidos
                </h2>
                <p className="mt-1 mb-4 text-sm text-[#545454] font-poppins">
                  Anotações soltas para não esquecer.
                </p>
              </div>
              <NotesSection
                content={plannerData.notes}
                onChange={handleNotesChange}
                hideTitle={true}
              />
            </div>

            {/* Inspirações & conteúdos salvos */}
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                INSPIRAÇÕES
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] font-poppins">
                  Inspirações &amp; conteúdos salvos
                </h2>
                <p className="mt-1 mb-4 text-sm text-[#545454] font-poppins">
                  Receitas, ideias e conteúdos que você salvou para usar quando precisar.
                </p>
              </div>
              {plannerData.savedContents.length > 0 ? (
                <SavedContentsSection contents={plannerData.savedContents} hideTitle={true} />
              ) : (
                <SoftCard className="p-5 md:p-6 text-center py-6">
                  <AppIcon name="bookmark" className="w-8 h-8 text-[#ddd] mx-auto mb-3" />
                  <p className="text-sm text-[#545454]/70 mb-3">
                    Quando você salvar receitas, brincadeiras ou conteúdos nos mini-hubs, eles aparecem aqui.
                  </p>
                  <a
                    href="/biblioteca-materna"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors"
                  >
                    Ver tudo na Biblioteca Materna
                    <AppIcon name="arrow-right" className="w-4 h-4" />
                  </a>
                </SoftCard>
              )}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-[#545454]/70">
                Visão geral da sua semana. Toque em um dia para ver em detalhes.
              </p>
            </div>
            <WeekView weekData={weekData} />
          </div>
        )}
      </div>
    </Reveal>
  )
}
