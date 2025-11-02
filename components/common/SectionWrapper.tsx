'use client'

import React, { type HTMLAttributes, type ReactNode } from 'react'

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside'

export interface SectionWrapperProps extends BaseAttributes {
  as?: SectionElementTag
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  header?: ReactNode
  headerClassName?: string
  contentClassName?: string
  children: ReactNode
}

export default function SectionWrapper({
  as = 'section',
  eyebrow,
  title,
  description,
  header,
  className = '',
  headerClassName = '',
  contentClassName = '',
  children,
  ...rest
}: SectionWrapperProps) {
  // forçar tipo seguro para tag dinâmica
  const ElementTag = as as unknown as keyof JSX.IntrinsicElements

  // A11y
  const autoId = React.useId()
  const headingId = title ? `section-heading-${autoId}` : undefined

  // role=region quando NÃO for <section> e houver título
  const role =
    (as === 'div' || as === 'article' || as === 'aside' || as === 'main') && headingId
      ? 'region'
      : undefined

  const mergedClassName = ['SectionWrapper', (className || '').trim()]
    .filter(Boolean)
    .join(' ')

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div
        className={['SectionWrapper-header', (headerClassName || '').trim()]
          .filter(Boolean)
          .join(' ')}
      >
        {eyebrow ? <span className="SectionWrapper-eyebrow">{eyebrow}</span> : null}
        {title ? (
          <h2 id={headingId} className="SectionWrapper-title">
            {title}
          </h2>
        ) : null}
        {description ? <p className="SectionWrapper-description">{description}</p> : null}
      </div>
    ) : null)

  const content =
    (contentClassName && contentClassName.trim())
      ? <div className={contentClassName}>{children}</div>
      : children

  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {}

  return React.createElement(
    ElementTag,
    { className: mergedClassName, role, ...ariaProps, ...rest },
    renderedHeader,
    content
  )
}
