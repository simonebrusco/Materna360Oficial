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

type SectionId = 'priorities' | 'agenda' | 'selfCare' | 'childCare'

const SECTION_CONFIG: Record<
  SectionId,
  {
    label: string
    tag: string
    description: string
    icon: React.ComponentProps<typeof AppIcon>['name']
  }
> = {
  priorities: {
    label: 'Prioridades do dia',
    tag: 'Você',
    description: 'Escolha até três coisas que realmente importam hoje.',
    icon: 'bookmark',
  },
  agenda: {
    label: 'Agenda & compromissos',
    tag: 'Rotina',
    description:
      'Compromissos com horário para enxergar seu dia com clareza.',
    icon: 'calendar',
  },
  selfCare: {
    label: 'Cuidar de mim',
    tag: 'Você',
    description: 'Pequenos gestos que cuidam da sua energia.',
    icon: 'heart',
  },
  childCare: {
    label: 'Cuidar do meu filho',
    tag: 'Seu filho',
    description: 'Um momento de conexão faz diferença no dia.',
    icon: 'smile',
  },
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

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // atalho ativo (em vez de 4 blocões empilhados)
  const [activeSection, setActiveSection] =
    useState<SectionId>('priorities')

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

  const monthYear = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDateKey, isHydrated])

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

  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
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

  if (!isHydrated) return null

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* BLOCO 1 — CALENDÁRIO ESTRELA */}
        <SoftCard className="p-4 md:p-6 space-y-4 md:space-y-5 rounded-3xl border border-[var(--color-border-soft)] shadow-[0_14px_40px_rgba(0,0,0,0.05)] bg-white/90">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-soft-strong)]/80 px-3 py-1 text-[11px] md:text-xs font-semibold tracking-[0.18em] text-[var(--color-brand)] uppercase">
                <AppIcon name="calendar" className="w-3.5 h-3.5" />
                Seu planner de hoje
              </span>
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] capitalize">
                {monthYear || 'Carregando mês…'}
              </h2>
              <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                Tudo o que você organiza abaixo vale para:{' '}
                <span className="font-semibold">
                  {capitalizedDateFormatted}
                </span>
                . Toque em outro dia para mudar o foco.
              </p>
            </div>

            <div className="inline-flex self-start md:self-auto rounded-full bg-[var(--color-soft-bg)] px-1 py-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.18)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.18)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

          <DayCalendarStrip
            selectedDate={selectedDate}
            selectedDateKey={selectedDateKey}
            onDateSelect={handleDateSelect}
          />
        </SoftCard>

        {/* VISÃO DIA */}
        {viewMode === 'day' && (
          <div className="space-y-6 md:space-y-7 pb-12">
            {/* BLOCO 2 — ATALHOS 2x2 (estilo Maternar) */}
            <SoftCard className="p-4 md:p-5 rounded-3xl bg-white/90 border border-[var(--color-border-soft)]">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div>
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                    Atalhos do dia
                  </p>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-md">
                    Toque em um atalho para organizar primeiro aquilo que
                    faz mais sentido pra você hoje.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {(
                  [
                    'priorities',
                    'agenda',
                    'selfCare',
                    'childCare',
                  ] as SectionId[]
                ).map((id) => {
                  const config = SECTION_CONFIG[id]
                  const isActive = activeSection === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveSection(id)}
                      className={`group relative flex flex-col items-start justify-between rounded-2xl border px-3 py-3 md:px-4 md:py-4 text-left transition-all ${
                        isActive
                          ? 'border-[var(--color-brand)] bg-[var(--color-soft-strong)]/80 shadow-[0_10px_25px_rgba(255,0,94,0.18)]'
                          : 'border-[var(--color-border-soft)] bg-white/80 hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-soft-bg)]'
                      }`}
                    >
                      <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] md:text-[11px] font-semibold tracking-wide uppercase text-[var(--color-text-muted)] mb-2">
                        {config.tag}
                      </span>
                      <div className="flex items-center gap-2 md:gap-2.5 mb-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border text-[var(--color-brand)] ${
                            isActive
                              ? 'border-[var(--color-brand)] bg-white'
                              : 'border-[var(--color-border-soft)] bg-[var(--color-soft-bg)]'
                          }`}
                        >
                          <AppIcon
                            name={config.icon}
                            className="w-4 h-4"
                          />
                        </div>
                        <span className="text-[11px] md:text-sm font-semibold text-[var(--color-text-main)]">
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] line-clamp-2">
                        {config.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </SoftCard>

            {/* BLOCO 3 — CONTEÚDO DETALHADO (apenas UMA seção por vez) */}
            <SoftCard className="p-4 md:p-6 rounded-3xl bg-white/95 border border-[var(--color-border-soft)] space-y-4 md:space-y-5">
              {activeSection === 'priorities' && (
                <>
                  <header className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                      Você
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Prioridades do dia
                    </h2>
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
                      Escolha até três coisas que realmente importam hoje.
                    </p>
                  </header>
                  <Top3Section
                    items={plannerData.top3}
                    onToggle={handleToggleTop3}
                    onAdd={handleAddTop3}
                    hideTitle
                  />
                </>
              )}

              {activeSection === 'agenda' && (
                <>
                  <header className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                      Rotina
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Agenda &amp; compromissos
                    </h2>
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
                      Compromissos com horário, para você enxergar seu dia
                      com clareza.
                    </p>
                  </header>
                  <AgendaSection
                    items={plannerData.appointments}
                    onAddAppointment={handleAddAppointment}
                    hideTitle
                  />
                </>
              )}

              {activeSection === 'selfCare' && (
                <>
                  <header className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                      Você
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Cuidar de mim
                    </h2>
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
                      Pequenos gestos que cuidam da sua energia durante o
                      dia.
                    </p>
                  </header>
                  <CareSection
                    title="Cuidar de mim"
                    subtitle="Atividades de autocuidado."
                    icon="heart"
                    items={plannerData.careItems}
                    onToggle={(id) => handleToggleCareItem(id, 'care')}
                    onAdd={(title) =>
                      handleAddCareItem(title, 'care')
                    }
                    placeholder="Novo gesto de autocuidado…"
                    hideTitle
                  />
                </>
              )}

              {activeSection === 'childCare' && (
                <>
                  <header className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                      Seu filho
                    </span>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Cuidar do meu filho
                    </h2>
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
                      Um momento de conexão faz diferença no dia.
                    </p>
                  </header>
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
                </>
              )}
            </SoftCard>

            {/* BLOCO 4 — INSPIRAÇÕES & CONTEÚDOS SALVOS */}
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                Inspirações
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                  Inspirações &amp; conteúdos salvos
                </h2>
                <p className="mt-1 mb-3 text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
                  Receitas, ideias, brincadeiras e conteúdos que você salvou
                  nos mini-hubs para acessar quando precisar.
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

            {/* BLOCO 5 — LEMBRETES RÁPIDOS */}
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                Lembretes
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                  Lembretes rápidos
                </h2>
                <p className="mt-1 mb-3 text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
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

        {/* VISÃO SEMANA */}
        {viewMode === 'week' && (
          <div className="space-y-4 pb-10">
            <div className="text-center mb-4">
              <p className="text-sm text-[var(--color-text-muted)]/70">
                Visão geral da sua semana. Toque em um dia para ver em
                detalhes.
              </p>
            </div>
            <WeekView weekData={weekData} />
          </div>
        )}
      </div>
    </Reveal>
  )
}
