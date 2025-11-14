'use client'

import { useState, useEffect } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { toast } from '@/app/lib/toast'
import HScroll from '@/components/common/HScroll'
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'

export type MoodValue = 4 | 3 | 2 | 1 | 0

interface Mood {
  value: MoodValue
  label: string
  iconName: string
}

const MOODS: Mood[] = [
  { value: 4, label: 'Muito bem', iconName: 'smile-plus' },
  { value: 3, label: 'Bem', iconName: 'smile' },
  { value: 2, label: 'Neutro', iconName: 'meh' },
  { value: 1, label: 'Cansada', iconName: 'frown' },
  { value: 0, label: 'Exausta', iconName: 'bed' },
] as const

interface MoodQuickSelectorProps {
  onMoodSelect?: (value: MoodValue, dayIndex: number) => void
}

export function MoodQuickSelector({ onMoodSelect }: MoodQuickSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null)

  // Load today's mood on mount
  useEffect(() => {
    const weekKey = getCurrentWeekKey()
    const persistKey = `mood:${weekKey}`
    const weekMoods = load<MoodValue[]>(persistKey, [])

    // Get today's index in the week (0 = Monday)
    const today = new Date()
    const dayIndex = (today.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0

    if (weekMoods && weekMoods[dayIndex] !== undefined) {
      setSelectedMood(weekMoods[dayIndex])
    }
  }, [])

  const handleMoodSelect = (moodValue: MoodValue) => {
    setSelectedMood(moodValue)

    // Get today's index in the week
    const today = new Date()
    const dayIndex = (today.getDay() + 6) % 7

    // Save to weekly array
    const weekKey = getCurrentWeekKey()
    const persistKey = `mood:${weekKey}`
    const weekMoods = load<MoodValue[]>(persistKey, [])
    const updatedMoods = [...(weekMoods || [])]
    updatedMoods[dayIndex] = moodValue

    save(persistKey, updatedMoods)

    // Fire telemetry
    track('mood.checkin', {
      tab: 'meu-dia',
      component: 'MoodQuickSelector',
      action: 'select',
      value: moodValue,
      dayIndex,
    })

    // Show toast
    toast.success('Humor registrado! Um passo de cada vez é o suficiente.')

    // Callback if provided
    if (onMoodSelect) {
      onMoodSelect(moodValue, dayIndex)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((mood) => {
        const isActive = selectedMood === mood.value
        return (
          <button
            key={mood.value}
            onClick={() => handleMoodSelect(mood.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/60 focus-visible:ring-offset-2 ${
              isActive
                ? 'border-primary bg-primary/10 text-primary font-semibold shadow-soft'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white'
            }`}
            aria-pressed={isActive}
            title={mood.label}
            type="button"
          >
            <AppIcon
              name={mood.iconName as any}
              size={16}
              variant={isActive ? 'brand' : 'default'}
            />
            <span className="font-medium">{mood.label}</span>
          </button>
        )
      })}
    </div>
  )
}
