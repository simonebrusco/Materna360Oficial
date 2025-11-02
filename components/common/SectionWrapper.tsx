'use client'

import React, { useId, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type SectionTag = 'section' | 'div' | 'article' | 'main' | 'aside'

type BaseAttrs = Omit<HTMLAttributes<HTMLElement>, 'title'>

export interface SectionWrapperProps extends BaseAttrs {
  /** Tag do container (padrão: section) */
  as?: SectionTag
  /** Eyebrow opcional acima do título */
  eyebrow?: ReactNode
  /** Título da seção (gera aria-labelledby) */
  title?: ReactNode
  /** Descrição opcional abaixo do título */
  description?: ReactNode
  /** Header custom completo (substitui eyebrow/title/description) */
  header?: ReactNode
  /** Classe extra para o conteúdo interno */
  contentClassName?: string
  /** Conteúdo */
  children?: ReactNode
}

export default function SectionWrapper({
  as = 'section',
  eyebrow,
  title,
  description,
  header,
  className,
  contentClassName,
  children,
  ...rest
}: SectionWrapperProps) {
  const Tag = as as unknown as keyof JSX.IntrinsicElements

  // A11y: id estável pro heading e role=region quando não for <section>
  const autoId = useId()
  const headingId = title ? `sw-${autoId}` : undefined
  const regionRole = as !== 'section' && headingId ? 'region' : undefined

  const hasHeader = Boolean(header || title || description || eyebrow)

  return (
    <Tag
      className={clsx('SectionWrapper space-y-6', className)}
      aria-labelledby={headingId}
      role={regionRole}
      {...rest}
    >
      {hasHeader && (
        <header className="SectionWrapper-header space-y-2">
          {eyebrow ? (
            <span className="SectionWrapper-eyebrow text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">
              {eyebrow}
            </span>
          ) : null}

          {title ? (
            <h2 id={headingId} className="SectionWrapper-title text-xl font-semibold text-support-1">
              {title}
            </h2>
          ) : null}

          {description ? (
            <p className="SectionWrapper-description text-support-2/90">
              {description}
            </p>
          ) : null}

          {header ?? null}
        </header>
      )}

      <div className={clsx('SectionWrapper-content space-y-4', contentClassName)}>
        {children}
      </div>
    </Tag>
  )
}
