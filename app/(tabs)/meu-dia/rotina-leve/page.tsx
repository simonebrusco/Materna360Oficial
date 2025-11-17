'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Card } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { MomInMotion } from '../components/MomInMotion'
import { Checklist } from '@/components/blocks/Checklist'
import { SimplePlannerSheet, type PlannerItem, type PlannerDraft } from '@/components/blocks/SimplePlannerSheet'
import { SimplePlannerList } from '@/components/blocks/SimplePlannerList'
import { useProfile } from '@/app/hooks/useProfile'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { ClientOnly } from '@/components/common/ClientOnly'

interface RoutineCard {
  id: string
  icon: string
  title: string
  subtitle: string
}

const ROUTINE_CARDS: RoutineCard[] = [
  {
    id: 'planejar-dia',
    icon: 'calendar',
    title: 'Planejar o Dia',
    subtitle: 'Comece organizando o essencial.',
  },
  {
    id: 'rotina-casa',
    icon: 'home',
    title: 'Rotina da Casa',
    subtitle: 'Tarefas do lar com praticidade.',
  },
  {
    id: 'rotina-filho',
    icon: 'heart',
    title: 'Rotina do Filho',
    subtitle: 'Organização do dia da criança.',
  },
  {
    id: 'prioridades-semana',
    icon: 'star',
    title: 'Prioridades da Semana',
    subtitle: 'O que realmente importa nesta semana.',
  },
  {
    id: 'checklist-mae',
    icon: 'check-circle',
    title: 'Checklist da Mãe',
    subtitle: 'Pequenas ações que fazem diferença.',
  },
  {
    id: 'notas-listas',
    icon: 'edit',
    title: 'Notas & Listas',
    subtitle: 'Anotações rápidas e listas essenciais.',
  },
  {
    id: 'receitas-saudaveis',
    icon: 'leaf',
    title: 'Receitas Saudáveis',
    subtitle: 'Ideias rápidas com o que você tem em casa.',
  },
]

