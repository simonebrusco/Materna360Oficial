// @ts-nocheck
'use client'

import clsx from 'clsx'
import type { ReactNode } from 'react'

type SectionElementTag = 'section' | 'div' | 'article' | 'header' | 'main'

export type SectionWrapperProps = React.HTMLAttributes<HTMLElement> & {
  /** Tag semântica do container (padrão: section) */
  as?: SectionElementTag
  /** Eyebrow opcional acima do título */
  eyebrow?: ReactNode
  /** Título da seção (gera aria-labelledby) */
  title?: ReactNode
  /** Descrição opcional abaixo do título */
  description?: ReactNode
  /** Header custom completo (se passar, substitui eyebrow/title/description) */
  header?: ReactNode
  /** Classe extra para o conteúdo interno */
  contentClassName?: string
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
  role,
  ...rest
}: SectionWrapperProps) {
  // Em runtime o JSX aceita string com nome da tag HTML:
  const ElementTag = as as unknown as keyof JSX.IntrinsicElements

  const hasHeader = !!(header || title || description || eyebrow)
  const titleId = title ? `sw-${Math.random().toString(36).slice(2, 9)}` : undefined

  const mergedClassName = clsx('SectionWrapper space-y-6', className)

  return (
    <ElementTag
      className={mergedClassName}
      role={role}
      aria-labelledby={titleId}
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
            <h2 id={titleId} className="SectionWrapper-title text-xl font-semibold text-support-1">
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
    </ElementTag>
  )
}
