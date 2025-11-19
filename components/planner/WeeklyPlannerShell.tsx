'use client'

import React, { useState, useCallback } from 'react'
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
  // Initialize planner state with mock data
  const [plannerData, setPlannerData] = useState<PlannerData>({
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
  })

  // Calendar and view state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

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
    setSelectedDate(date)
  }, [])

  // Get current month and year for display
  const monthYear = selectedDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  // Format selected date for contextual text
  const selectedDateFormatted = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Capitalize first letter for proper Portuguese formatting
  const capitalizedDateFormatted = selectedDateFormatted.charAt(0).toUpperCase() + selectedDateFormatted.slice(1)

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
          <DayCalendarStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

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
            {/* Two-column grid on desktop, single column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
              {/* LEFT COLUMN */}
              <div className="space-y-10">
                {/* 1. Prioridades do dia */}
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                    VOCÊ
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Prioridades do dia
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454]">
                      Escolha até três coisas que realmente importam hoje.
                    </p>
                  </div>
                  <SoftCard className="p-5 md:p-6 space-y-3">
                    {plannerData.top3.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          item.done
                            ? 'bg-[#f5f5f5] border-[#ddd]'
                            : 'bg-white border-[#f0f0f0] hover:border-[#ff005e]/20'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTop3(item.id)}
                          className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5"
                          style={{
                            borderColor: item.done ? '#ff005e' : '#ddd',
                            backgroundColor: item.done ? '#ff005e' : 'transparent',
                          }}
                        >
                          {item.done && <AppIcon name="check" className="w-3 h-3 text-white" />}
                        </button>
                        <span
                          className={`flex-1 text-sm font-medium ${
                            item.done
                              ? 'text-[#545454]/50 line-through'
                              : 'text-[#2f3a56]'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-xs font-bold text-[#ff005e]/60">{idx + 1}.</span>
                      </div>
                    ))}

                    {plannerData.top3.length < 3 &&
                      Array.from({ length: 3 - plannerData.top3.length }).map((_, idx) => (
                        <div
                          key={`empty-${idx}`}
                          className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[#ddd] bg-[#fafafa]"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-[#ddd] opacity-40" />
                          <span className="flex-1 text-sm text-[#545454]/40">
                            {idx === 0
                              ? 'Primeiro foco de hoje…'
                              : idx === 1
                                ? 'Segundo foco…'
                                : 'Terceiro foco…'}
                          </span>
                          <span className="text-xs font-bold text-[#545454]/20">
                            {plannerData.top3.length + idx + 1}.
                          </span>
                        </div>
                      ))}

                    {plannerData.top3.length === 3 && plannerData.top3.every(item => item.done) && (
                      <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-[#ffe3f0] to-[#fff] border border-[#ff005e]/20 text-center">
                        <p className="text-sm font-semibold text-[#ff005e]">
                          Parabéns! Você concluiu seus 3 focos principais
                        </p>
                      </div>
                    )}

                    {plannerData.top3.length < 3 && (
                      <button
                        onClick={() => {
                          const newTitle = `Foco ${plannerData.top3.length + 1}`
                          handleAddTop3(newTitle)
                        }}
                        className="mt-2 pt-3 border-t border-[#f0f0f0] inline-flex items-center gap-2 text-sm font-medium text-[#ff005e] hover:text-[#ff005e]/80 transition-colors"
                      >
                        <AppIcon name="plus" className="w-4 h-4" />
                        Adicionar foco
                      </button>
                    )}
                  </SoftCard>
                </div>

                {/* 3. Cuidar de mim */}
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                    VOCÊ
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Cuidar de mim
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454]">
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

                {/* 5. Lembretes rápidos */}
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                    LEMBRETES
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Lembretes rápidos
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454]">
                      Anotações soltas para não esquecer.
                    </p>
                  </div>
                  <SoftCard className="p-4 md:p-5">
                    {plannerData.notes.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-[#545454]/60">
                          Ainda não tem nada por aqui — e está tudo bem.
                        </p>
                      </div>
                    ) : null}
                    <textarea
                      value={plannerData.notes}
                      onChange={e => handleNotesChange(e.target.value)}
                      placeholder="Quer tirar algo da cabeça? Anote aqui."
                      className="w-full h-32 md:h-40 px-4 py-3 rounded-lg border border-[#ddd] text-sm font-medium text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30 resize-none"
                    />
                    <p className="text-xs text-[#545454]/50 mt-2">
                      {plannerData.notes.length} caracteres
                    </p>
                  </SoftCard>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-10">
                {/* 2. Casa & rotina */}
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                    ROTINA
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Casa &amp; rotina
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454]">
                      Compromissos com horário, para enxergar seu dia com clareza.
                    </p>
                  </div>
                  <AgendaSection
                    items={plannerData.appointments}
                    onAddAppointment={handleAddAppointment}
                    hideTitle={true}
                  />
                </div>

                {/* 4. Cuidar do meu filho */}
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                    SEU FILHO
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Cuidar do meu filho
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454]">
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

                {/* 6. Inspirações & conteúdos salvos */}
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                    INSPIRAÇÕES
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Inspirações &amp; conteúdos salvos
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[#545454]">
                      Receitas, ideias e conteúdos que você salvou para usar quando precisar.
                    </p>
                  </div>
                  {plannerData.savedContents.length > 0 ? (
                    <SavedContentsSection contents={plannerData.savedContents} hideTitle={true} />
                  ) : (
                    <SoftCard className="p-4 md:p-5 text-center py-6">
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
