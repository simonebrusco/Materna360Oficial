'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'

type PlannerTab = 'casa' | 'filhos' | 'eu'

export function FamilyPlanner() {
  const [activeTab, setActiveTab] = useState<PlannerTab>('casa')

  const tabs: { id: PlannerTab; label: string; emoji: string }[] = [
    { id: 'casa', label: 'Casa', emoji: '🏡' },
    { id: 'filhos', label: 'Filhos', emoji: '👶' },
    { id: 'eu', label: 'Eu', emoji: '💆' },
  ]

  const content = {
    casa: { items: ['Limpeza do quarto', 'Lavar louça', 'Tirar roupa do varal'], progress: 33 },
    filhos: { items: ['Desjejum', 'Escola', 'Hora do banho'], progress: 66 },
    eu: { items: ['Meditação', 'Alongamento', 'Chá tranquilo'], progress: 0 },
  }

  const current = content[activeTab]

  return (
    <Card>
      <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-4">📋 Planejador da Família</h2>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-secondary text-support-1 hover:bg-pink-200'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        {current.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-secondary rounded-lg">
            <input
              type="checkbox"
              className="w-5 h-5 rounded accent-primary cursor-pointer"
              aria-label={item}
            />
            <span className="text-sm text-support-1">{item}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-support-2">Progresso</span>
          <span className="text-xs font-semibold text-primary">{current.progress}%</span>
        </div>
        <Progress value={current.progress} max={100} />
      </div>
    </Card>
  )
}
