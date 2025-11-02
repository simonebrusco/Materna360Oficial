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

<<<<<<< HEAD
=======
/**
 * Wrapper semântico de seção com cabeçalho opcional.
 * Usa createElement para tag dinâmica de forma segura no App Router.
 */
>>>>>>> 2facc42 (fix(SectionWrapper): resolve merge markers; switch to default import across app)
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
<<<<<<< HEAD
  const ElementTag = as as unknown as keyof JSX.IntrinsicElements

  // A11y
  const autoId = React.useId()
  const headingId = title ? `section-heading-${autoId}` : undefined
=======
  const ElementTag = as
  const autoId = React.useId()
  const headingId = title ? `section-heading-${autoId}` : undefined

  const mergedClassName = ['SectionWrapper', className.trim()]
    .filter(Boolean)
    .join(' ')

  // A11y: se houver título e a tag não for <section>, usamos role=region
>>>>>>> 2facc42 (fix(SectionWrapper): resolve merge markers; switch to default import across app)
  const role =
    (as === 'div' || as === 'article' || as === 'aside' || as === 'main') && headingId
      ? 'region'
      : undefined
<<<<<<< HEAD

  const mergedClassName = ['SectionWrapper', (className || '').trim()]
    .filter(Boolean)
    .join(' ')
=======
>>>>>>> 2facc42 (fix(SectionWrapper): resolve merge markers; switch to default import across app)

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div
<<<<<<< HEAD
        className={['SectionWrapper-header', (headerClassName || '').trim()]
=======
        className={['SectionWrapper-header', headerClassName.trim()]
>>>>>>> 2facc42 (fix(SectionWrapper): resolve merge markers; switch to default import across app)
          .filter(Boolean)
          .join(' ')}
      >
        {eyebrow ? <span className="SectionWrapper-eyebrow">{eyebrow}</span> : null}
        {title ? (
          <h2 id={headingId} className="SectionWrapper-title">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="SectionWrapper-description">{description}</p>
        ) : null}
      </div>
    ) : null)

  const content =
<<<<<<< HEAD
    contentClassName && contentClassName.trim() ? (
      <div className={contentClassName}>{children}</div>
    ) : (
      children
    )
=======
    contentClassName && contentClassName.trim()
      ? <div className={contentClassName}>{children}</div>
      : children
>>>>>>> 2facc42 (fix(SectionWrapper): resolve merge markers; switch to default import across app)

  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {}

  return React.createElement(
    ElementTag,
    { className: mergedClassName, role, ...ariaProps, ...rest },
    renderedHeader,
    content
  )
}
