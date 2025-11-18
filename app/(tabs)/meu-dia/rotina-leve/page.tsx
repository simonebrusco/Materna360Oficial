'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface DayPrioritiesData {
  topThree: string
  appointments: string
  minimalGoal: string
}

interface PlanMyDayData {
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

interface ChecklistData {
  homeChecklist: string
  workChecklist: string
  selfCareChecklist: string
}

interface NotesListsData {
  notes: string
  bulletList: string
}

interface RecipesData {
  recipe1: string
  recipe2: string
  recipe3: string
}

interface InspirationsData {
  motivation: string
  tip: string
}

interface NavCard {
  id: string
  title: string
  description: string
  href: string
  icon: KnownIconName
}

const QUICK_ACCESS_CARDS: NavCard[] = [
  {
    id: 'receitas',
    title: 'Receitas Saudáveis',
    description: 'Ideias rápidas e nutritivas para toda a família.',
    href: '/cuidar/receitas-saudaveis',
    icon: 'leaf',
  },
]

const ESSENTIAL_DAY_CARDS: NavCard[] = [
  {
    id: 'planejar-dia',
    title: 'Planejar o Dia',
    description: 'Comece organizando o essencial.',
    href: '/meu-dia?focus=planejar-o-dia',
    icon: 'calendar',
  },
  {
    id: 'rotina-casa',
    title: 'Rotina da Casa',
    description: 'Tarefas do lar com praticidade.',
    href: '/meu-dia?focus=rotina-da-casa',
    icon: 'home',
  },
]

const FAMILY_ROUTINE_CARDS: NavCard[] = [
  {
    id: 'rotina-filho',
    title: 'Rotina do Filho',
    description: 'Organização do dia da criança.',
    href: '/meu-dia?focus=rotina-do-filho',
    icon: 'heart',
  },
  {
    id: 'prioridades-semana',
    title: 'Prioridades da Semana',
    description: 'O que realmente importa nesta semana.',
    href: '/meu-dia?focus=prioridades-da-semana',
    icon: 'star',
  },
]

const TOOLS_CARDS: NavCard[] = [
  {
    id: 'checklist-mae',
    title: 'Checklist da Mãe',
    description: 'Pequenas ações que fazem diferença.',
    href: '/meu-dia?focus=checklist-da-mae',
    icon: 'check',
  },
  {
    id: 'notas-listas',
    title: 'Notas & Listas',
    description: 'Anotações rápidas e listas essenciais.',
    href: '/meu-dia?focus=notas-e-listas',
    icon: 'bookmark',
  },
]

export default function RotinaLevePage() {
  const [isHydrated, setIsHydrated] = useState(false)

  // State variables (kept for potential future use, not removed)
  const [dayPriorities, setDayPriorities] = useState<DayPrioritiesData>({
    topThree: '',
    appointments: '',
    minimalGoal: '',
  })
  const [planMyDay, setPlanMyDay] = useState<PlanMyDayData>({
    remember: '',
    quickTasks: '',
  })
  const [homeTasks, setHomeTasks] = useState<HomeTasksData>({
    kitchen: false,
    laundry: false,
    cleaning: false,
    focusOfDay: '',
  })
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
  const [checklist, setChecklist] = useState<ChecklistData>({
    homeChecklist: '',
    workChecklist: '',
    selfCareChecklist: '',
  })
  const [notesLists, setNotesLists] = useState<NotesListsData>({
    notes: '',
    bulletList: '',
  })
  const [recipes, setRecipes] = useState<RecipesData>({
    recipe1: '',
    recipe2: '',
    recipe3: '',
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

    const dayPrioritiesKey = `rotina-leve:${currentDateKey}:dayPriorities`
    const planMyDayKey = `rotina-leve:${currentDateKey}:planMyDay`
    const homeTasksKey = `rotina-leve:${currentDateKey}:homeTasks`
    const childRoutineKey = `rotina-leve:${currentDateKey}:childRoutine`
    const familyWeeklyKey = `rotina-leve:${currentDateKey}:familyWeekly`
    const checklistKey = `rotina-leve:${currentDateKey}:checklist`
    const notesListsKey = `rotina-leve:${currentDateKey}:notesLists`
    const recipesKey = `rotina-leve:${currentDateKey}:recipes`
    const inspirationsKey = `rotina-leve:${currentDateKey}:inspirations`

    const savedDayPriorities = load(dayPrioritiesKey)
    const savedPlanMyDay = load(planMyDayKey)
    const savedHomeTasks = load(homeTasksKey)
    const savedChildRoutine = load(childRoutineKey)
    const savedFamilyWeekly = load(familyWeeklyKey)
    const savedChecklist = load(checklistKey)
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
    if (typeof savedChecklist === 'object' && savedChecklist !== null)
      setChecklist(savedChecklist as ChecklistData)
    if (typeof savedNotesLists === 'object' && savedNotesLists !== null)
      setNotesLists(savedNotesLists as NotesListsData)
    if (typeof savedRecipes === 'object' && savedRecipes !== null)
      setRecipes(savedRecipes as RecipesData)
    if (typeof savedInspirations === 'object' && savedInspirations !== null)
      setInspirations(savedInspirations as InspirationsData)
  }, [isHydrated, currentDateKey])

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
          {/* SECTION 1 — Organização do Dia */}
          <Reveal delay={0}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Organização do Dia
              </h2>
              <p className="text-sm text-[#545454]">
                Comece planejando sua rotina com clareza e leveza.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {ESSENTIAL_DAY_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={50 + index * 25}>
                <Link href={card.href}>
                  <SoftCard className="rounded-3xl p-6 md:p-8 h-full cursor-pointer hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <AppIcon
                        name={card.icon}
                        size={24}
                        className="text-primary flex-shrink-0"
                        decorative
                      />
                      <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {card.description}
                    </p>
                  </SoftCard>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* SECTION 2 — Rotina da Família */}
          <Reveal delay={100}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Rotina da Família
              </h2>
              <p className="text-sm text-[#545454]">
                Acompanhe a rotina de sua família com harmonia.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {FAMILY_ROUTINE_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={150 + index * 25}>
                <Link href={card.href}>
                  <SoftCard className="rounded-3xl p-6 md:p-8 h-full cursor-pointer hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <AppIcon
                        name={card.icon}
                        size={24}
                        className="text-primary flex-shrink-0"
                        decorative
                      />
                      <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {card.description}
                    </p>
                  </SoftCard>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* SECTION 3 — Ferramentas da Mãe */}
          <Reveal delay={200}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Ferramentas da Mãe
              </h2>
              <p className="text-sm text-[#545454]">
                Pequenas ações que fazem uma grande diferença.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {TOOLS_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={250 + index * 25}>
                <Link href={card.href}>
                  <SoftCard className="rounded-3xl p-6 md:p-8 h-full cursor-pointer hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <AppIcon
                        name={card.icon}
                        size={24}
                        className="text-primary flex-shrink-0"
                        decorative
                      />
                      <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {card.description}
                    </p>
                  </SoftCard>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* SECTION 4 — Ideias Rápidas */}
          <Reveal delay={300}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Ideias Rápidas
              </h2>
              <p className="text-sm text-[#545454]">
                Inspire-se com receitas rápidas e práticas.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {QUICK_ACCESS_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={350 + index * 25}>
                <Link href={card.href}>
                  <SoftCard className="rounded-3xl p-6 md:p-8 h-full cursor-pointer hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <AppIcon
                        name={card.icon}
                        size={24}
                        className="text-primary flex-shrink-0"
                        decorative
                      />
                      <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {card.description}
                    </p>
                  </SoftCard>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
