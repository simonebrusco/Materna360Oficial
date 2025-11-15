'use client'

import React, { useState, useEffect } from 'react'
import { load, getCurrentWeekKey } from '@/app/lib/persist'
import type { MoodValue } from '@/components/blocks/MoodQuickSelector'

export function WeeklySummary() {
  const [weekData, setWeekData] = useState<MoodValue[]>([])
  const [averageMood, setAverageMood] = useState<string | null>(null)

  useEffect(() => {
    const weekKey = getCurrentWeekKey()
    const persistKey = `mood:${weekKey}`
    const weekMoods = load<MoodValue[]>(persistKey, [])
    const data = weekMoods || []
    setWeekData(data)

    const validWeekData = data.filter((mood): mood is MoodValue => mood != null)
    if (validWeekData.length > 0) {
      const avg = (validWeekData.reduce<number>((sum, mood) => sum + mood, 0) / validWeekData.length).toFixed(1)
      setAverageMood(avg)
    }
  }, [])

  const moodLabels: Record<number, string> = {
    0: 'Desanimada',
    1: 'Cansada',
    2: 'Neutra',
    3: 'Bem',
    4: 'Inspirada',
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-support-1">Resumo da Semana</h2>
        <p className="text-sm text-support-2">
          Acompanhe seu humor e energia ao longo dos dias
        </p>
      </div>

      {averageMood ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-xs text-support-2 mb-2">Humor Médio</p>
            <p className="text-2xl font-bold text-primary">{averageMood}</p>
            <p className="text-xs text-support-2 mt-2">{moodLabels[Math.round(parseFloat(averageMood))]}</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-xs text-support-2 mb-2">Dias Registrados</p>
            <p className="text-2xl font-bold text-primary">{weekData.filter(m => m != null).length}</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-xs text-support-2 mb-2">Status</p>
            <p className="text-sm font-semibold text-support-1">Semana em andamento</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-support-2 py-8">
          Comece a registrar seu humor para ver seu progresso aqui
        </p>
      )}
    </div>
  )
}
