'use client'

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

import { ActivityOfDay } from '@/components/blocks/ActivityOfDay'
import { Checklist } from '@/components/blocks/Checklist'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import { MessageOfDay } from '@/components/blocks/MessageOfDay'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'

const quickActions = [
  { emoji: '🏡', title: 'Rotina da Casa', description: 'Organize as tarefas do lar' },
  { emoji: '📸', title: 'Momentos com os Filhos', description: 'Registre e celebre' },
  { emoji: '🎯', title: 'Atividade do Dia', description: 'Faça com as crianças' },
  { emoji: '☕', title: 'Pausa para Mim', description: 'Seu momento especial' },
]

export default function MeuDiaPage() {
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const handleAddNote = () => {
    if (noteText.trim()) {
      setNotes([noteText, ...notes])
      setNoteText('')
      setShowNoteModal(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6 md:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(65%_65%_at_50%_0%,rgba(255,216,230,0.55),transparent)]"
      />
      <div className="relative space-y-8">
        <Reveal>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              Hoje
            </span>
            <h1 className="text-3xl font-semibold text-support-1 md:text-4xl">
              {greeting}, Mãe! 💛
            </h1>
            <p className="text-sm text-support-2 md:text-base">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </Reveal>
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {greeting}, Mãe! 💛
        </h1>
        <p className="text-support-2">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

        <Reveal delay={100}>
          <MessageOfDay />
        </Reveal>

        <Reveal delay={160}>
          <ActivityOfDay />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action, index) => (
            <Reveal key={action.title} delay={index * 80}>
              <Card className="h-full">
                <div className="mb-3 text-2xl">{action.emoji}</div>
                <h3 className="text-base font-semibold text-support-1 md:text-lg">
                  {action.title}
                </h3>
                <p className="mb-4 text-xs text-support-2 md:text-sm">
                  {action.description}
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Acessar
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <FamilyPlanner />
        </Reveal>

        <Reveal delay={260}>
          <Checklist />
        </Reveal>

        <Reveal delay={320}>
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
                <p className="mb-4 text-sm text-support-2">
                  Anote um pensamento, uma tarefa ou uma gratidão.
                </p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
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
      </div>
    </div>
  )
}
