'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function ActivityOfDay() {
  const activities = [
    { emoji: '🎨', title: 'Pintura com Dedos', age: '1-3 anos', time: '20 min' },
    { emoji: '🏗️', title: 'Torre de Blocos', age: '2-5 anos', time: '30 min' },
    { emoji: '📚', title: 'Leitura Compartilhada', age: '0-7 anos', time: '15 min' },
    { emoji: '🌳', title: 'Caça ao Tesouro', age: '4+ anos', time: '45 min' },
  ]

  const today = new Date().getDate()
  const activity = activities[today % activities.length]

  return (
    <Card className="bg-gradient-to-br from-primary/12 via-white/95 to-white p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
            Atividade do Dia
          </span>
          <p className="mt-4 text-2xl font-bold text-support-1 md:text-3xl">
            {activity.emoji} {activity.title}
          </p>
          <div className="mt-3 flex gap-4 text-xs font-medium text-support-2 md:text-sm">
            <span className="inline-flex items-center gap-1">👧 {activity.age}</span>
            <span className="inline-flex items-center gap-1">⏱️ {activity.time}</span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" size="sm" className="flex-1">
          Ver Detalhes
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          Salvar
        </Button>
      </div>
    </Card>
  )
}
