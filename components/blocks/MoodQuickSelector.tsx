'use client'

import { useState, useEffect } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { toast } from '@/app/lib/toast'
import HScroll from '@/components/common/HScroll'
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry-track'

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
    track({
      event: 'mood.checkin',
      tab: 'meu-dia',
      component: 'MoodQuickSelector',
      action: 'select',
      payload: { value: moodValue, dayIndex },
    })

    // Show toast
    toast.success('Humor registrado! Um passo de cada vez é o suficiente.')

    // Callback if provided
    if (onMoodSelect) {
      onMoodSelect(moodValue, dayIndex)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-support-1">Como está seu humor?</h3>
        <p className="text-sm text-support-2">Registre seu estado emocional diário</p>
      </div>

      <HScroll className="pt-2">
        {MOODS.map((mood) => {
          const isActive = selectedMood === mood.value
          return (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood.value)}
              className={`snap-start shrink-0 basis-[35%] sm:basis-[28%] md:basis-[22%] flex flex-col items-center gap-2 rounded-xl px-3 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 ring-2 ring-primary/40 scale-105'
                  : 'bg-white border border-white/60 hover:bg-white/80'
              } focus:outline-none focus:ring-2 focus:ring-primary/60 focus-visible:ring-offset-2`}
              aria-pressed={isActive}
              title={mood.label}
              type="button"
            >
              <AppIcon
                name={mood.iconName as any}
                size={24}
                variant={isActive ? 'brand' : 'default'}
              />
              <span className="text-center text-xs font-medium leading-tight text-support-1 line-clamp-2">
                {mood.label}
              </span>
            </button>
          )
        })}
      </HScroll>
    </div>
  )
}
