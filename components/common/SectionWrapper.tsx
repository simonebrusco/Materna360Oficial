'use client'

import React, { useId, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type SectionTag = 'section' | 'div' | 'article' | 'main' | 'aside'
type BaseAttrs = Omit<HTMLAttributes<HTMLElement>, 'title'>

export interface SectionWrapperProps extends BaseAttrs {
  as?: SectionTag
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  header?: ReactNode
  contentClassName?: string
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
  const tag: SectionTag = as
  const autoId = useId()
  const headingId = title ? `sw-${autoId}` : undefined
  const regionRole = tag !== 'section' && headingId ? 'region' : undefined
  const hasHeader = Boolean(header || title || description || eyebrow)

  const headerNode = hasHeader ? (
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
  ) : null

  const contentNode = (
    <div className={clsx('SectionWrapper-content space-y-4', contentClassName)}>
      {children}
    </div>
  )

  const containerProps: React.HTMLAttributes<HTMLElement> = {
    className: clsx('SectionWrapper space-y-6', className),
    ...(headingId ? { 'aria-labelledby': headingId } : {}),
    ...(regionRole ? { role: regionRole } : {}),
    ...rest,
  }

  return React.createElement(tag, containerProps, headerNode, contentNode)
}
