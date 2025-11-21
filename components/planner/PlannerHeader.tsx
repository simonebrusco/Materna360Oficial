'use client'

import React, { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { ClientOnly } from '@/components/common/ClientOnly'

interface PlannerHeaderProps {
  greeting: string
  onMoodSelect: (mood: 'happy' | 'okay' | 'stressed' | null) => void
}

const MOOD_OPTIONS = [
  { id: 'happy', label: 'Feliz', icon: 'smile' as const, color: 'text-yellow-500' },
  { id: 'okay', label: 'Normal', icon: 'meh' as const, color: 'text-[#ff005e]' },
  { id: 'stressed', label: 'Estressada', icon: 'frown' as const, color: 'text-red-500' },
]

const DAY_TAGS = ['Leve', 'Focado', 'Produtivo', 'Slow']

export default function PlannerHeader({ greeting, onMoodSelect }: PlannerHeaderProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const handleMoodSelect = (moodId: string) => {
    const isSame = selectedMood === moodId
    setSelectedMood(isSame ? null : moodId)
    onMoodSelect(isSame ? null : (moodId as any))
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <ClientOnly>
        <h1 className="text-3xl md:text-4xl font-bold text-[#2f3a56] leading-tight">{greeting}</h1>
      </ClientOnly>

      {/* Mood Check-in Pills */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#545454]/70 uppercase tracking-wide">Como você está?</p>
        <div className="flex gap-2 flex-wrap">
          {MOOD_OPTIONS.map(mood => (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                selectedMood === mood.id
                  ? 'bg-pink-100 text-[#ff005e] border-2 border-[#ff005e] scale-105'
                  : 'bg-[#f5f5f5] text-[#545454] border-2 border-transparent hover:border-[#ff005e]/30'
              }`}
            >
              <AppIcon name={mood.icon} className={`w-4 h-4 ${mood.color}`} />
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Day Tag Selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#545454]/70 uppercase tracking-wide">Hoje, meu dia é...</p>
        <div className="flex gap-2 flex-wrap">
          {DAY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-[#ff005e] text-white shadow-md'
                  : 'bg-white border border-[#ddd] text-[#545454] hover:border-[#ff005e]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
