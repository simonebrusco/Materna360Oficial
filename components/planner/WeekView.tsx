'use client'

import React from 'react'
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

type Density = 'compact' | 'normal'

type WeekViewProps = {
  weekData: WeekDaySummary[]
  density?: Density
}

export default function WeekView({ weekData, density = 'normal' }: WeekViewProps) {
  if (!weekData || weekData.length === 0) return null

  const isCompact = density === 'compact'

  const shellPad = isCompact ? 'p-3 md:p-4' : 'p-4 md:p-6'
  const shellGap = isCompact ? 'space-y-3' : 'space-y-4'

  const headerKicker = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const headerTitle = isCompact ? 'text-base md:text-lg' : 'text-lg md:text-xl'
  const headerDesc = isCompact ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'

  const legendText = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'

  const hintText = isCompact ? 'text-[10px]' : 'text-[11px]'

  return (
    <SoftCard
      className={[
        'rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.06)]',
        shellPad,
        shellGap,
      ].join(' ')}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p
            className={[
              headerKicker,
              'font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]',
            ].join(' ')}
          >
            Visão da semana
          </p>

          <h2 className={[headerTitle, 'font-semibold text-[var(--color-text-main)]'].join(' ')}>
            Como está a sua semana?
          </h2>

          <p
            className={[
              headerDesc,
              'text-[var(--color-text-muted)] mt-1 max-w-xl',
            ].join(' ')}
          >
            Veja, em cada dia da semana, quantos compromissos, prioridades e cuidados com você e com seu filho já foram planejados.
          </p>
        </div>

        <div className={['inline-flex flex-wrap gap-2', legendText, 'text-[var(--color-text-muted)]'].join(' ')}>
          <LegendDot density={density} colorClass="bg-[var(--color-brand)]" label="Agenda & compromissos" />
          <LegendDot density={density} colorClass="bg-[#FFB3D3]" label="Prioridades do dia" />
          <LegendDot density={density} colorClass="bg-[#9b4d96]" label="Cuidar de mim" />
          <LegendDot density={density} colorClass="bg-[#2f3a56]" label="Cuidar do meu filho" />
        </div>
      </div>

      {/* Board da semana */}
      <div className="relative">
        {/* Mobile: carrossel com snap | Desktop: grid 7 colunas */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scroll-px-4">
          <div className="flex gap-3">
            {weekData.map((day) => (
              <DayCard
                key={`${day.dayName}-${day.dayNumber}`}
                day={day}
                variant="mobile"
                density={density}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {weekData.map((day) => (
              <DayCard
                key={`${day.dayName}-${day.dayNumber}`}
                day={day}
                variant="desktop"
                density={density}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dica adaptativa */}
      <p className={[hintText, 'text-[var(--color-text-muted)]'].join(' ')}>
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

  const cardPadMobile = isCompact ? 'p-2.5' : 'p-3'
  const cardPadDesktop = isCompact ? 'p-2.5 md:p-3' : 'p-2.5 md:p-3.5'
  const cardMinHMobile = isCompact ? 'min-h-[158px]' : 'min-h-[172px]'
  const cardMinHDesktop = isCompact ? 'min-h-[148px]' : 'min-h-[160px]'

  const dayNameClass = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const dayNumberClass = isCompact ? 'text-sm md:text-sm' : 'text-sm md:text-base'

  const badgeText = isCompact ? 'text-[9px]' : 'text-[10px]'

  const emptyText = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'

  return (
    <div
      className={[
        'flex flex-col rounded-2xl border border-[var(--color-soft-strong)] bg-[var(--color-soft-bg)]/60',
        variant === 'mobile'
          ? `snap-start shrink-0 w-[82vw] max-w-[360px] ${cardPadMobile} ${cardMinHMobile}`
          : `${cardPadDesktop} ${cardMinHDesktop}`,
      ].join(' ')}
    >
      {/* Cabeçalho do dia */}
      <div className={['flex items-start justify-between gap-2', isCompact ? 'mb-1.5' : 'mb-2'].join(' ')}>
        <div className="leading-tight">
          <p className={[dayNameClass, 'font-semibold uppercase tracking-wide text-[var(--color-text-muted)]'].join(' ')}>
            {day.dayName}
          </p>
          <p className={[dayNumberClass, 'font-semibold text-[var(--color-text-main)]'].join(' ')}>
            {day.dayNumber}
          </p>
        </div>

        {hasAnyActivity(day) ? (
          <span
            className={[
              'inline-flex items-center gap-1 rounded-full bg-white/90 border border-[#FFE8F2] px-2 py-0.5 font-medium text-[var(--color-brand-deep)] whitespace-nowrap',
              badgeText,
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
            Dia em movimento
          </span>
        ) : null}
      </div>

      {/* Pills de contagem */}
      <div className={isCompact ? 'space-y-1' : 'space-y-1.5'}>
        <CountPill density={density} icon="calendar" label="Agenda & compromissos" count={day.agendaCount} colorClass="bg-[var(--color-brand)]" />

        <CountPill
          density={density}
          icon="target"
          label="Prioridades do dia"
          count={day.top3Count}
          colorClass="bg-[#FFB3D3]"
          badgeTextClass="text-[#C2285F]"
          iconTextClass="text-[#C2285F]"
        />

        <CountPill density={density} icon="heart" label="Cuidar de mim" count={day.careCount} colorClass="bg-[#9b4d96]" />

        <CountPill
          density={density}
          icon="smile"
          label="Cuidar do meu filho"
          count={day.familyCount}
          colorClass="bg-[#2f3a56]"
        />
      </div>

      {/* Mensagem suave quando vazio */}
      {empty ? (
        <p className={['mt-2 text-[var(--color-text-muted)] leading-relaxed', emptyText].join(' ')}>
          Esse dia ainda está em branco. Você pode começar pelos atalhos do planner ou adicionando um compromisso no calendário.
        </p>
      ) : null}
    </div>
  )
}

function hasAnyActivity(day: WeekDaySummary) {
  return day.agendaCount > 0 || day.top3Count > 0 || day.careCount > 0 || day.familyCount > 0
}

function LegendDot({
  colorClass,
  label,
  density,
}: {
  colorClass: string
  label: string
  density: Density
}) {
  const isCompact = density === 'compact'
  const textClass = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const padClass = isCompact ? 'px-2.5 py-0.5' : 'px-2.5 py-1'

  return (
    <span className={['inline-flex items-center gap-1 rounded-full bg-white/90 border border-[#F5D7E5]', padClass].join(' ')}>
      <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
      <span className={[textClass, 'font-medium text-[var(--color-text-muted)]'].join(' ')}>{label}</span>
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

  const wrapPad = isCompact ? 'px-2 py-1' : 'px-2.5 py-1.5'
  const labelClass = isCompact ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
  const iconSize = isCompact ? 'h-5 w-5' : 'h-6 w-6'
  const iconInner = isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const badgeText = isCompact ? 'text-[9px]' : 'text-[10px]'
  const badgePad = isCompact ? 'px-1.5 py-0.5' : 'px-1.5 py-0.5'

  return (
    <div
      className={[
        'flex items-center justify-between gap-2 rounded-xl border',
        wrapPad,
        hasItems ? 'bg-white border-[#FFE0F0] shadow-[0_4px_14px_rgba(0,0,0,0.06)]' : 'bg-white/80 border-transparent',
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={[
            'inline-flex items-center justify-center rounded-full',
            iconSize,
            colorClass,
            iconTextClass ? iconTextClass : 'text-white',
          ].join(' ')}
        >
          <AppIcon name={icon} className={iconInner} decorative />
        </span>

        <span className={[labelClass, 'font-medium text-[var(--color-text-main)] truncate'].join(' ')}>
          {label}
        </span>
      </div>

      <span
        className={[
          'inline-flex min-w-[22px] items-center justify-center rounded-full font-semibold',
          badgePad,
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