export default function RotatinaLevePage() {
  const { name } = useProfile()
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])
  const [showPlannerSheet, setShowPlannerSheet] = useState(false)
  const [notes, setNotes] = useState<string[]>([])
  const [noteText, setNoteText] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load planner items
  useEffect(() => {
    if (!isHydrated) return
    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    const saved = load(persistKey)
    if (Array.isArray(saved)) {
      setPlannerItems(saved)
    }
  }, [isHydrated])

  // Load notes
  useEffect(() => {
    if (!isHydrated) return
    const storageKey = `meu-dia:${currentDateKey}:notes`
    const savedNotes = load(storageKey)
    if (Array.isArray(savedNotes)) {
      setNotes(savedNotes)
    }
  }, [isHydrated, currentDateKey])

  const handleAddPlannerItem = (draft: PlannerDraft) => {
    const newItem: PlannerItem = {
      id: Date.now().toString(),
      title: draft.title,
      done: false,
      createdAt: Date.now(),
      note: draft.note,
      time: draft.time,
    }

    const updated = [...plannerItems, newItem]
    setPlannerItems(updated)

    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    save(persistKey, updated)

    try {
      track('planner.item_added', {
        tab: 'rotina-leve',
        component: 'SimplePlannerSheet',
        hasNote: !!draft.note,
        hasTime: !!draft.time,
      })
    } catch {}

    toast.success('Alterações salvas!')
  }

  const handleTogglePlannerItem = (id: string) => {
    const updated = plannerItems.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    )
    setPlannerItems(updated)

    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    save(persistKey, updated)

    try {
      track('planner.item_done', {
        tab: 'rotina-leve',
        component: 'SimplePlannerList',
        action: 'toggle',
        done: !plannerItems.find(i => i.id === id)?.done,
      })
    } catch {}
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return

    const updated = [...notes, noteText]
    setNotes(updated)
    setNoteText('')
    setShowNoteModal(false)

    const storageKey = `meu-dia:${currentDateKey}:notes`
    save(storageKey, updated)

    try {
      track('notes.note_added', {
        tab: 'rotina-leve',
        component: 'NoteModal',
      })
    } catch {}

    toast.success('Nota salva!')
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl">
        {ROUTINE_CARDS.map((card, index) => (
          <Reveal key={card.id} delay={index * 50}>
            <SoftCard
              className={`rounded-3xl p-5 sm:p-6 flex flex-col h-full cursor-pointer transition-all duration-200 ${
                expandedCard === card.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'
              }`}
              onClick={() => toggleCard(card.id)}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-[#FFE5EF] to-[#FFD8E6] flex items-center justify-center">
                  <AppIcon
                    name={card.icon as any}
                    size={24}
                    className="text-primary"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#2f3a56] mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#545454]">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              {/* Expand/Collapse Indicator */}
              <div className="flex justify-end mt-auto">
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                  {expandedCard === card.id ? 'Fechar' : 'Acessar'}{' '}
                  <AppIcon
                    name={expandedCard === card.id ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    decorative
                  />
                </span>
              </div>

              {/* Expanded Content */}
              {expandedCard === card.id && (
                <div className="mt-6 pt-6 border-t border-white/60 space-y-4" onClick={(e) => e.stopPropagation()}>
                  {card.id === 'planejar-dia' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Organize seu plano para o dia
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1" />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowPlannerSheet(true)}
                            className="flex items-center gap-1"
                          >
                            <AppIcon name="plus" size={16} decorative />
                            Adicionar
                          </Button>
                        </div>
                        <SimplePlannerList
                          items={plannerItems}
                          onToggleDone={handleTogglePlannerItem}
                        />
                      </div>

                      <SimplePlannerSheet
                        isOpen={showPlannerSheet}
                        onClose={() => setShowPlannerSheet(false)}
                        onAdd={handleAddPlannerItem}
                      />
                    </div>
                  )}

                  {card.id === 'rotina-casa' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Gerenciamento de tarefas do lar
                      </p>
                      <MomInMotion
                        enabled
                        storageKey={`meu-dia:${currentDateKey}:todos`}
                      />
                    </div>
                  )}

                  {card.id === 'rotina-filho' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Acompanhe a rotina de sua criança
                      </p>
                      <MomInMotion
                        enabled
                        storageKey={`meu-dia:${currentDateKey}:filho-todos`}
                      />
                    </div>
                  )}

                  {card.id === 'prioridades-semana' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                            Itens da Semana
                          </h4>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1" />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShowPlannerSheet(true)}
                              className="flex items-center gap-1"
                            >
                              <AppIcon name="plus" size={16} decorative />
                              Adicionar
                            </Button>
                          </div>
                          <SimplePlannerList
                            items={plannerItems}
                            onToggleDone={handleTogglePlannerItem}
                          />
                        </div>
                      </div>

                      <SimplePlannerSheet
                        isOpen={showPlannerSheet}
                        onClose={() => setShowPlannerSheet(false)}
                        onAdd={handleAddPlannerItem}
                      />
                    </div>
                  )}

                  {card.id === 'checklist-mae' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Pequenas tarefas, grandes conquistas
                      </p>
                      <Checklist currentDateKey={currentDateKey} />
                    </div>
                  )}

                  {card.id === 'notas-listas' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                          Notas Rápidas
                        </h4>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1" />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowNoteModal(true)}
                          >
                            + Adicionar
                          </Button>
                        </div>

                        {notes.length > 0 ? (
                          <div className="space-y-2">
                            {notes.map((note, idx) => (
                              <div
                                key={idx}
                                className="rounded-2xl bg-[#FFE5EF]/40 p-3 text-sm text-[#2f3a56]"
                              >
                                {note}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-[#545454]/20 bg-white/40 px-4 py-6">
                            <div className="flex flex-col items-center gap-2 text-center">
                              <AppIcon
                                name="edit"
                                size={24}
                                className="text-primary"
                                decorative
                              />
                              <p className="text-xs text-[#545454]">
                                Use este espaço para registrar pensamentos e ideias.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                          Mãe em Movimento
                        </h4>
                        <MomInMotion
                          enabled
                          storageKey={`meu-dia:${currentDateKey}:mom-motion`}
                        />
                      </div>
                    </div>
                  )}

                  {card.id === 'receitas-saudaveis' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[#545454] font-medium">
                        Ideias rápidas e nutritivas para sua família
                      </p>
                      <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-sm text-[#2f3a56] space-y-2">
                        <p className="font-semibold">Receitas em breve:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Receitas com ingredientes simples</li>
                          <li>Adaptadas para a idade da criança</li>
                          <li>Rápidas e práticas</li>
                        </ul>
                      </div>
                      <p className="text-xs text-[#545454] italic">
                        Esta seção será preenchida com receitas inteligentes em breve.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </SoftCard>
          </Reveal>
        ))}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
            <SoftCard className="w-full rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                Adicionar Nota
              </h3>
              <p className="mb-4 text-sm text-[#545454]">
                Anote um pensamento, uma tarefa ou uma gratidão.
              </p>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Escreva sua nota aqui..."
                className="min-h-[140px] w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-[#2f3a56] shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={4}
              />
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddNote}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="text-sm font-medium text-primary underline hover:opacity-70"
                >
                  Cancelar
                </button>
              </div>
            </SoftCard>
          </div>
        </div>
      )}
    </PageTemplate>
  )
}
