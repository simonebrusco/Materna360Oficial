'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MessageOfDay } from '@/components/blocks/MessageOfDay'
import { ActivityOfDay } from '@/components/blocks/ActivityOfDay'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import { Checklist } from '@/components/blocks/Checklist'

export default function MeuDiaPage() {
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const handleAddNote = () => {
    if (noteText.trim()) {
      setNotes([noteText, ...notes])
      setNoteText('')
      setShowNoteModal(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
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

      {/* Message of Day */}
      <MessageOfDay />

      {/* Activity of Day */}
      <ActivityOfDay />

      {/* Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">🏡</div>
          <h3 className="font-semibold text-support-1 mb-1">Rotina da Casa</h3>
          <p className="text-xs text-support-2 mb-3">Organize as tarefas do lar</p>
          <Button variant="secondary" size="sm" className="w-full">
            Acessar
          </Button>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📸</div>
          <h3 className="font-semibold text-support-1 mb-1">Momentos com os Filhos</h3>
          <p className="text-xs text-support-2 mb-3">Registre e celebre</p>
          <Button variant="secondary" size="sm" className="w-full">
            Acessar
          </Button>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold text-support-1 mb-1">Atividade do Dia</h3>
          <p className="text-xs text-support-2 mb-3">Faça com as crianças</p>
          <Button variant="secondary" size="sm" className="w-full">
            Acessar
          </Button>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">☕</div>
          <h3 className="font-semibold text-support-1 mb-1">Pausa para Mim</h3>
          <p className="text-xs text-support-2 mb-3">Seu momento especial</p>
          <Button variant="secondary" size="sm" className="w-full">
            Acessar
          </Button>
        </Card>
      </div>

      {/* Family Planner */}
      <FamilyPlanner />

      {/* Checklist */}
      <Checklist />

      {/* Notes Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-support-1">📝 Notas Rápidas</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNoteModal(true)}
          >
            ＋ Adicionar
          </Button>
        </div>

        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note, idx) => (
              <div key={idx} className="p-3 bg-secondary/50 rounded-lg text-sm text-support-1">
                {note}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-support-2">Nenhuma nota registrada ainda.</p>
        )}
      </Card>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <Card className="w-full md:max-w-md">
            <h3 className="text-lg font-semibold text-support-1 mb-4">Adicionar Nota</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua nota aqui..."
              className="w-full p-3 border border-secondary rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNoteModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddNote}
                className="flex-1"
              >
                Salvar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
