'use client'

import React from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

type WeekViewData = {
  dayNumber: number
  dayName: string
  agendaCount: number
  top3Count: number
  careCount: number
  familyCount: number
}

type WeekViewProps = {
  weekData: WeekViewData[]
}

export default function WeekView({ weekData }: WeekViewProps) {
  return (
    <div className="space-y-4">
      {/* Weekly Summary */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <SoftCard className="p-4 md:p-5 text-center">
          <p className="text-xs md:text-sm font-semibold text-[#545454]/70 uppercase tracking-wide mb-2">
            Tarefas
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[#2f3a56]">
            {weekData.reduce((acc, day) => acc + day.top3Count, 0)}
          </p>
          <p className="text-xs text-[#545454]/60 mt-1">
            planejadas esta semana
          </p>
        </SoftCard>

        <SoftCard className="p-4 md:p-5 text-center">
          <p className="text-xs md:text-sm font-semibold text-[#545454]/70 uppercase tracking-wide mb-2">
            Autocuidado
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[#2f3a56]">
            {weekData.reduce((acc, day) => acc + day.careCount, 0)}
          </p>
          <p className="text-xs text-[#545454]/60 mt-1">
            ações programadas
          </p>
        </SoftCard>

        <SoftCard className="p-4 md:p-5 text-center">
          <p className="text-xs md:text-sm font-semibold text-[#545454]/70 uppercase tracking-wide mb-2">
            Família
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[#2f3a56]">
            {weekData.reduce((acc, day) => acc + day.familyCount, 0)}
          </p>
          <p className="text-xs text-[#545454]/60 mt-1">
            ações com a família
          </p>
        </SoftCard>
      </div>

      {/* Weekly Timeline */}
      <SoftCard className="p-4 md:p-5">
        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-4">
          Timeline da semana
        </h3>

        <div className="space-y-2">
          {weekData.map((day, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-[#f0f0f0] hover:border-[#ff005e]/20 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[#2f3a56]">
                    {day.dayName}
                  </span>
                  <span className="text-xs text-[#545454]/60">
                    {day.dayNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {day.agendaCount > 0 && (
                  <div className="flex items-center gap-1">
                    <AppIcon
                      name="clock"
                      className="w-3.5 h-3.5 text-[#545454]/40"
                    />
                    <span className="text-xs font-semibold text-[#545454]/70">
                      {day.agendaCount}
                    </span>
                  </div>
                )}

                {day.top3Count > 0 && (
                  <div className="flex items-center gap-1">
                    <AppIcon
                      name="target"
                      className="w-3.5 h-3.5 text-[#545454]/40"
                    />
                    <span className="text-xs font-semibold text-[#545454]/70">
                      {day.top3Count}
                    </span>
                  </div>
                )}

                {day.careCount > 0 && (
                  <div className="flex items-center gap-1">
                    <AppIcon
                      name="heart"
                      className="w-3.5 h-3.5 text-[#ff005e]/40"
                    />
                    <span className="text-xs font-semibold text-[#545454]/70">
                      {day.careCount}
                    </span>
                  </div>
                )}

                {day.familyCount > 0 && (
                  <div className="flex items-center gap-1">
                    <AppIcon
                      name="smile"
                      className="w-3.5 h-3.5 text-[#545454]/40"
                    />
                    <span className="text-xs font-semibold text-[#545454]/70">
                      {day.familyCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </SoftCard>
    </div>
  )
}
