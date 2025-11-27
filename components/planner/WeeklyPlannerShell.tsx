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
import { useSavedInspirations } from '@/app/hooks/useSavedInspirations'
import {
  usePlannerSavedContents,
  type PlannerSavedContent,
} from '@/app/hooks/usePlannerSavedContents'

import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import SavedContentDrawer from '@/components/ui/SavedContentDrawer'
import WeekView from './WeekView'
import NotesSection from './NotesSection'
import { Reveal } from '@/components/ui/Reveal'
import { IntelligentSuggestionsSection } from './IntelligentSuggestionsSection'
import SavedContentsSection from './SavedContentsSection'

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

  // Sugestões & salvos
  const [selectedSavedItem, setSelectedSavedItem] =
    useState<PlannerSavedContent | null>(null)
  const [isSavedItemOpen, setIsSavedItemOpen] = useState(false)

  const { savedItems: savedContents } = useSavedInspirations()
  const plannerHook = usePlannerSavedContents()

  // Estado local para IA (humor + intenção do dia)
  const [mood, setMood] = useState<string | null>(null)
  const [dayIntention, setDayIntention] = useState<string | null>(null)

  // Modal de compromisso (calendário)
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

            {/* === Cabeçalho dos dias === */}
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

              {/* === Grade do mês === */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {generateMonthMatrix(selectedDate).map(
                  (day, i) =>
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
                      <div
                        key={i}
                        className="h-8 md:h-9"
                      />
                    ),
                )}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <p className="text-xs md:text-sm text-[var(--color-text-muted)] text-center">
                Tudo aqui vale para:{' '}
                <span className="font-semibold">
                  {formattedDate}
                </span>
              </p>
              <p className="text-[10px] md:text-xs text-[var(--color-text-muted)]/70 text-center">
                Toque em um dia para adicionar compromissos e organizar
                sua rotina.
              </p>
            </div>
          </SoftCard>

          {/* =====================================================
              HUMOR + SUGESTÕES INTELIGENTES (lado a lado)
          ===================================================== */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Card COMO VOCÊ ESTÁ */}
            <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-4 md:p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Hoje por aqui
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                  Como você está hoje?
                </h2>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                  Escolha como você se sente agora e o estilo de dia que
                  você gostaria de ter.
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* COMO VOCÊ ESTÁ */}
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                    Como você está?
                  </p>
                  <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                    Escolha como você se sente agora.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { key: 'happy', label: 'Feliz' },
                      { key: 'normal', label: 'Normal' },
                      { key: 'stressed', label: 'Estressada' },
                    ].map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          setMood(prev =>
                            prev === option.key ? null : option.key,
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                          mood === option.key
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.4)]'
                            : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* HOJE EU QUERO UM DIA... */}
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                    Hoje eu quero um dia...
                  </p>
                  <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                    Selecione o estilo do seu dia.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      'leve',
                      'focado',
                      'produtivo',
                      'slow',
                      'automático',
                    ].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setDayIntention(prev =>
                            prev === option ? null : option,
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                          dayIntention === option
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.4)]'
                            : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-2">
                {moodSummary}
              </p>
            </SoftCard>

            {/* Card SUGESTÕES INTELIGENTES (IA) */}
            <IntelligentSuggestionsSection
              mood={mood}
              intention={dayIntention}
            />
          </section>

          {/* =====================================================
              INSPIRAÇÕES & CONTEÚDOS SALVOS
          ===================================================== */}
          <div className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
              Inspirações &amp; conteúdos salvos
            </h2>
            <p className="mt-1 mb-3 text-sm md:text-base text-[var(--color-text-muted)]">
              Receitas, ideias, brincadeiras e conteúdos que você salvou
              nos mini-hubs.
            </p>

            {plannerHook.items.length > 0 ||
            savedContents.length > 0 ? (
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
              <SoftCard className="p-5 md:p-6 text-center py-6 rounded-3xl border border-[var(--color-soft-strong)] bg-white/95 shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                <AppIcon
                  name="bookmark"
                  className="w-8 h-8 text-[var(--color-border-muted)] mx-auto mb-3"
                />
                <p className="text-sm md:text-base text-[var(--color-text-muted)]/80 mb-3">
                  Quando você salvar receitas, brincadeiras ou conteúdos
                  nos mini-hubs, eles aparecem aqui.
                </p>
                <Link
                  href="/biblioteca-materna"
                  className="inline-flex items-center gap-1 text-sm md:text-base font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
                >
                  Ver tudo na Biblioteca Materna
                  <AppIcon name="info" className="w-4 h-4" />
                </Link>
              </SoftCard>
            )}
          </div>

          {/* =====================================================
              VISÃO DIA (Lembretes + Atalhos vidro)
          ===================================================== */}
          {viewMode === 'day' && (
            <div className="mt-8 md:mt-10 space-y-8 md:space-y-10 pb-12">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
                {/* LEMBRETES RÁPIDOS */}
                <div className="flex h-full">
                  <SoftCard className="flex-1 h-full rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.05)] p-4 md:p-5 flex flex-col">
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-1">
                      Lembretes rápidos
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                      Anote pensamentos, recados e pequenas coisas para
                      lembrar ao longo do dia.
                    </p>
                    <div className="flex-1">
                      <NotesSection
                        content={plannerData.notes}
                        onChange={v =>
                          setPlannerData(p => ({
                            ...p,
                            notes: v,
                          }))
                        }
                        hideTitle
                      />
                    </div>
                  </SoftCard>
                </div>

                {/* ATALHOS DO DIA – card vidro 2x2 */}
                <div className="flex h-full">
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/10 shadow-[0_22px_55px_rgba(255,20,117,0.12)] px-3 py-3 md:px-4 md:py-4 backdrop-blur-2xl">
                    {/* Glows de fundo */}
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
                          Use esses atalhos para ir direto para prioridades,
                          compromissos ou cuidados.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">
                        {/* Prioridades do dia */}
                        <Link
                          href="/meu-dia#prioridades"
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

                        {/* Agenda & compromissos */}
                        <Link
                          href="/meu-dia#agenda"
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
                          href="/meu-dia#cuidar-de-mim"
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

                        {/* Cuidar do meu filho */}
                        <Link
                          href="/meu-dia#cuidar-do-meu-filho"
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
            </div>
          )}

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
