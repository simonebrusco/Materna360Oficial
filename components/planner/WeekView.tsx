'use client'

import React from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

type WeekDayData = {
  dateKey: string
  dayNumber: number
  dayName: string
  agendaCount: number
  top3Count: number
  careCount: number
  familyCount: number
}

type WeekViewProps = {
  weekData: WeekDayData[]
}

export default function WeekView({ weekData }: WeekViewProps) {
  return (
    <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_16px_38px_rgba(0,0,0,0.06)] p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
            Visão da semana
          </p>
          <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
            Como a sua semana está se organizando
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
            Veja em quais dias você já tem compromissos, prioridades e
            cuidados registrados.
          </p>
        </div>

        <span className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
          <AppIcon
            name="calendar"
            className="w-4 h-4 text-[var(--color-brand)]"
          />
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {weekData.map(day => {
          const totalFocus =
            day.top3Count + day.careCount + day.familyCount
          const hasAnything =
            day.agendaCount > 0 || totalFocus > 0

          return (
            <div
              key={day.dateKey}
              className={`rounded-2xl border px-3 py-2.5 flex flex-col gap-1.5 text-xs md:text-[13px] ${
                hasAnything
                  ? 'bg-[#FFE8F2] border-[#FFB3D3]'
                  : 'bg-white border-[#F1E4EC]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {day.dayName}
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 border border-[#F1E4EC] text-[11px] font-semibold text-[var(--color-text-main)]">
                  {day.dayNumber}
                </span>
              </div>

              {!hasAnything && (
                <p className="text-[10px] leading-snug text-[var(--color-text-muted)]">
                  Dia em aberto. Pode ser leve.
                </p>
              )}

              {hasAnything && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {day.agendaCount > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-main)]">
                      <span className="inline-flex h-3 w-3 rounded-full bg-[var(--color-brand)]/80" />
                      <span>
                        {day.agendaCount} compromisso
                        {day.agendaCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {day.top3Count > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-main)]">
                      <span className="inline-flex h-3 w-3 rounded-full bg-[#FFB3D3]" />
                      <span>
                        {day.top3Count} prioridade
                        {day.top3Count > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {day.careCount > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-main)]">
                      <span className="inline-flex h-3 w-3 rounded-full bg-[#FFD8E6]" />
                      <span>
                        {day.careCount} cuidado com você
                      </span>
                    </div>
                  )}

                  {day.familyCount > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-main)]">
                      <span className="inline-flex h-3 w-3 rounded-full bg-[#EEC2D6]" />
                      <span>
                        {day.familyCount} momento com seu filho
                        {day.familyCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SoftCard>
  )
}
