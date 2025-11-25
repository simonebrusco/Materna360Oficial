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

type OpenPanel =
  | 'priorities'
  | 'agenda'
  | 'selfCare'
  | 'familyCare'
  | null

function QuickPanelCard(props: {
  id: OpenPanel
  icon: string
  label: string
  title: string
  subtitle: string
  isActive: boolean
  onClick: () => void
}) {
  const { icon, label, title, subtitle, isActive, onClick } = props

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-full w-full flex-col items-stretch rounded-3xl border text-left transition-all ${
        isActive
          ? 'border-[var(--color-brand)] bg-white shadow-[0_14px_34px_rgba(0,0,0,0.12)]'
          : 'border-[#FFE8F2] bg-white/70 hover:border-[var(--color-brand-soft)] hover:bg-white/90 hover:shadow-[0_10px_26px_rgba(0,0,0,0.08)]'
      } p-4 md:p-5`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-soft-strong)]">
            <AppIcon
              name={icon as any}
              className="h-5 w-5 text-[var(--color-brand)]"
            />
          </div>
          <div className="space-y-0.5">
            <span className="inline-flex rounded-full bg-[var(--color-soft-strong)] px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--color-brand)] uppercase">
              {label}
            </span>
            <p className="text-sm font-semibold text-[var(--color-text-main)] md:text-base">
              {title}
            </p>
          </div>
        </div>
        <AppIcon
          name="chevron-down"
          className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${
            isActive ? 'rotate-180' : ''
          }`}
        />
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-muted)] md:text-sm">
        {subtitle}
      </p>
    </button>
  )
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
  const [openPanel, setOpenPanel] = useState<OpenPanel>('priorities')

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

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  if (!isHydrated) return null

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* MINI CALENDÁRIO + TOGGLE */}
        <SoftCard className="space-y-4 p-4 md:space-y-6 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppIcon
                name="calendar"
                className="h-5 w-5 text-[var(--color-brand)]"
              />
              <h2 className="text-lg font-bold capitalize text-[var(--color-text-main)] md:text-xl">
                {monthYear}
              </h2>
            </div>
            <div className="flex gap-2 rounded-full bg-[var(--color-soft-bg)] p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.1)]'
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

          <div className="space-y-1 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Tudo aqui vale para:{' '}
              <span className="font-semibold">
                {capitalizedDateFormatted}
              </span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)]/60">
              Toque em outro dia para planejar ou rever sua semana.
            </p>
          </div>
        </SoftCard>

        {/* VISÃO DIA */}
        {viewMode === 'day' && (
          <div className="space-y-6 pb-12 md:space-y-8">
            {/* ATALHOS 2x2 */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <QuickPanelCard
                id="priorities"
                icon="target"
                label="VOCÊ"
                title="Prioridades do dia"
                subtitle="Escolha até três coisas que realmente importam hoje."
                isActive={openPanel === 'priorities'}
                onClick={() => togglePanel('priorities')}
              />
              <QuickPanelCard
                id="agenda"
                icon="calendar"
                label="ROTINA"
                title="Agenda & compromissos"
                subtitle="Compromissos com horário para enxergar seu dia com clareza."
                isActive={openPanel === 'agenda'}
                onClick={() => togglePanel('agenda')}
              />
              <QuickPanelCard
                id="selfCare"
                icon="heart"
                label="VOCÊ"
                title="Cuidar de mim"
                subtitle="Pequenos gestos para recarregar sua energia."
                isActive={openPanel === 'selfCare'}
                onClick={() => togglePanel('selfCare')}
              />
              <QuickPanelCard
                id="familyCare"
                icon="smile"
                label="SEU FILHO"
                title="Cuidar do meu filho"
                subtitle="Momentos de conexão que fazem diferença no dia."
                isActive={openPanel === 'familyCare'}
                onClick={() => togglePanel('familyCare')}
              />
            </section>

            {/* PAINEL DETALHES — abre conforme o atalho selecionado */}
            {openPanel && (
              <SoftCard className="space-y-4 p-4 md:p-6">
                {openPanel === 'priorities' && (
                  <>
                    <h3 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                      Prioridades do dia
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">
                      Comece adicionando sua primeira prioridade. Você
                      não precisa preencher as três: às vezes, uma única
                      prioridade já muda o dia.
                    </p>
                    <Top3Section
                      items={plannerData.top3}
                      onToggle={handleToggleTop3}
                      onAdd={handleAddTop3}
                      hideTitle
                    />
                  </>
                )}

                {openPanel === 'agenda' && (
                  <>
                    <h3 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                      Agenda & compromissos
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">
                      Adicione compromissos com horário para visualizar o seu
                      dia com clareza.
                    </p>
                    <AgendaSection
                      items={plannerData.appointments}
                      onAddAppointment={handleAddAppointment}
                      hideTitle
                    />
                  </>
                )}

                {openPanel === 'selfCare' && (
                  <>
                    <h3 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                      Cuidar de mim
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">
                      Use este espaço para registrar pequenas pausas, respiros e
                      gestos por você.
                    </p>
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
                  </>
                )}

                {openPanel === 'familyCare' && (
                  <>
                    <h3 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                      Cuidar do meu filho
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">
                      Tarefas e momentos que aproximam sua família e organizam a
                      rotina.
                    </p>
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
            )}

            {/* INSPIRAÇÕES — agora antes dos lembretes */}
            <section className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                INSPIRAÇÕES
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-main)] md:text-xl">
                  Inspirações & conteúdos salvos
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Receitas, ideias e conteúdos que você salvou para usar quando
                  precisar.
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
                <SoftCard className="py-6 p-5 text-center md:p-6">
                  <AppIcon
                    name="bookmark"
                    className="mx-auto mb-3 h-8 w-8 text-[var(--color-border-muted)]"
                  />
                  <p className="mb-3 text-sm text-[var(--color-text-muted)]/70">
                    Quando você salvar receitas, brincadeiras ou conteúdos nos
                    mini-hubs, eles aparecem aqui.
                  </p>
                  <a
                    href="/biblioteca-materna"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] transition-colors hover:text-[var(--color-brand)]/80"
                  >
                    Ver tudo na Biblioteca Materna
                    <AppIcon name="arrow-right" className="h-4 w-4" />
                  </a>
                </SoftCard>
              )}
            </section>

            {/* LEMBRETES — mais compacto */}
            <section className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                LEMBRETES
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-main)] md:text-xl">
                  Lembretes rápidos
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Anotações soltas para não esquecer.
                </p>
              </div>
              <NotesSection
                content={plannerData.notes}
                onChange={handleNotesChange}
                hideTitle
              />
            </section>
          </div>
        )}

        {/* VISÃO SEMANA */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="mb-4 text-center md:mb-6">
              <p className="text-sm text-[var(--color-text-muted)]/70">
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
