'use client'

import React, { useState, useCallback } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import DayCalendarStrip from './DayCalendarStrip'
import AgendaSection from './AgendaSection'
import Top3Section from './Top3Section'
import CareSection from './CareSection'
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

type SavedContent = {
  id: string
  title: string
  type: 'artigo' | 'receita' | 'ideia' | 'frase'
  origin: string
  href?: string
}

type PlannerData = {
  appointments: Appointment[]
  top3: Top3Item[]
  careItems: CareItem[]
  familyItems: CareItem[]
  notes: string
  savedContents: SavedContent[]
}

export default function WeeklyPlannerShell() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'hoje' | 'semana'>('hoje')

  // Get date key for storing per-day data
  const getDateKey = (date: Date) => date.toISOString().split('T')[0]
  const currentDateKey = getDateKey(selectedDate)

  // Initialize planner state with mock data
  const [plannerData, setPlannerData] = useState<Record<string, PlannerData>>({
    [getDateKey(new Date())]: {
      appointments: [
        { id: '1', time: '09:00', title: 'Consulta pediatra', tag: 'Filho' },
        { id: '2', time: '14:30', title: 'Reunião trabalho', tag: 'Trabalho' },
      ],
      top3: [
        { id: '1', title: 'Finalizar projeto', done: false },
        { id: '2', title: 'Fazer compras', done: true },
      ],
      careItems: [
        { id: '1', title: 'Meditação de 10 minutos', done: false },
        { id: '2', title: 'Tomar café com calma', done: true },
      ],
      familyItems: [
        { id: '1', title: 'Brincadeira com o filho', done: false },
        { id: '2', title: 'Ler história antes de dormir', done: false },
      ],
      notes: '',
      savedContents: [
        {
          id: 'c1',
          title: 'Receita: Bolo de cenoura saudável',
          type: 'receita',
          origin: 'Biblioteca',
          href: '/biblioteca-materna',
        },
        {
          id: 'c2',
          title: 'Ideias para brincadeiras divertidas',
          type: 'ideia',
          origin: 'Descobrir',
          href: '/descobrir',
        },
      ],
    },
  })

  const getCurrentData = useCallback(() => {
    return (
      plannerData[currentDateKey] || {
        appointments: [],
        top3: [],
        careItems: [],
        familyItems: [],
        notes: '',
        savedContents: [],
      }
    )
  }, [plannerData, currentDateKey])

  const updateCurrentData = useCallback(
    (updates: Partial<PlannerData>) => {
      setPlannerData(prev => ({
        ...prev,
        [currentDateKey]: {
          ...getCurrentData(),
          ...updates,
        },
      }))
    },
    [currentDateKey, getCurrentData]
  )

  const data = getCurrentData()

  // Handlers for each section
  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }
      updateCurrentData({
        appointments: [...data.appointments, newAppointment],
      })
    },
    [data.appointments, updateCurrentData]
  )

  const handleToggleTop3 = useCallback(
    (id: string) => {
      updateCurrentData({
        top3: data.top3.map(item =>
          item.id === id ? { ...item, done: !item.done } : item
        ),
      })
    },
    [data.top3, updateCurrentData]
  )

  const handleAddTop3 = useCallback(
    (title: string) => {
      if (data.top3.length < 3) {
        const newItem: Top3Item = {
          id: Math.random().toString(36).slice(2, 9),
          title,
          done: false,
        }
        updateCurrentData({
          top3: [...data.top3, newItem],
        })
      }
    },
    [data.top3, updateCurrentData]
  )

  const handleToggleCareItem = useCallback(
    (id: string, type: 'care' | 'family') => {
      const field = type === 'care' ? 'careItems' : 'familyItems'
      updateCurrentData({
        [field]: data[field].map(item =>
          item.id === id ? { ...item, done: !item.done } : item
        ),
      })
    },
    [data, updateCurrentData]
  )

  const handleAddCareItem = useCallback(
    (title: string, type: 'care' | 'family') => {
      const field = type === 'care' ? 'careItems' : 'familyItems'
      const newItem: CareItem = {
        id: Math.random().toString(36).slice(2, 9),
        title,
        done: false,
        source: 'manual',
      }
      updateCurrentData({
        [field]: [...data[field], newItem],
      })
    },
    [data, updateCurrentData]
  )

  const handleNotesChange = useCallback(
    (content: string) => {
      updateCurrentData({ notes: content })
    },
    [updateCurrentData]
  )

  // Calculate week data for WeekView
  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const monday = getMonday(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

  const weekData = weekDays.map((date, idx) => {
    const dateKey = getDateKey(date)
    const dayData = plannerData[dateKey]

    return {
      dayNumber: date.getDate(),
      dayName: dayNames[idx],
      agendaCount: dayData?.appointments.length || 0,
      top3Count: dayData?.top3.length || 0,
      careCount: dayData?.careItems.length || 0,
      familyCount: dayData?.familyItems.length || 0,
    }
  })

  // Calculate total open tasks for Hoje
  const totalTasksHoje = data.appointments.length + data.top3.filter(t => !t.done).length + data.careItems.filter(c => !c.done).length + data.familyItems.filter(f => !f.done).length

  return (
    <Reveal delay={200}>
      <SoftCard className="p-4 md:p-6 space-y-6">
        {/* Planner Header with Toggle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#2f3a56]">
              Planner da semana
            </h2>
            <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
              Organize seus compromissos, prioridades e cuidados em um só lugar.
            </p>
          </div>

          {/* Toggle */}
          <div className="inline-flex bg-[#f5f5f5] rounded-full p-1 w-fit">
            <button
              onClick={() => setViewMode('hoje')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all relative ${
                viewMode === 'hoje'
                  ? 'bg-white text-[#ff005e] shadow-sm'
                  : 'text-[#545454] hover:text-[#2f3a56]'
              }`}
            >
              Hoje
              {totalTasksHoje > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#ff005e] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalTasksHoje}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                viewMode === 'semana'
                  ? 'bg-white text-[#ff005e] shadow-sm'
                  : 'text-[#545454] hover:text-[#2f3a56]'
              }`}
            >
              Semana
            </button>
          </div>
        </div>

        {/* Day Calendar Strip */}
        <div>
          <p className="text-xs md:text-sm font-semibold text-[#545454]/70 uppercase tracking-wide mb-2">
            Selecione um dia
          </p>
          <DayCalendarStrip
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Content based on view mode */}
        {viewMode === 'hoje' ? (
          <div className="space-y-6">
            {/* Two Column Layout on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <AgendaSection
                  items={data.appointments}
                  onAddAppointment={handleAddAppointment}
                />

                <Top3Section
                  items={data.top3}
                  onToggle={handleToggleTop3}
                  onAdd={handleAddTop3}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <CareSection
                  title="Cuidar de mim"
                  subtitle="Momentos de autocuidado ao longo do dia."
                  icon="heart"
                  items={data.careItems}
                  onToggle={id => handleToggleCareItem(id, 'care')}
                  onAdd={title => handleAddCareItem(title, 'care')}
                  placeholder="Nova ação de autocuidado..."
                />

                <CareSection
                  title="Cuidar da família"
                  subtitle="Tarefas importantes com e para os filhos."
                  icon="smile"
                  items={data.familyItems}
                  onToggle={id => handleToggleCareItem(id, 'family')}
                  onAdd={title => handleAddCareItem(title, 'family')}
                  placeholder="Nova ação com a família..."
                />

                <NotesSection
                  content={data.notes}
                  onChange={handleNotesChange}
                />
              </div>
            </div>

            {/* Saved Contents */}
            {data.savedContents.length > 0 && (
              <SavedContentsSection contents={data.savedContents} />
            )}
          </div>
        ) : (
          <WeekView weekData={weekData} />
        )}
      </SoftCard>
    </Reveal>
  )
}
