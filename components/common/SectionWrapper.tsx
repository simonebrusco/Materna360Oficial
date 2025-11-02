
// @ts-nocheck
'use client'

import clsx from 'clsx'
import type { ReactNode } from 'react'

type SectionElementTag = 'section' | 'div' | 'article' | 'header' | 'main'

export type SectionWrapperProps = React.HTMLAttributes<HTMLElement> & {
  /** Tag semântica do container (padrão: section) */

'use client'


import React, { type HTMLAttributes, type ReactNode } from 'react'

import React, { type HTMLAttributes, type ReactNode } from 'react';


type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside'

export interface SectionWrapperProps extends BaseAttributes {


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



  /** Troca a tag semântica do container (padrão: section) */
  as?: SectionElementTag;
  /** Eyebrow opcional acima do título */
  eyebrow?: ReactNode;
  /** Título da seção (gera aria-labelledby) */
  title?: ReactNode;
  /** Descrição curta abaixo do título */
  description?: ReactNode;
  /** Permite injetar um header completo, ignorando eyebrow/title/description */
  header?: ReactNode;
  /** Classes extras no header */
  headerClassName?: string;
  /** Classes extras no conteúdo interno (wrap dos children) */
  contentClassName?: string;
  /** Conteúdo da seção */
  children: ReactNode;
}

/**
 * Wrapper semântico de seção com cabeçalho opcional.
 * Usa React.createElement para compatibilidade total com App Router.
 */


export default function SectionWrapper({
  as = 'section',
  eyebrow,
  title,
  description,
  header,

  className,
  contentClassName,

  className = '',
  headerClassName = '',
  contentClassName = '',

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

  // A11y extra: quando a tag não é <section>, podemos marcar como "region"
  const role =
    as === 'div' || as === 'article' || as === 'aside' || as === 'main'
      ? (headingId ? 'region' : undefined)
      : undefined;

  const mergedClassName = ['SectionWrapper', className.trim()].filter(Boolean).join(' ');


  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div

        className={['SectionWrapper-header', (headerClassName || '').trim()]

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
        {description ? <p className="SectionWrapper-description">{description}</p> : null}
      </div>
    ) : null)

  const content =

    (contentClassName && contentClassName.trim())
      ? <div className={contentClassName}>{children}</div>
      : children

    contentClassName.trim() ? <div className={contentClassName}>{children}</div> : children;


  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {}

  return React.createElement(
    ElementTag,
    { className: mergedClassName, role, ...ariaProps, ...rest },
    renderedHeader,
    content

  )
}
