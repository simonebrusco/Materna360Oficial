'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

interface ExpandableCardState {
  isOpen: boolean
}

interface DayPrioritiesData {
  topThree: string
  appointments: string
  minimalGoal: string
}

interface PlanMyDayData {
  checklist: string[]
  remember: string
  quickTasks: string
}

interface HomeTasksData {
  kitchen: boolean
  laundry: boolean
  cleaning: boolean
  focusOfDay: string
}

interface ChildRoutineData {
  schoolTime: string
  meals: string
  activities: string
  notes: string
}

interface FamilyWeekData {
  topThree: string
  appointments: string
  reminders: string
  weeklyNotes: string
}

interface MotherChecklistData {
  homeItems: string[]
  workItems: string[]
  selfCareItems: string[]
}

interface NotesListsData {
  notes: string
  bulletList: string
}

interface RecipesData {
  recipe1: string
  recipe2: string
  recipe3: string
  selectedRecipe: string | null
}

interface InspirationsData {
  motivation: string
  tip: string
}

export default function RotinaLevePage() {
  const [isHydrated, setIsHydrated] = useState(false)

  // Expandable card states
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  // Section 1 — My Essential Day
  const [dayPriorities, setDayPriorities] = useState<DayPrioritiesData>({
    topThree: '',
    appointments: '',
    minimalGoal: '',
  })
  const [planMyDay, setPlanMyDay] = useState<PlanMyDayData>({
    checklist: [],
    remember: '',
    quickTasks: '',
  })
  const [homeTasks, setHomeTasks] = useState<HomeTasksData>({
    kitchen: false,
    laundry: false,
    cleaning: false,
    focusOfDay: '',
  })

  // Section 2 — Family Routine
  const [childRoutine, setChildRoutine] = useState<ChildRoutineData>({
    schoolTime: '',
    meals: '',
    activities: '',
    notes: '',
  })
  const [familyWeekly, setFamilyWeekly] = useState<FamilyWeekData>({
    topThree: '',
    appointments: '',
    reminders: '',
    weeklyNotes: '',
  })

  // Section 3 — Tools for Me
  const [motherChecklist, setMotherChecklist] = useState<MotherChecklistData>({
    homeItems: [],
    workItems: [],
    selfCareItems: [],
  })
  const [notesLists, setNotesLists] = useState<NotesListsData>({
    notes: '',
    bulletList: '',
  })

  // Section 4 — Quick Ideas
  const [recipes, setRecipes] = useState<RecipesData>({
    recipe1: '',
    recipe2: '',
    recipe3: '',
    selectedRecipe: null,
  })
  const [inspirations, setInspirations] = useState<InspirationsData>({
    motivation: '',
    tip: '',
  })

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    // Load all persisted data
    const dayPrioritiesKey = `rotina-leve:${currentDateKey}:dayPriorities`
    const planMyDayKey = `rotina-leve:${currentDateKey}:planMyDay`
    const homeTasksKey = `rotina-leve:${currentDateKey}:homeTasks`
    const childRoutineKey = `rotina-leve:${currentDateKey}:childRoutine`
    const familyWeeklyKey = `rotina-leve:${currentDateKey}:familyWeekly`
    const motherChecklistKey = `rotina-leve:${currentDateKey}:motherChecklist`
    const notesListsKey = `rotina-leve:${currentDateKey}:notesLists`
    const recipesKey = `rotina-leve:${currentDateKey}:recipes`
    const inspirationsKey = `rotina-leve:${currentDateKey}:inspirations`

    const savedDayPriorities = load(dayPrioritiesKey)
    const savedPlanMyDay = load(planMyDayKey)
    const savedHomeTasks = load(homeTasksKey)
    const savedChildRoutine = load(childRoutineKey)
    const savedFamilyWeekly = load(familyWeeklyKey)
    const savedMotherChecklist = load(motherChecklistKey)
    const savedNotesLists = load(notesListsKey)
    const savedRecipes = load(recipesKey)
    const savedInspirations = load(inspirationsKey)

    if (typeof savedDayPriorities === 'object' && savedDayPriorities !== null)
      setDayPriorities(savedDayPriorities as DayPrioritiesData)
    if (typeof savedPlanMyDay === 'object' && savedPlanMyDay !== null)
      setPlanMyDay(savedPlanMyDay as PlanMyDayData)
    if (typeof savedHomeTasks === 'object' && savedHomeTasks !== null)
      setHomeTasks(savedHomeTasks as HomeTasksData)
    if (typeof savedChildRoutine === 'object' && savedChildRoutine !== null)
      setChildRoutine(savedChildRoutine as ChildRoutineData)
    if (typeof savedFamilyWeekly === 'object' && savedFamilyWeekly !== null)
      setFamilyWeekly(savedFamilyWeekly as FamilyWeekData)
    if (typeof savedMotherChecklist === 'object' && savedMotherChecklist !== null)
      setMotherChecklist(savedMotherChecklist as MotherChecklistData)
    if (typeof savedNotesLists === 'object' && savedNotesLists !== null)
      setNotesLists(savedNotesLists as NotesListsData)
    if (typeof savedRecipes === 'object' && savedRecipes !== null)
      setRecipes(savedRecipes as RecipesData)
    if (typeof savedInspirations === 'object' && savedInspirations !== null)
      setInspirations(savedInspirations as InspirationsData)
  }, [isHydrated, currentDateKey])

  const toggleCardExpanded = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const saveToPlanner = (section: string, data: unknown) => {
    try {
      track('rotina_leve.save_to_planner', {
        section,
        timestamp: new Date().toISOString(),
      })
    } catch {}
    toast.success(`${section} salvo ao planejador!`)
  }

  const saveCardData = (key: string, data: unknown) => {
    const dataKey = `rotina-leve:${currentDateKey}:${key}`
    save(dataKey, data)
  }

  if (!isHydrated) {
    return null
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve, Dia Mais Tranquilo"
      subtitle="Organize seu dia com carinho, sem cobrança e sem perfeccionismo. Aqui você cria uma rotina que respeita o seu ritmo e o da sua família."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* SECTION 1 — My Essential Day */}
          <Reveal delay={0}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Meu Dia Essencial
              </h2>
              <p className="text-sm text-[#545454] mb-6">
                Organize as prioridades do seu dia com foco e leveza.
              </p>
            </div>
          </Reveal>

          {/* Card 1.1 — My Priorities of the Day */}
          <Reveal delay={50}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('dayPriorities')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Minhas Prioridades do Dia
                </h3>
                <span className="text-primary">
                  {expandedCards['dayPriorities'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['dayPriorities'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Top 3 Prioridades
                    </label>
                    <textarea
                      value={dayPriorities.topThree}
                      onChange={(e) => {
                        const updated = { ...dayPriorities, topThree: e.target.value }
                        setDayPriorities(updated)
                        saveCardData('dayPriorities', updated)
                      }}
                      placeholder="1. ...\n2. ...\n3. ..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Compromissos Importantes
                    </label>
                    <textarea
                      value={dayPriorities.appointments}
                      onChange={(e) => {
                        const updated = { ...dayPriorities, appointments: e.target.value }
                        setDayPriorities(updated)
                        saveCardData('dayPriorities', updated)
                      }}
                      placeholder="Horários e compromissos..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Se eu apenas conseguir fazer isto, está suficiente
                    </label>
                    <textarea
                      value={dayPriorities.minimalGoal}
                      onChange={(e) => {
                        const updated = { ...dayPriorities, minimalGoal: e.target.value }
                        setDayPriorities(updated)
                        saveCardData('dayPriorities', updated)
                      }}
                      placeholder="Seu objetivo mínimo do dia..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Prioridades do Dia', dayPriorities)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* Card 1.2 — Plan My Day */}
          <Reveal delay={100}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('planMyDay')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Planejar o Dia
                </h3>
                <span className="text-primary">
                  {expandedCards['planMyDay'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['planMyDay'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Checklist do Dia
                    </label>
                    <div className="space-y-2">
                      {['Tarefa 1', 'Tarefa 2', 'Tarefa 3', 'Tarefa 4'].map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-primary/60"
                          />
                          <span className="text-sm text-[#2f3a56]">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Preciso me Lembrar...
                    </label>
                    <textarea
                      value={planMyDay.remember}
                      onChange={(e) => {
                        const updated = { ...planMyDay, remember: e.target.value }
                        setPlanMyDay(updated)
                        saveCardData('planMyDay', updated)
                      }}
                      placeholder="Lembretes importantes..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Tarefas Rápidas de Hoje
                    </label>
                    <textarea
                      value={planMyDay.quickTasks}
                      onChange={(e) => {
                        const updated = { ...planMyDay, quickTasks: e.target.value }
                        setPlanMyDay(updated)
                        saveCardData('planMyDay', updated)
                      }}
                      placeholder="Atividades rápidas..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Planejar o Dia', planMyDay)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* Card 1.3 — Home Tasks */}
          <Reveal delay={150}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('homeTasks')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Tarefas da Casa
                </h3>
                <span className="text-primary">
                  {expandedCards['homeTasks'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['homeTasks'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">Áreas</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={homeTasks.kitchen}
                          onChange={(e) => {
                            const updated = { ...homeTasks, kitchen: e.target.checked }
                            setHomeTasks(updated)
                            saveCardData('homeTasks', updated)
                          }}
                          className="w-4 h-4 rounded border-primary/60"
                        />
                        <span className="text-sm text-[#2f3a56]">Cozinha</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={homeTasks.laundry}
                          onChange={(e) => {
                            const updated = { ...homeTasks, laundry: e.target.checked }
                            setHomeTasks(updated)
                            saveCardData('homeTasks', updated)
                          }}
                          className="w-4 h-4 rounded border-primary/60"
                        />
                        <span className="text-sm text-[#2f3a56]">Lavar roupa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={homeTasks.cleaning}
                          onChange={(e) => {
                            const updated = { ...homeTasks, cleaning: e.target.checked }
                            setHomeTasks(updated)
                            saveCardData('homeTasks', updated)
                          }}
                          className="w-4 h-4 rounded border-primary/60"
                        />
                        <span className="text-sm text-[#2f3a56]">Limpeza rápida</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Foco da Casa Hoje
                    </label>
                    <textarea
                      value={homeTasks.focusOfDay}
                      onChange={(e) => {
                        const updated = { ...homeTasks, focusOfDay: e.target.value }
                        setHomeTasks(updated)
                        saveCardData('homeTasks', updated)
                      }}
                      placeholder="Qual será o foco principal..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Tarefas da Casa', homeTasks)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* SECTION 2 — Family Routine */}
          <Reveal delay={200}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Rotina da Família
              </h2>
              <p className="text-sm text-[#545454] mb-6">
                Organize a rotina de toda a família de forma harmoniosa.
              </p>
            </div>
          </Reveal>

          {/* Card 2.1 — Child's Routine */}
          <Reveal delay={250}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('childRoutine')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Rotina do Filho
                </h3>
                <span className="text-primary">
                  {expandedCards['childRoutine'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['childRoutine'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Horário Escolar
                    </label>
                    <input
                      type="text"
                      value={childRoutine.schoolTime}
                      onChange={(e) => {
                        const updated = { ...childRoutine, schoolTime: e.target.value }
                        setChildRoutine(updated)
                        saveCardData('childRoutine', updated)
                      }}
                      placeholder="Horários de entrada e saída..."
                      className="w-full rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Refeições
                    </label>
                    <textarea
                      value={childRoutine.meals}
                      onChange={(e) => {
                        const updated = { ...childRoutine, meals: e.target.value }
                        setChildRoutine(updated)
                        saveCardData('childRoutine', updated)
                      }}
                      placeholder="Horários de refeições..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Atividades
                    </label>
                    <textarea
                      value={childRoutine.activities}
                      onChange={(e) => {
                        const updated = { ...childRoutine, activities: e.target.value }
                        setChildRoutine(updated)
                        saveCardData('childRoutine', updated)
                      }}
                      placeholder="Atividades e aulas..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Notas (Humor, Sono, Comportamento)
                    </label>
                    <textarea
                      value={childRoutine.notes}
                      onChange={(e) => {
                        const updated = { ...childRoutine, notes: e.target.value }
                        setChildRoutine(updated)
                        saveCardData('childRoutine', updated)
                      }}
                      placeholder="Observações do dia..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Rotina do Filho', childRoutine)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* Card 2.2 — Family Priorities of the Week */}
          <Reveal delay={300}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('familyWeekly')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Prioridades da Semana
                </h3>
                <span className="text-primary">
                  {expandedCards['familyWeekly'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['familyWeekly'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Top 3 Prioridades da Família
                    </label>
                    <textarea
                      value={familyWeekly.topThree}
                      onChange={(e) => {
                        const updated = { ...familyWeekly, topThree: e.target.value }
                        setFamilyWeekly(updated)
                        saveCardData('familyWeekly', updated)
                      }}
                      placeholder="1. ...\n2. ...\n3. ..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Compromissos
                    </label>
                    <textarea
                      value={familyWeekly.appointments}
                      onChange={(e) => {
                        const updated = { ...familyWeekly, appointments: e.target.value }
                        setFamilyWeekly(updated)
                        saveCardData('familyWeekly', updated)
                      }}
                      placeholder="Compromissos da semana..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Lembretes Importantes
                    </label>
                    <textarea
                      value={familyWeekly.reminders}
                      onChange={(e) => {
                        const updated = { ...familyWeekly, reminders: e.target.value }
                        setFamilyWeekly(updated)
                        saveCardData('familyWeekly', updated)
                      }}
                      placeholder="Lembretes importantes..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Notas da Semana
                    </label>
                    <textarea
                      value={familyWeekly.weeklyNotes}
                      onChange={(e) => {
                        const updated = { ...familyWeekly, weeklyNotes: e.target.value }
                        setFamilyWeekly(updated)
                        saveCardData('familyWeekly', updated)
                      }}
                      placeholder="Observações gerais..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Prioridades da Semana', familyWeekly)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* SECTION 3 — Tools for Me */}
          <Reveal delay={350}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Ferramentas da Mãe
              </h2>
              <p className="text-sm text-[#545454] mb-6">
                Recursos para apoiar sua rotina e bem-estar.
              </p>
            </div>
          </Reveal>

          {/* Card 3.1 — Mother's Checklist */}
          <Reveal delay={400}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('motherChecklist')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Checklist da Mãe
                </h3>
                <span className="text-primary">
                  {expandedCards['motherChecklist'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['motherChecklist'] && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">Casa</h4>
                    <div className="space-y-2">
                      {['Organizar espaços', 'Limpar cozinha', 'Guardar roupas', 'Varrer casa'].map(
                        (item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-primary/60"
                            />
                            <span className="text-sm text-[#2f3a56]">{item}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">Trabalho</h4>
                    <div className="space-y-2">
                      {['Responder emails', 'Chamar clientes', 'Atualizar agenda', 'Revisar tarefas'].map(
                        (item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-primary/60"
                            />
                            <span className="text-sm text-[#2f3a56]">{item}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">Autocuidado</h4>
                    <div className="space-y-2">
                      {['Beber água', 'Alongar', 'Meditação', 'Tempo para mim'].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-primary/60"
                          />
                          <span className="text-sm text-[#2f3a56]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Checklist da Mãe', motherChecklist)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* Card 3.2 — Notes & Lists */}
          <Reveal delay={450}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('notesLists')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Notas & Listas
                </h3>
                <span className="text-primary">
                  {expandedCards['notesLists'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['notesLists'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Notas Rápidas
                    </label>
                    <textarea
                      value={notesLists.notes}
                      onChange={(e) => {
                        const updated = { ...notesLists, notes: e.target.value }
                        setNotesLists(updated)
                        saveCardData('notesLists', updated)
                      }}
                      placeholder="Suas notas aqui..."
                      className="w-full min-h-[120px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Lista com Bullets
                    </label>
                    <textarea
                      value={notesLists.bulletList}
                      onChange={(e) => {
                        const updated = { ...notesLists, bulletList: e.target.value }
                        setNotesLists(updated)
                        saveCardData('notesLists', updated)
                      }}
                      placeholder="• Item 1\n• Item 2\n• Item 3"
                      className="w-full min-h-[120px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Notas & Listas', notesLists)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* SECTION 4 — Quick Ideas */}
          <Reveal delay={500}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Ideias Rápidas
              </h2>
              <p className="text-sm text-[#545454] mb-6">
                Inspire-se com receitas e dicas para o seu dia.
              </p>
            </div>
          </Reveal>

          {/* Card 4.1 — Healthy Recipes */}
          <Reveal delay={550}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('recipes')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Receitas Saudáveis
                </h3>
                <span className="text-primary">
                  {expandedCards['recipes'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['recipes'] && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-3">
                    {[
                      { key: 'recipe1', label: 'Receita 1' },
                      { key: 'recipe2', label: 'Receita 2' },
                      { key: 'recipe3', label: 'Receita 3' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className="p-3 rounded-2xl border border-white/60 bg-white/60 cursor-pointer hover:bg-white/80 transition-all"
                        onClick={() =>
                          setRecipes({ ...recipes, selectedRecipe: key })
                        }
                      >
                        <input
                          type="text"
                          value={recipes[key as keyof RecipesData] || ''}
                          onChange={(e) => {
                            setRecipes({
                              ...recipes,
                              [key]: e.target.value,
                            })
                            saveCardData('recipes', {
                              ...recipes,
                              [key]: e.target.value,
                            })
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={`${label}: nome da receita (1 linha descrição)`}
                          className="w-full bg-transparent text-sm text-[#2f3a56] placeholder-[#545454]/50 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {recipes.selectedRecipe && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FFE5EF]/40 border border-primary/20">
                      <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                        Detalhes da Receita
                      </h4>
                      <p className="text-sm text-[#545454]">
                        Conteúdo da receita selecionada seria exibido aqui.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Receitas Saudáveis', recipes)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>

          {/* Card 4.2 — Inspirations of the Day */}
          <Reveal delay={600}>
            <SoftCard
              className="rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-200"
              onClick={() => toggleCardExpanded('inspirations')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Inspirações do Dia
                </h3>
                <span className="text-primary">
                  {expandedCards['inspirations'] ? '−' : '+'}
                </span>
              </div>

              {expandedCards['inspirations'] && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Frase Motivadora
                    </label>
                    <textarea
                      value={inspirations.motivation}
                      onChange={(e) => {
                        const updated = { ...inspirations, motivation: e.target.value }
                        setInspirations(updated)
                        saveCardData('inspirations', updated)
                      }}
                      placeholder="Uma frase que te inspire hoje..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                      Dica Rápida para Mães
                    </label>
                    <textarea
                      value={inspirations.tip}
                      onChange={(e) => {
                        const updated = { ...inspirations, tip: e.target.value }
                        setInspirations(updated)
                        saveCardData('inspirations', updated)
                      }}
                      placeholder="Uma dica prática para seu dia..."
                      className="w-full min-h-[80px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] placeholder-[#545454]/50 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToPlanner('Inspirações do Dia', inspirations)}
                    >
                      Salvar ao Planejador
                    </Button>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
