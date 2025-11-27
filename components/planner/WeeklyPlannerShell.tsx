'use client'

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import Link from 'next/link'

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
import { IntelligentSuggestionsSection } from './IntelligentSuggestionsSection'

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
  const [selectedDateKey, setSelectedDateKey] = useState('')
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

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
  // LOAD DATA
  // ===========================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedData: PlannerData = {
      appointments:
        load<Appointment[]>(
          `planner/appointments/${selectedDateKey}`,
          [],
        ) ?? [],
      top3:
        load<Top3Item[]>(`planner/top3/${selectedDateKey}`, []) ?? [],
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
      const newAppointment: Appointment = {
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

  const handleToggleTop3 = useCallback((id: string) => {
    setPlannerData(prev => ({
      ...prev,
      top3: prev.top3.map(item =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    }))
  }, [])

  const handleAddTop3 = useCallback((title: string) => {
    setPlannerData(prev => {
      if (prev.top3.length >= 3) return prev
      return {
        ...prev,
        top3: [
          ...prev.top3,
          {
            id: Math.random().toString(36).slice(2, 9),
            title,
            done: false,
          },
        ],
      }
    })
  }, [])

  const handleToggleCareItem = useCallback(
    (id: string, t: 'care' | 'family') => {
      const key: 'careItems' | 'familyItems' =
        t === 'care' ? 'careItems' : 'familyItems'

      setPlannerData(prev => ({
        ...prev,
        [key]: prev[key].map(item =>
          item.id === id ? { ...item, done: !item.done } : item,
        ),
      }))
    },
    [],
  )

  const handleAddCareItem = useCallback(
    (title: string, t: 'care' | 'family') => {
      const key: 'careItems' | 'familyItems' =
        t === 'care' ? 'careItems' : 'familyItems'

      setPlannerData(prev => ({
        ...prev,
        [key]: [
          ...prev[key],
          {
            id: Math.random().toString(36).slice(2, 9),
            title,
            done: false,
            source: 'manual',
          },
        ],
      }))
    },
    [],
  )

  // ===========================
  // MODAL (NOVO COMPROMISSO)
  // ===========================
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
  // RENDER
  // ===========================
  return (
    <>
      <Reveal delay={150}>
        <div className="space-y-6 md:space-y-8">
          {/* ========================= CALENDÁRIO PREMIUM (SEM DEGRADÊ) ========================= */}
          <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)] p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl">
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
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                    onClick={() => {
                      const d = new Date(selectedDate)
                      d.setMonth(d.getMonth() - 1)
                      handleDateSelect(d)
                    }}
                  >
                    ‹
                  </button>
                  <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
                    {selectedDate.toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h2>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                    onClick={() => {
                      const d = new Date(selectedDate)
                      d.setMonth(d.getMonth() + 1)
                      handleDateSelect(d)
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>

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

            {/* Sem degradê atrás do calendário */}
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
                {generateMonthMatrix(selectedDate).map((day, i) =>
                  day ? (
                    <button
                      key={i}
                      onClick={() => openModalForDate(day)}
                      className={`h-8 md:h-9 rounded-full text-xs md:text-sm flex items-center justify-center transition-all border ${
                        getBrazilDateKey(day) === selectedDateKey
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.45)]'
                          : 'bg-white/80 text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-strong)]/70'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <div key={i} className="h-8 md:h-9" />
                  ),
                )}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <p className="text-xs md:text-sm text-[var(--color-text-muted)] text-center">
                Tudo aqui vale para:{' '}
                <span className="font-semibold">{formattedDate}</span>
              </p>
              <p className="text-[10px] md:text-xs text-[var(--color-text-muted)]/70 text-center">
                Toque em um dia para adicionar compromissos e organizar sua
                rotina.
              </p>
            </div>
          </SoftCard>

          {/* ========================= BLOCOS DE IA JUNTOS (logo abaixo do calendário) ========================= */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Card 1 – Sugestões inteligentes (com IA + fallback) */}
            <IntelligentSuggestionsSection mood={null} intention={null} />

            {/* Card 2 – Resumo complementar do dia (texto guiado) */}
            <SoftCard className="p-5 md:p-6 rounded-3xl border border-[#FFD8E6] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.04)] space-y-3">
              <p className="text-xs md:text-sm font-semibold text-[#FF1475] uppercase tracking-[0.18em]">
                Seu resumo de hoje
              </p>
              <p className="text-sm md:text-base text-[#545454] leading-relaxed">
                Use esse espaço como um lembrete gentil: você não precisa dar
                conta de tudo ao mesmo tempo. Escolha uma prioridade, proteja um
                pequeno momento só seu e deixe o resto mais leve.
              </p>
              <p className="text-xs md:text-sm text-[#9A9A9A]">
                Conforme o app for conhecendo melhor a sua rotina, este bloco
                também poderá trazer resumos mais personalizados para o seu dia.
              </p>
            </SoftCard>
          </section>

          {/* ========================= INSPIRAÇÕES & CONTEÚDOS SALVOS ========================= */}
          <div className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
              Inspirações & conteúdos salvos
            </h2>
            <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)]">
              Receitas, ideias, brincadeiras e conteúdos que você salvou nos
              mini-hubs.
            </p>

            {plannerHook.items.length > 0 || savedContents.length > 0 ? (
              <>
                <SavedContentsSection
                  contents={savedContents}
                  plannerContents={plannerHook.items}
                  onItemClick={item => {
                    setSelectedSavedItem(item)
                    setIsSavedItemOpen(true)
                  }}
                  hideTitle
                />
                <SavedContentDrawer
                  open={isSavedItemOpen}
                  onClose={() => {
                    setIsSavedItemOpen(false)
                    setSelectedSavedItem(null)
                  }}
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

          {/* ========================= VISÃO DIA ========================= */}
          {viewMode === 'day' && (
            <div className="mt-4 md:mt-6 space-y-8 md:space-y-10 pb-12">
              {/* Lembretes + Atalhos */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
                {/* Lembretes rápidos */}
                <div className="flex h-full">
                  <SoftCard className="flex-1 h-full rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.05)] p-4 md:p-5 flex flex-col">
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-1">
                      Lembretes rápidos
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                      Anote pensamentos, recados e pequenas coisas para lembrar
                      ao longo do dia.
                    </p>
                    <div className="flex-1">
                      <NotesSection
                        content={plannerData.notes}
                        onChange={v =>
                          setPlannerData(prev => ({
                            ...prev,
                            notes: v,
                          }))
                        }
                        hideTitle
                      />
                    </div>
                  </SoftCard>
                </div>

                {/* Atalhos do dia – 2x2 */}
                <div className="flex h-full">
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/10 backdrop-blur-2xl shadow-[0_22px_55px_rgba(255,20,117,0.12)] px-3 py-3 md:px-4 md:py-4">
                    <div className="pointer-events-none absolute inset-0 opacity-80">
                      <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                      <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col">
                      <div className="mb-3">
                        <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                          Comece pelo que faz mais sentido hoje
                        </h2>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          Toque em um atalho para abrir um cartão rápido de
                          prioridades, agenda ou cuidados.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">
                        {/* Prioridades */}
                        <Link
                          href="#prioridades-dia"
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="target"
                              className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#CF285F] group-hover:text-[#E6005F]">
                              Prioridades do dia
                            </span>
                          </div>
                        </Link>

                        {/* Agenda */}
                        <Link
                          href="#agenda-compromissos"
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="calendar"
                              className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#CF285F] group-hover:text-[#E6005F]">
                              Agenda &amp; compromissos
                            </span>
                          </div>
                        </Link>

                        {/* Cuidar de mim */}
                        <Link
                          href="#cuidar-de-mim"
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="heart"
                              className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#CF285F] group-hover:text-[#E6005F]">
                              Cuidar de mim
                            </span>
                          </div>
                        </Link>

                        {/* Cuidar do filho */}
                        <Link
                          href="#cuidar-do-meu-filho"
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="smile"
                              className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#CF285F] group-hover:text-[#E6005F]">
                              Cuidar do meu filho
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Prioridades + Agenda */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
                <div className="flex h-full" id="prioridades-dia">
                  <div className="space-y-3 w-full">
                    <span className="inline-flex px-3 py-1 rounded-full bg-[var(--color-soft-strong)] text-xs md:text-sm font-semibold text-[var(--color-brand)]">
                      Você
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                      Prioridades do dia
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Escolha até três coisas que realmente importam hoje.
                    </p>
                    <Top3Section
                      items={plannerData.top3}
                      onToggle={handleToggleTop3}
                      onAdd={handleAddTop3}
                      hideTitle
                    />
                  </div>
                </div>

                <div
                  className="flex h-full"
                  id="agenda-compromissos"
                >
                  <div className="space-y-3 w-full">
                    <span className="inline-flex px-3 py-1 rounded-full bg-[var(--color-soft-strong)] text-xs md:text-sm font-semibold text-[var(--color-brand)]">
                      Rotina
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                      Agenda & compromissos
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Compromissos com horário, para enxergar seu dia
                      com clareza.
                    </p>
                    <AgendaSection
                      items={plannerData.appointments}
                      onAddAppointment={handleAddAppointment}
                      hideTitle
                    />
                  </div>
                </div>
              </section>

              {/* Cuidar de mim + Cuidar do filho */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
                <div className="flex h-full" id="cuidar-de-mim">
                  <div className="space-y-3 w-full">
                    <span className="inline-flex px-3 py-1 rounded-full bg-[var(--color-soft-strong)] text-xs md:text-sm font-semibold text-[var(--color-brand)]">
                      Você
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                      Cuidar de mim
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Pequenos gestos que cuidam da sua energia.
                    </p>
                    <CareSection
                      title="Cuidar de mim"
                      subtitle="Gestos de autocuidado"
                      icon="heart"
                      items={plannerData.careItems}
                      onToggle={id =>
                        handleToggleCareItem(id, 'care')
                      }
                      onAdd={t =>
                        handleAddCareItem(t, 'care')
                      }
                      hideTitle
                    />
                  </div>
                </div>

                <div
                  className="flex h-full"
                  id="cuidar-do-meu-filho"
                >
                  <div className="space-y-3 w-full">
                    <span className="inline-flex px-3 py-1 rounded-full bg-[var(--color-soft-strong)] text-xs md:text-sm font-semibold text-[var(--color-brand)]">
                      Seu filho
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                      Cuidar do meu filho
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Um momento de conexão faz diferença no dia.
                    </p>
                    <CareSection
                      title="Cuidar do meu filho"
                      subtitle="Momentos em família"
                      icon="smile"
                      items={plannerData.familyItems}
                      onToggle={id =>
                        handleToggleCareItem(id, 'family')
                      }
                      onAdd={t =>
                        handleAddCareItem(t, 'family')
                      }
                      hideTitle
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ========================= VISÃO SEMANA ========================= */}
          {viewMode === 'week' && (
            <div className="mt-4">
              <WeekView weekData={generateWeekData(selectedDate)} />
            </div>
          )}
        </div>
      </Reveal>

      {/* ========================= MODAL NOVO COMPROMISSO ========================= */}
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
                  // @ts-expect-error date não faz parte de Appointment original,
                  // se você não usa, pode remover essa linha
                  date: modalDate,
                })
                setIsModalOpen(false)
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}

// =====================================================
// GERADOR DO CALENDÁRIO
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
  onSubmit: (data: { title: string; time: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (!title.trim()) return
        onSubmit({ title, time })
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

