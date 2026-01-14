'use client'

import React from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

type Density = 'compact' | 'normal'

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
  density?: Density //  novo (opcional)
}

export default function WeekView({ weekData, density = 'normal' }: WeekViewProps) {
  if (!weekData || weekData.length === 0) return null

  const isCompact = density === 'compact'

  const cardPad = isCompact ? 'p-4 md:p-5' : 'p-4 md:p-6'
  const headerGap = isCompact ? 'gap-2' : 'gap-3'
  const titleText = isCompact ? 'text-base md:text-lg' : 'text-lg md:text-xl'
  const descText = isCompact ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'
  const legendText = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const footerText = isCompact ? 'text-[10px]' : 'text-[11px]'

  return (
    <SoftCard
      className={[
        'rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.06)] space-y-4',
        cardPad,
      ].join(' ')}
    >
      {/* Cabeçalho */}
      <div className={`flex flex-col md:flex-row md:items-start md:justify-between ${headerGap}`}>
        <div>
          <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
            Visão da semana
          </p>

          <h2 className={`${titleText} font-semibold text-[var(--color-text-main)]`}>Como está a sua semana?</h2>

          <p className={`${descText} text-[var(--color-text-muted)] mt-1 max-w-xl`}>
            Veja, em cada dia da semana, quantos compromissos, prioridades e cuidados com você e com seu filho já foram planejados.
          </p>
        </div>

        <div className={`inline-flex flex-wrap gap-2 ${legendText} text-[var(--color-text-muted)]`}>
          <LegendDot colorClass="bg-[var(--color-brand)]" label="Agenda & compromissos" />
          <LegendDot colorClass="bg-[#FFB3D3]" label="Prioridades do dia" />
          <LegendDot colorClass="bg-[#9b4d96]" label="Cuidar de mim" />
          <LegendDot colorClass="bg-[#2f3a56]" label="Cuidar do meu filho" />
        </div>
      </div>

      {/* Board da semana */}
      <div className="relative">
        {/* Mobile: carrossel com snap | Desktop: grid 7 colunas */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scroll-px-4">
          <div className="flex gap-3">
            {weekData.map((day) => (
              <DayCard key={`${day.dayName}-${day.dayNumber}`} day={day} variant="mobile" density={density} />
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {weekData.map((day) => (
              <DayCard key={`${day.dayName}-${day.dayNumber}`} day={day} variant="desktop" density={density} />
            ))}
          </div>
        </div>
      </div>

      {/* Dica adaptativa */}
      <p className={`${footerText} text-[var(--color-text-muted)]`}>
        <span className="md:hidden">Dica: arraste para o lado para ver todos os dias da semana.</span>
        <span className="hidden md:inline">Dica: se estiver no notebook, você pode rolar horizontalmente com Shift + scroll.</span>
      </p>
    </SoftCard>
  )
}

function DayCard({
  day,
  variant,
  density,
}: {
  day: WeekDaySummary
  variant: 'mobile' | 'desktop'
  density: Density
}) {
  const empty = !hasAnyActivity(day)
  const isCompact = density === 'compact'

  const boxPad =
    variant === 'mobile'
      ? isCompact
        ? 'snap-start shrink-0 w-[82vw] max-w-[360px] p-3 min-h-[160px]'
        : 'snap-start shrink-0 w-[82vw] max-w-[360px] p-3 min-h-[172px]'
      : isCompact
        ? 'p-2.5 md:p-3 min-h-[148px]'
        : 'p-2.5 md:p-3.5 min-h-[160px]'

  const dayNameText = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const dayNumberText = isCompact ? 'text-sm' : 'text-sm md:text-base'
  const chipText = isCompact ? 'text-[9px]' : 'text-[10px]'
  const emptyText = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'

  return (
    <div
      className={[
        'flex flex-col rounded-2xl border border-[var(--color-soft-strong)] bg-[var(--color-soft-bg)]/60',
        boxPad,
      ].join(' ')}
    >
      {/* Cabeçalho do dia */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="leading-tight">
          <p className={`${dayNameText} font-semibold uppercase tracking-wide text-[var(--color-text-muted)]`}>
            {day.dayName}
          </p>
          <p className={`${dayNumberText} font-semibold text-[var(--color-text-main)]`}>{day.dayNumber}</p>
        </div>

        {hasAnyActivity(day) ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-white/90 border border-[#FFE8F2] px-2 py-0.5 ${chipText} font-medium text-[var(--color-brand-deep)] whitespace-nowrap`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
            Dia em movimento
          </span>
        ) : null}
      </div>

      {/* Pills de contagem */}
      <div className={isCompact ? 'space-y-1' : 'space-y-1.5'}>
        <CountPill
          icon="calendar"
          label="Agenda & compromissos"
          count={day.agendaCount}
          colorClass="bg-[var(--color-brand)]"
          density={density}
        />
        <CountPill
          icon="target"
          label="Prioridades do dia"
          count={day.top3Count}
          colorClass="bg-[#FFB3D3]"
          badgeTextClass="text-[#C2285F]"
          iconTextClass="text-[#C2285F]"
          density={density}
        />
        <CountPill icon="heart" label="Cuidar de mim" count={day.careCount} colorClass="bg-[#9b4d96]" density={density} />
        <CountPill
          icon="smile"
          label="Cuidar do meu filho"
          count={day.familyCount}
          colorClass="bg-[#2f3a56]"
          density={density}
        />
      </div>

      {/* Mensagem suave quando vazio */}
      {empty ? (
        <p className={`mt-2 ${emptyText} text-[var(--color-text-muted)] leading-relaxed`}>
          Esse dia ainda está em branco. Você pode começar pelos atalhos do planner ou adicionando um compromisso no calendário.
        </p>
      ) : null}
    </div>
  )
}

function hasAnyActivity(day: WeekDaySummary) {
  return day.agendaCount > 0 || day.top3Count > 0 || day.careCount > 0 || day.familyCount > 0
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
  badgeTextClass?: string
  iconTextClass?: string
  density: Density
}

function CountPill({ icon, label, count, colorClass, badgeTextClass, iconTextClass, density }: CountPillProps) {
  const hasItems = count > 0
  const isCompact = density === 'compact'

  const pillPad = isCompact ? 'px-2.5 py-1.5' : 'px-2.5 py-1.5'
  const labelText = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const badgeText = isCompact ? 'text-[9px]' : 'text-[10px]'
  const iconBox = isCompact ? 'h-6 w-6' : 'h-6 w-6'
  const iconSize = isCompact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5'

  return (
    <div
      className={[
        'flex items-center justify-between gap-2 rounded-xl border',
        pillPad,
        hasItems ? 'bg-white border-[#FFE0F0] shadow-[0_4px_14px_rgba(0,0,0,0.06)]' : 'bg-white/80 border-transparent',
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={[
            'inline-flex items-center justify-center rounded-full',
            iconBox,
            colorClass,
            iconTextClass ? iconTextClass : 'text-white',
          ].join(' ')}
        >
          <AppIcon name={icon} className={iconSize} decorative />
        </span>

        <span className={`${labelText} font-medium text-[var(--color-text-main)] truncate`}>{label}</span>
      </div>

      <span
        className={[
          'inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 font-semibold',
          badgeText,
          hasItems ? `${colorClass}` : 'bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]',
          hasItems ? (badgeTextClass ? badgeTextClass : 'text-white') : '',
        ].join(' ')}
      >
        {count}
      </span>
    </div>
  )
}
