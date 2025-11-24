'use client'

import * as React from 'react'
import clsx from 'clsx'

type BaseCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Elemento base do card.
   * Mantemos `div` como padrão para não quebrar layout existente.
   */
  as?: 'div'
}

/**
 * Card genérico — pode ser usado em áreas internas ou administrativas.
 * Mantém um visual limpo e neutro.
 */
export function Card({ as: Tag = 'div', className, ...props }: BaseCardProps) {
  return (
    <Tag
      className={clsx(
        'rounded-2xl bg-white border border-[#e7e7ea]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
        'transition-all duration-150',
        className
      )}
      {...props}
    />
  )
}

/**
 * SoftCard — padrão PREMIUM do Materna360.
 *
 * Este é o card que usamos nos hubs, planner e páginas principais.
 * Ele tem:
 * - cantos mais orgânicos
 * - sombra suave
 * - borda em tom próximo ao rosa da marca
 * - comportamento consistente em todo o app
 */
export function SoftCard({ as: Tag = 'div', className, ...props }: BaseCardProps) {
  return (
    <Tag
      className={clsx(
        // Base visual
        'rounded-3xl bg-white',
        'border border-[#ffd8e6]',
        'shadow-[0_4px_14px_rgba(0,0,0,0.04)]',

        // Comportamento
        'transition-all duration-150',
        'will-change-transform, box-shadow',

        // Hover bem sutil (não vira “botão”)
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]',

        // Em telas menores mantemos o comportamento calmo
        'md:hover:-translate-y-[2px]',

        className
      )}
      {...props}
    />
  )
}

/**
 * Wrapper simples para listas de cards.
 * Não é obrigatório, mas ajuda a manter consistência onde for usado.
 * Se o seu projeto não usar, não tem problema — não quebra nada.
 */
export function CardGrid({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('grid grid-cols-1 gap-4 md:gap-6', className)}
      {...props}
    />
  )
}
