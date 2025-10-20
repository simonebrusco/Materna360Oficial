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
    <Card className="bg-gradient-to-br from-primary/5 to-pink-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-1">Atividade do Dia</h2>
          <p className="text-2xl md:text-3xl font-bold mb-2">{activity.emoji} {activity.title}</p>
          <div className="flex gap-4 text-xs md:text-sm text-support-2">
            <span>👧 {activity.age}</span>
            <span>⏱️ {activity.time}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
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
