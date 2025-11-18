'use client'

import React from 'react'

type DayCalendarStripProps = {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export default function DayCalendarStrip({
  selectedDate,
  onDateSelect,
}: DayCalendarStripProps) {
  // Get the start of the current week (Monday)
  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const monday = getMonday(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
      {weekDays.map((date, index) => {
        const selected = isSelected(date)
        const today = isToday(date)

        return (
          <button
            key={index}
            onClick={() => onDateSelect(date)}
            className={`flex-shrink-0 min-w-fit px-3 py-2.5 rounded-full text-sm font-semibold transition-all ${
              selected
                ? 'bg-[#ff005e] text-white shadow-[0_4px_12px_rgba(255,0,94,0.3)]'
                : 'bg-white border border-[#ddd] text-[#545454] hover:border-[#ff005e]'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium">{dayNames[index]}</span>
              <span className="text-sm font-bold">{date.getDate()}</span>
              {today && !selected && (
                <span className="text-[6px] text-[#ff005e] font-bold mt-0.5">●</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
