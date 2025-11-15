'use client'

import { useEffect, useState } from 'react'
import { load, getCurrentWeekKey } from '@/app/lib/persist'
import type { MoodValue } from '@/components/blocks/MoodQuickSelector'
import AppIcon from '@/components/ui/AppIcon'

export function SuaEvolucao() {
  const [weekData, setWeekData] = useState<MoodValue[]>([])
  const [totalDays, setTotalDays] = useState(0)

  useEffect(() => {
    const weekKey = getCurrentWeekKey()
    const persistKey = `mood:${weekKey}`
    const weekMoods = load<MoodValue[]>(persistKey, [])
    const data = weekMoods || []
    setWeekData(data)
    setTotalDays(data.filter((m) => m !== null && m !== undefined).length)
  }, [])

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
  const moodLabels: Record<number, string> = {
    0: 'Desanimada',
    1: 'Cansada',
    2: 'Neutra',
    3: 'Bem',
    4: 'Inspirada',
  }

  const moodColors: Record<number, string> = {
    0: 'text-red-500',
    1: 'text-orange-500',
    2: 'text-gray-400',
    3: 'text-green-500',
    4: 'text-primary',
  }

  // Filter out null/undefined entries for safe calculation
  const validWeekData = weekData.filter(
    (mood): mood is MoodValue => mood != null
  )

  const averageMood =
    validWeekData.length > 0
      ? (
          validWeekData.reduce<number>((sum, mood) => sum + mood, 0) /
          validWeekData.length
        ).toFixed(1)
      : null

  const highestMood =
    validWeekData.length > 0 ? Math.max(...validWeekData) : 0
  const lowestMood =
    validWeekData.length > 0 ? Math.min(...validWeekData) : 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl bg-white/50 border border-white/40 p-4 text-center shadow-soft">
          <div className="text-2xl font-semibold text-primary mb-1">{totalDays}</div>
          <p className="text-xs text-support-2">Dias registrados</p>
        </div>
        <div className="rounded-2xl bg-white/50 border border-white/40 p-4 text-center shadow-soft">
          <div className="text-2xl font-semibold text-support-1 mb-1">
            {averageMood !== null ? averageMood : '—'}
          </div>
          <p className="text-xs text-support-2">Humor médio</p>
        </div>
        <div className="rounded-2xl bg-white/50 border border-white/40 p-4 text-center shadow-soft">
          <div className={`text-2xl font-semibold mb-1 ${
            averageMood !== null
              ? moodColors[Math.round(parseFloat(averageMood))]
              : 'text-support-3'
          }`}>
            {averageMood !== null
              ? moodLabels[Math.round(parseFloat(averageMood))]
              : '—'}
          </div>
          <p className="text-xs text-support-2">Tendência</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="rounded-2xl bg-white/50 border border-white/40 p-4 shadow-soft">
        <h4 className="font-semibold text-sm text-support-1 mb-4">Seu humor na semana</h4>
        <div className="flex items-end justify-between gap-2 h-40">
          {weekDays.map((day, index) => {
            const mood = weekData[index]
            const height = mood ? (mood / 4) * 100 : 0

            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  {mood !== null && mood !== undefined ? (
                    <div
                      className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                      title={moodLabels[mood]}
                    />
                  ) : (
                    <div className="w-full bg-support-3/20 rounded-lg" />
                  )}
                </div>
                <span className="text-xs font-medium text-support-2">{day}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      {totalDays > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-support-1">Insights da Semana</h4>
          <div className="space-y-2">
            {highestMood > 2 && (
              <div className="rounded-2xl bg-green-50/50 border border-green-200/40 p-3 flex items-start gap-2">
                <AppIcon
                  name="sparkles"
                  size={16}
                  className="text-green-600 flex-shrink-0 mt-0.5"
                  decorative
                />
                <div className="text-xs">
                  <p className="font-medium text-green-900">Dias inspiradores</p>
                  <p className="text-green-700">Você teve {weekData.filter((m) => m === 4).length} dias inspirada. Continue assim! 🌟</p>
                </div>
              </div>
            )}

            {totalDays >= 5 && (
              <div className="rounded-2xl bg-blue-50/50 border border-blue-200/40 p-3 flex items-start gap-2">
                <AppIcon
                  name="check"
                  size={16}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  decorative
                />
                <div className="text-xs">
                  <p className="font-medium text-blue-900">Consistência</p>
                  <p className="text-blue-700">Você registrou {totalDays} dias essa semana. Que dedicação! 💪</p>
                </div>
              </div>
            )}

            {lowestMood <= 1 && totalDays > 0 && (
              <div className="rounded-2xl bg-purple-50/50 border border-purple-200/40 p-3 flex items-start gap-2">
                <AppIcon
                  name="heart"
                  size={16}
                  className="text-purple-600 flex-shrink-0 mt-0.5"
                  decorative
                />
                <div className="text-xs">
                  <p className="font-medium text-purple-900">Cuide de si</p>
                  <p className="text-purple-700">Alguns dias foram desafiadores. Lembre-se: você está fazendo o melhor. 💗</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {totalDays === 0 && (
        <div className="rounded-2xl border border-dashed border-support-3/40 bg-white/40 px-6 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary/30">
              <AppIcon name="trending-up" size={24} className="text-primary" decorative />
            </div>
            <div>
              <p className="font-semibold text-support-1">Nenhum dado de humor esta semana.</p>
              <p className="mt-1 text-xs text-support-2">
                Registre seus humores diariamente em "Meu Dia" para ver sua evolução aqui.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
