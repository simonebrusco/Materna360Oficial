'use client'

import clsx from 'clsx'
import * as React from 'react'

type SectionElementTag =
  | 'section'
  | 'div'
  | 'main'
  | 'aside'
  | 'nav'
  | 'header'
  | 'footer'
  | 'article'

// ⚠️ Removemos 'title' dos HTMLAttributes para evitar conflito com o tooltip.
export type SectionWrapperProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  as?: SectionElementTag
  eyebrow?: React.ReactNode
  /** Conteúdo do título (não é o tooltip HTML) */
  title?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  actions?: React.ReactNode
  contentClassName?: string
  titleId?: string
}

export default function SectionWrapper({
  as = 'section',
  eyebrow,
  title,
  description,
  header,
  actions,
  children,
  className,
  contentClassName,
  titleId,
  ...rest
}: SectionWrapperProps) {
  const uid = React.useId()
  const headingId = titleId ?? (title ? uid : undefined)
  const descId = description && headingId ? `${headingId}-desc` : undefined

  const ElementTag = (as ?? 'section') as any

  return (
    <ElementTag
      className={clsx('SectionWrapper relative mb-10', className)}
      aria-labelledby={headingId}
      aria-describedby={descId}
      {...rest}
    >
      {header ? (
        header
      ) : (
        <header className="SectionWrapper-header mb-6">
          {eyebrow ? (
            <span className="SectionWrapper-eyebrow block text-[11px] font-semibold uppercase tracking-[0.28em] text-support-2/80">
              {eyebrow}
            </span>
          ) : null}

          {(title || actions) && (
            <div className="flex items-start justify-between gap-3">
              {title ? (
                <h2 id={headingId} className="SectionWrapper-title text-xl font-semibold text-support-1 md:text-2xl">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              {actions ? <div className="SectionWrapper-actions">{actions}</div> : null}
            </div>
          )}

          {description ? (
            <p id={descId} className="SectionWrapper-description mt-2 max-w-2xl text-sm text-support-2/90">
              {description}
            </p>
          ) : null}
        </header>
      )}

      <div className={clsx('SectionWrapper-content space-y-4', contentClassName)}>
        {children}
      </div>
    </ElementTag>
  )
}
