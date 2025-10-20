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
    <Card className="p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">📋 Planejador da Família</h2>
        <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
          Equilíbrio
        </span>
      </div>

      <div className="mb-5 flex gap-2 md:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-gentle ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                : 'bg-white/80 text-support-1 shadow-soft hover:shadow-elevated'
            }`}
          >
            <span className="mr-2 text-base">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-3">
        {current.items.map((item, idx) => (
          <label
            key={idx}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-soft transition-all duration-300 hover:shadow-elevated"
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded-full border-2 border-primary/40 bg-white accent-primary cursor-pointer"
              aria-label={item}
            />
            <span className="text-sm text-support-1">{item}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Progresso</span>
          <span className="text-xs font-semibold text-primary">{current.progress}%</span>
        </div>
        <Progress value={current.progress} max={100} />
      </div>
    </Card>
  )
}
