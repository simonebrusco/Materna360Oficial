'use client'

import React, { useMemo } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

type WeekDaySummary = {
  dayNumber: number
  dayName: string
  agendaCount: number
  top3Count: number
  careCount: number
  familyCount: number
}

type WeekViewProps = {
  weekData: WeekDaySummary[]
}

function hasAnyActivity(day: WeekDaySummary) {
  return day.agendaCount > 0 || day.top3Count > 0 || day.careCount > 0 || day.familyCount > 0
}

function normWeekdayShort(name: string) {
  // "seg.", "seg" -> "SEG."
  const base = (name || '').replace('.', '').trim().slice(0, 3).toUpperCase()
  return base ? `${base}.` : '—'
}

export default function WeekView({ weekData }: WeekViewProps) {
  const safeWeek = useMemo(() => (Array.isArray(weekData) ? weekData : []), [weekData])
  if (safeWeek.length === 0) return null

  return (
    <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
            Visão da semana
          </p>
          <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
            Como está a sua semana?
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
            Veja, em cada dia da semana, quantos compromissos, prioridades e cuidados com você e com seu filho já foram planejados.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-2 text-[10px] md:text-[11px] text-[var(--color-text-muted)]">
          <LegendDot colorClass="bg-[var(--color-brand)]" label="Agenda & compromissos" />
          <LegendDot colorClass="bg-[#FFB3D3]" label="Prioridades do dia" />
          <LegendDot colorClass="bg-[#9b4d96]" label="Cuidar de mim" />
          <LegendDot colorClass="bg-[#2f3a56]" label="Cuidar do meu filho" />
        </div>
      </div>

      {/* Board da semana (premium: scroll horizontal no mobile) */}
      <div className="-mx-2 md:mx-0 overflow-x-auto px-2 md:px-0">
        <div className="flex gap-3 md:gap-2">
          {safeWeek.map(day => (
            <div
              key={`${day.dayName}-${day.dayNumber}`}
              className="flex-shrink-0 w-[210px] sm:w-[230px] md:w-auto md:flex-1"
            >
              <div className="h-full flex flex-col rounded-2xl border border-[var(--color-soft-strong)] bg-[var(--color-soft-bg)]/60 p-3 min-h-[170px]">
                {/* Cabeçalho do dia */}
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {normWeekdayShort(day.dayName)}
                    </p>
                    <p className="text-sm md:text-base font-semibold text-[var(--color-text-main)]">
                      {day.dayNumber}
                    </p>
                  </div>

                  {hasAnyActivity(day) && (
                    <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/90 border border-[#FFE8F2] px-2 py-0.5 text-[10px] font-medium text-[var(--color-brand-deep)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
                      Dia em movimento
                    </span>
                  )}
                </div>

                {/* Pills */}
                <div className="space-y-2">
                  <CountPill
                    icon="calendar"
                    label="Agenda & compromissos"
                    count={day.agendaCount}
                    colorClass="bg-[var(--color-brand)]"
                  />
                  <CountPill
                    icon="target"
                    label="Prioridades do dia"
                    count={day.top3Count}
                    colorClass="bg-[#FFB3D3]"
                    textColorClass="text-[#C2285F]"
                  />
                  <CountPill
                    icon="heart"
                    label="Cuidar de mim"
                    count={day.careCount}
                    colorClass="bg-[#9b4d96]"
                  />
                  <CountPill
                    icon="smile"
                    label="Cuidar do meu filho"
                    count={day.familyCount}
                    colorClass="bg-[#2f3a56]"
                  />
                </div>

                {/* Mensagem suave quando está vazio */}
                {!hasAnyActivity(day) && (
                  <p className="mt-3 text-[10px] md:text-[11px] text-[var(--color-text-muted)]">
                    Esse dia ainda está em branco. Você pode começar pelos atalhos do planner ou adicionando um compromisso no calendário.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SoftCard>
  )
}

function LegendDot({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-[#F5D7E5] px-2.5 py-1">
      <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
      <span className="text-[10px] md:text-[11px] font-medium text-[var(--color-text-muted)]">{label}</span>
    </span>
  )
}

type CountPillProps = {
  icon: 'calendar' | 'target' | 'heart' | 'smile'
  label: string
  count: number
  colorClass: string
  textColorClass?: string
}

function CountPill({ icon, label, count, colorClass, textColorClass }: CountPillProps) {
  const hasItems = count > 0

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 ${
        hasItems ? 'bg-white border-[#FFE0F0] shadow-[0_4px_14px_rgba(0,0,0,0.06)]' : 'bg-white/80 border-transparent'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${colorClass} ${
            icon === 'target' ? 'text-[#C2285F]' : 'text-white'
          }`}
        >
          <AppIcon name={icon} className="h-3.5 w-3.5" decorative />
        </span>
        <span className="text-[10px] md:text-[11px] font-medium text-[var(--color-text-main)] truncate">
          {label}
        </span>
      </div>

      <span
        className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          hasItems ? `${colorClass} text-white` : 'bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]'
        } ${textColorClass ?? ''}`}
      >
        {count}
      </span>
    </div>
  )
}
