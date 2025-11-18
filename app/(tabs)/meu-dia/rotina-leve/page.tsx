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

interface NavCard {
  id: string
  title: string
  description: string
  href: string
  icon: KnownIconName
}

interface AccordionItem {
  id: string
  title: string
  description: string
  content: React.ReactNode
}

const INSPIRATION_CARDS: NavCard[] = [
  {
    id: 'ideias-rapidas',
    title: 'Ideias Rápidas',
    description: 'Quick ideas to bring more lightness to your day.',
    href: '/descobrir',
    icon: 'lightbulb',
  },
  {
    id: 'receitas-inteligentes',
    title: 'Receitas Inteligentes',
    description: 'Type an ingredient and get a smart recipe suggestion.',
    href: '/cuidar/receitas-saudaveis',
    icon: 'leaf',
  },
  {
    id: 'inspiracoes-do-dia',
    title: 'Inspirações do Dia',
    description: 'Your daily dose of motivation.',
    href: '/maternar/inspiracoes',
    icon: 'sparkles',
  },
]

const ORGANIZATION_CARDS: NavCard[] = [
  {
    id: 'planejar-o-dia',
    title: 'Planejar o Dia',
    description: 'Organize the essentials.',
    href: '/meu-dia?focus=planejar-o-dia',
    icon: 'calendar',
  },
  {
    id: 'rotina-da-casa',
    title: 'Rotina da Casa',
    description: 'Manage home tasks with clarity.',
    href: '/meu-dia?focus=rotina-da-casa',
    icon: 'home',
  },
  {
    id: 'rotina-da-familia',
    title: 'Rotina da Família',
    description: 'Keep track of the family schedule.',
    href: '/meu-dia?focus=rotina-do-filho',
    icon: 'heart',
  },
]

const TOOLS_CARDS: NavCard[] = [
  {
    id: 'prioridades-semana',
    title: 'Prioridades da Semana',
    description: 'What really matters this week.',
    href: '/meu-dia?focus=prioridades-da-semana',
    icon: 'star',
  },
  {
    id: 'checklist-mae',
    title: 'Checklist da Mãe',
    description: 'Your essential tasks.',
    href: '/meu-dia?focus=checklist-da-mae',
    icon: 'check',
  },
  {
    id: 'notas-listas',
    title: 'Notas & Listas',
    description: 'Quick notes and checklists.',
    href: '/meu-dia?focus=notas-e-listas',
    icon: 'bookmark',
  },
]

const FILTER_OPTIONS = ['Hoje', 'Pessoal', 'Casa', 'Filhos', 'Semana']

