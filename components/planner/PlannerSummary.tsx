'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'

interface PlannerSummaryProps {
  completedCount: number
  totalCount: number
  dailyMessage: string
}

export default function PlannerSummary({ completedCount, totalCount, dailyMessage }: PlannerSummaryProps) {
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Summary Card */}
      <div className="rounded-[20px] md:rounded-[18px] border border-black/5 bg-gradient-to-br from-pink-50 to-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ff005e] to-[#ff4081] flex items-center justify-center text-white">
              <AppIcon name="check" className="w-7 h-7" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#545454]/70">Progresso do dia</p>
            <p className="text-2xl md:text-3xl font-bold text-[#2f3a56]">
              {completedCount} de {totalCount}
            </p>
            <div className="mt-2 w-full bg-[#ddd] rounded-full h-2 md:h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#ff005e] to-[#ff4081] h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Message Card */}
      <div className="rounded-[20px] md:rounded-[18px] border border-black/5 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-1">
            <AppIcon name="sparkles" className="w-6 h-6 text-[#ff005e]" />
          </div>
          <div className="flex-1">
            <p className="text-xs md:text-sm font-medium text-[#ff005e] uppercase tracking-wide mb-2">Sua mensagem</p>
            <p className="text-sm md:text-base text-[#2f3a56] font-medium leading-relaxed">"{dailyMessage}"</p>
          </div>
        </div>
      </div>
    </div>
  )
}
