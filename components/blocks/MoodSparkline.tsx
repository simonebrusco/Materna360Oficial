'use client'

import { useEffect, useState } from 'react'
import { load, getCurrentWeekKey } from '@/app/lib/persist'
import type { MoodValue } from './MoodQuickSelector'

export function MoodSparkline() {
  const [weekData, setWeekData] = useState<MoodValue[]>([])

  // Load weekly mood data on mount
  useEffect(() => {
    const weekKey = getCurrentWeekKey()
    const persistKey = `mood:${weekKey}`
    const weekMoods = load<MoodValue[]>(persistKey, [])
    setWeekData(weekMoods || [])
  }, [])

  // Watch for storage changes to update in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      const weekKey = getCurrentWeekKey()
      const persistKey = `mood:${weekKey}`
      const weekMoods = load<MoodValue[]>(persistKey, [])
      setWeekData(weekMoods || [])
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Pad data to 7 days
  const paddedData = Array(7)
    .fill(null)
    .map((_, i) => weekData[i] ?? null)

  // Find min/max for scaling
  const validValues = paddedData.filter((v) => v !== null) as MoodValue[]
  const minVal = validValues.length > 0 ? Math.min(...validValues) : 0
  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 4
  const range = Math.max(maxVal - minVal, 1)

  // SVG dimensions
  const width = 200
  const height = 40
  const padding = 4
  const graphWidth = width - padding * 2
  const graphHeight = height - padding * 2
  const pointSpacing = graphWidth / 6 // 7 points means 6 intervals

  // Generate path data
  let pathData = ''
  let hasData = false

  paddedData.forEach((value, i) => {
    if (value !== null) {
      hasData = true
      const x = padding + i * pointSpacing
      const normalizedY = (value - minVal) / range
      const y = padding + graphHeight - normalizedY * graphHeight

      if (pathData === '') {
        pathData = `M ${x} ${y}`
      } else {
        pathData += ` L ${x} ${y}`
      }
    }
  })

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="text-sm font-semibold text-support-1">Resumo da semana</h4>
          <p className="text-xs text-support-2">Humor diário registrado</p>
        </div>
        {validValues.length > 0 && (
          <span className="text-xs text-support-3">
            {validValues.length} {validValues.length === 1 ? 'dia' : 'dias'}
          </span>
        )}
      </div>

      {hasData ? (
        <svg
          width={width}
          height={height}
          className="w-full h-auto"
          role="img"
          aria-label="Resumo semanal de humor"
        >
          {/* Light background grid */}
          <defs>
            <linearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(255, 0, 94)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="rgb(255, 0, 94)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Fill area under curve */}
          {pathData && (
            <path
              d={`${pathData} L ${padding + 6 * pointSpacing} ${padding + graphHeight} L ${padding} ${padding + graphHeight} Z`}
              fill="url(#moodGradient)"
            />
          )}

          {/* Line */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="rgb(255, 0, 94)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Data points */}
          {paddedData.map((value, i) => {
            if (value === null) return null

            const x = padding + i * pointSpacing
            const normalizedY = (value - minVal) / range
            const y = padding + graphHeight - normalizedY * graphHeight

            return (
              <circle key={i} cx={x} cy={y} r="1.5" fill="rgb(255, 0, 94)" />
            )
          })}
        </svg>
      ) : (
        <div className="flex items-center justify-center rounded-lg bg-white/40 py-6 px-4">
          <p className="text-xs text-support-3">
            Registre seus humores para ver o resumo da semana
          </p>
        </div>
      )}
    </div>
  )
}