export default function RotinaLevePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Hoje')
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null)
  const [recurringTasks, setRecurringTasks] = useState('')
  const [reminders, setReminders] = useState('')

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const recurringTasksKey = `rotina-leve:${currentDateKey}:recurringTasks`
    const remindersKey = `rotina-leve:${currentDateKey}:reminders`

    const savedRecurringTasks = load(recurringTasksKey)
    const savedReminders = load(remindersKey)

    if (typeof savedRecurringTasks === 'string') setRecurringTasks(savedRecurringTasks)
    if (typeof savedReminders === 'string') setReminders(savedReminders)
  }, [isHydrated, currentDateKey])

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(expandedAccordion === id ? null : id)
  }

  const handleSaveRecurringTasks = () => {
    if (!recurringTasks.trim()) return
    const recurringTasksKey = `rotina-leve:${currentDateKey}:recurringTasks`
    save(recurringTasksKey, recurringTasks)
    try {
      track('rotina_leve.recurring_tasks.saved', { tab: 'meu-dia-rotina-leve' })
    } catch {}
    toast.success('Tarefas salvas!')
  }

  const handleSaveReminders = () => {
    if (!reminders.trim()) return
    const remindersKey = `rotina-leve:${currentDateKey}:reminders`
    save(remindersKey, reminders)
    try {
      track('rotina_leve.reminders.saved', { tab: 'meu-dia-rotina-leve' })
    } catch {}
    toast.success('Lembretes salvos!')
  }

  if (!isHydrated) {
    return null
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve, Dia Mais Tranquilo"
      subtitle="Simplify your day with clarity, kindness and practicality. Here, you organize routines without pressure."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* SECTION 1 — Inspire o Seu Dia */}
          <Reveal delay={0}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Inspire o Seu Dia
              </h2>
              <p className="text-sm text-[#545454]">
                Comece com ideias, receitas e motivação.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {INSPIRATION_CARDS.map((card, index) => (
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
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                          {card.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {card.description}
                    </p>
                  </SoftCard>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* SECTION 2 — Organização do Dia */}
          <Reveal delay={125}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Organização do Dia
              </h2>
              <p className="text-sm text-[#545454]">
                Comece a organizar sua rotina com leveza.
              </p>
            </div>
          </Reveal>

          {/* Filter Pills */}
          <Reveal delay={150}>
            <div className="flex flex-wrap gap-2 mb-2">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeFilter === filter
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white/60 text-[#2f3a56] hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {ORGANIZATION_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={200 + index * 25}>
                <Link href={card.href}>
                  <SoftCard className="rounded-3xl p-6 md:p-8 h-full cursor-pointer hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <AppIcon
                        name={card.icon}
                        size={24}
                        className="text-primary flex-shrink-0"
                        decorative
                      />
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                          {card.title}
                        </h3>
                      </div>
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
          <Reveal delay={275}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Ferramentas da Mãe
              </h2>
              <p className="text-sm text-[#545454]">
                Pequenas ações que fazem grande diferença.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {TOOLS_CARDS.map((card, index) => (
              <Reveal key={card.id} delay={325 + index * 25}>
                <Link href={card.href}>
                  <SoftCard className="rounded-3xl p-6 md:p-8 h-full cursor-pointer hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <AppIcon
                        name={card.icon}
                        size={24}
                        className="text-primary flex-shrink-0"
                        decorative
                      />
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                          {card.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {card.description}
                    </p>
                  </SoftCard>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* SECTION 4 — Extras Inteligentes (Accordion) */}
          <Reveal delay={400}>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                Extras Inteligentes
              </h2>
              <p className="text-sm text-[#545454]">
                Recursos adicionais, quando você precisar.
              </p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {/* Accordion Item 1 — Tarefas Recorrentes */}
            <Reveal delay={450}>
              <div
                className="rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => toggleAccordion('tarefas-recorrentes')}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                      Tarefas Recorrentes
                    </h4>
                    <p className="text-xs text-[#545454]">
                      Suas tarefas que se repetem regularmente.
                    </p>
                  </div>
                  <span className={`text-lg font-semibold text-primary ml-3 transition-transform duration-200 ${
                    expandedAccordion === 'tarefas-recorrentes' ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </div>

                {expandedAccordion === 'tarefas-recorrentes' && (
                  <div className="border-t border-white/40 p-4 bg-white/30">
                    <textarea
                      value={recurringTasks}
                      onChange={(e) => setRecurringTasks(e.target.value)}
                      placeholder="Escreva suas tarefas recorrentes aqui..."
                      className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveRecurringTasks()
                      }}
                      className="mt-3 w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
                    >
                      Salvar Tarefas
                    </button>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Accordion Item 2 — Lembretes Inteligentes */}
            <Reveal delay={475}>
              <div
                className="rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => toggleAccordion('lembretes-inteligentes')}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                      Lembretes Inteligentes
                    </h4>
                    <p className="text-xs text-[#545454]">
                      Lembretes personalizados para seu dia.
                    </p>
                  </div>
                  <span className={`text-lg font-semibold text-primary ml-3 transition-transform duration-200 ${
                    expandedAccordion === 'lembretes-inteligentes' ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </div>

                {expandedAccordion === 'lembretes-inteligentes' && (
                  <div className="border-t border-white/40 p-4 bg-white/30">
                    <textarea
                      value={reminders}
                      onChange={(e) => setReminders(e.target.value)}
                      placeholder="Escreva seus lembretes aqui..."
                      className="w-full h-24 p-3 rounded-2xl bg-white/60 border border-white/40 text-[#2f3a56] placeholder-[#545454] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveReminders()
                      }}
                      className="mt-3 w-full px-4 py-2 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-md"
                    >
                      Salvar Lembretes
                    </button>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
