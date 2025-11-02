'use client'

import React, { type HTMLAttributes, type ReactNode } from 'react'

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside'

export interface SectionWrapperProps extends BaseAttributes {
  /** Troca a tag semântica do container (padrão: section) */
  as?: SectionElementTag
  /** Eyebrow opcional acima do título */
  eyebrow?: ReactNode
  /** Título da seção (gera aria-labelledby) */
  title?: ReactNode
  /** Descrição curta abaixo do título */
  description?: ReactNode
  /** Permite injetar um header completo, ignorando eyebrow/title/description */
  header?: ReactNode
  /** Classes extras no header */
  headerClassName?: string
  /** Classes extras no conteúdo interno (wrap dos children) */
  contentClassName?: string
  /** Conteúdo da seção */
  children: ReactNode
}

/**
 * Wrapper semântico de seção com cabeçalho opcional e a11y.
 * Usa createElement para suportar tag dinâmica no App Router.
 */
function SectionWrapper({
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
  const ElementTag = as

  // A11y: liga o container ao título, se existir
  const autoId = React.useId()
  const headingId = title ? `section-heading-${autoId}` : undefined

  // Se a tag não for <section>, só adiciona role="region" quando há título (label)
  const role =
    (as === 'div' || as === 'article' || as === 'aside' || as === 'main') && headingId
      ? 'region'
      : undefined

  const mergedClassName = ['SectionWrapper', className.trim()].filter(Boolean).join(' ')

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div
        className={['SectionWrapper-header', headerClass]()

# 1) Substituir o arquivo conflitado por uma versão limpa
cat > components/common/SectionWrapper.tsx <<'TS'
'use client'

import React, { type HTMLAttributes, type ReactNode } from 'react'

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside'

export interface SectionWrapperProps extends BaseAttributes {
  /** Troca a tag semântica do container (padrão: section) */
  as?: SectionElementTag
  /** Eyebrow opcional acima do título */
  eyebrow?: ReactNode
  /** Título da seção (gera aria-labelledby) */
  title?: ReactNode
  /** Descrição curta abaixo do título */
  description?: ReactNode
  /** Permite injetar um header completo, ignorando eyebrow/title/description */
  header?: ReactNode
  /** Classes extras no header */
  headerClassName?: string
  /** Classes extras no conteúdo interno (wrap dos children) */
  contentClassName?: string
  /** Conteúdo da seção */
  children: ReactNode
}

/**
 * Wrapper semântico de seção com cabeçalho opcional e a11y.
 * Usa createElement para suportar tag dinâmica no App Router.
 */
function SectionWrapper({
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
  const ElementTag = as

  // A11y: liga o container ao título, se existir
  const autoId = React.useId()
  const headingId = title ? `section-heading-${autoId}` : undefined

  // Se a tag não for <section>, só adiciona role="region" quando há título (label)
  const role =
    (as === 'div' || as === 'article' || as === 'aside' || as === 'main') && headingId
      ? 'region'
      : undefined

  const mergedClassName = ['SectionWrapper', className.trim()].filter(Boolean).join(' ')

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div
        className={['SectionWrapper-header', headerClassName.trim()]
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
    contentClassName && contentClassName.trim() ? (
      <div className={contentClassName}>{children}</div>
    ) : (
      children
    )

  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {}

  return React.createElement(
    ElementTag,
    { className: mergedClassName, role, ...ariaProps, ...rest },
    renderedHeader,
    content
  )
}

export default SectionWrapper
