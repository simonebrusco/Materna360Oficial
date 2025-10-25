'use client'

import { useState } from 'react'

import { ActivityOfDay } from '@/components/blocks/ActivityOfDay'
import { CheckInCard } from '@/components/blocks/CheckInCard'
import { Checklist } from '@/components/blocks/Checklist'
import DailyMessageCard from '@/components/blocks/DailyMessageCard'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

type MeuDiaClientProps = {
  dailyGreeting: string
  currentDateKey: string
  weekStartKey: string
  weekLabels: { key: string; shortLabel: string; longLabel: string; chipLabel: string }[]
  plannerTitle: string
}

const quickActions = [
  { emoji: '🏡', title: 'Rotina da Casa', description: 'Organize as tarefas do lar' },
  { emoji: '📸', title: 'Momentos com os Filhos', description: 'Registre e celebre' },
  { emoji: '🎯', title: 'Atividade do Dia', description: 'Faça com as crianças' },
  { emoji: '☕', title: 'Pausa para Mim', description: 'Seu momento especial' },
] as const

export function MeuDiaClient({
  dailyGreeting,
  currentDateKey,
  weekStartKey,
  weekLabels,
  plannerTitle,
}: MeuDiaClientProps) {
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  const handleAddNote = () => {
    if (noteText.trim()) {
      setNotes([noteText, ...notes])
      setNoteText('')
      setShowNoteModal(false)
    }
  }

  return (
    <>
      <Reveal delay={100}>
        <DailyMessageCard greeting={dailyGreeting} />
      </Reveal>

      <Reveal delay={160}>
        <CheckInCard />
      </Reveal>

      <Reveal delay={220}>
        <ActivityOfDay />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((action, index) => (
          <Reveal key={action.title} delay={index * 80}>
            <Card className="h-full">
              <div className="mb-3 text-2xl">{action.emoji}</div>
              <h3 className="text-base font-semibold text-support-1 md:text-lg">{action.title}</h3>
              <p className="mb-4 text-xs text-support-2 md:text-sm">{action.description}</p>
              <Button variant="secondary" size="sm" className="w-full">
                Acessar
              </Button>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={280}>
        <FamilyPlanner
          currentDateKey={currentDateKey}
          weekStartKey={weekStartKey}
          weekLabels={weekLabels}
          plannerTitle={plannerTitle}
        />
      </Reveal>

      <Reveal delay={320}>
        <Checklist currentDateKey={currentDateKey} />
      </Reveal>

      <Reveal delay={360}>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-support-1 md:text-xl">📝 Notas Rápidas</h2>
              <p className="text-xs text-support-2/80">Capture ideias e lembretes em instantes.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowNoteModal(true)}>
              ＋ Adicionar
            </Button>
          </div>

          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note, idx) => (
                <div key={idx} className="rounded-2xl bg-secondary/60 p-3 text-sm text-support-1 shadow-soft">
                  {note}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-support-2">Nenhuma nota registrada ainda.</p>
          )}
        </Card>
      </Reveal>

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
            <Card className="w-full">
              <h3 className="mb-2 text-lg font-semibold text-support-1">Adicionar Nota</h3>
              <p className="mb-4 text-sm text-support-2">Anote um pensamento, uma tarefa ou uma gratidão.</p>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Escreva sua nota aqui..."
                className="min-h-[140px] w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={4}
              />
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNoteModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddNote} className="flex-1">
                  Salvar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
