'use client'

<<<<<<< HEAD
import React, { type HTMLAttributes, type ReactNode } from 'react'
=======
import * as React from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside'

export interface SectionWrapperProps extends BaseAttributes {
<<<<<<< HEAD
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
<<<<<<< HEAD
  children: ReactNode
}

/**
 * Wrapper semântico de seção com cabeçalho opcional e a11y.
 * Usa createElement para suportar tag dinâmica no App Router.
=======
  children: ReactNode;
=======
  as?: SectionElementTag
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  header?: ReactNode
  headerClassName?: string
  contentClassName?: string
  children: ReactNode
>>>>>>> 974ac73 (fix(SectionWrapper): remove duplicate const and keep single content render)
}

/**
 * Wrapper semântico de seção com cabeçalho opcional.
<<<<<<< HEAD

 * Usa React.createElement para evitar erro com tag dinâmica em produção.

 * Usa React.createElement para evitar o erro “Unexpected token ElementTag” em produção
 * quando se usa JSX com tag dinâmica.

=======
 * Usa React.createElement para compatibilidade com o App Router.
>>>>>>> 974ac73 (fix(SectionWrapper): remove duplicate const and keep single content render)
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)
 */
function SectionWrapper({
  as = 'section',
  eyebrow,
  title,
  description,
  header,
  className = '',
  headerClassName = '',
  contentClassName,
  children,
  ...rest
}: SectionWrapperProps) {
  const ElementTag = as

  // A11y: liga o container ao título, se existir
  const autoId = React.useId()
  const headingId = title ? `section-heading-${autoId}` : undefined
<<<<<<< HEAD
=======

<<<<<<< HEAD

  // A11y: se houver título, tratamos como "region" para navegação por leitores de tela
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)

  // Se a tag não for <section>, só adiciona role="region" quando há título (label)
  const role =
    (as === 'div' || as === 'article' || as === 'aside' || as === 'main') && headingId
      ? 'region'
      : undefined

<<<<<<< HEAD
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
=======
  const mergedClassName = ['SectionWrapper', className.trim()].filter(Boolean).join(' ');
=======
  const mergedClassName = ['SectionWrapper', className].filter(Boolean).join(' ')
>>>>>>> 974ac73 (fix(SectionWrapper): remove duplicate const and keep single content render)
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div className={['SectionWrapper-header', headerClassName].filter(Boolean).join(' ')}>
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
<<<<<<< HEAD
=======

<<<<<<< HEAD

  const content = contentClassName.trim()
    ? <div className={contentClassName}>{children}</div>
    : children;
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)

  const content =
    contentClassName && contentClassName.trim() ? (
      <div className={contentClassName}>{children}</div>
    ) : (
      children
    )

<<<<<<< HEAD
  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {}
=======

  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {};
=======
  const content =
    (contentClassName && contentClassName.trim())
      ? <div className={contentClassName}>{children}</div>
      : children

  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {}
>>>>>>> 974ac73 (fix(SectionWrapper): remove duplicate const and keep single content render)
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)

  return React.createElement(
    ElementTag,
    { className: mergedClassName, ...ariaProps, ...rest },
    renderedHeader,
    content
  )
}

<<<<<<< HEAD
export default SectionWrapper
=======
<<<<<<< HEAD

// ⚠️ Não reexporte nomeado, para evitar Duplicate export.
// Mantenha apenas o default.

// ✅ Mantém compatibilidade: default export + named export (a própria função já é named)

export default SectionWrapper;
=======
export default SectionWrapper
>>>>>>> 974ac73 (fix(SectionWrapper): remove duplicate const and keep single content render)
>>>>>>> 46fc77b (fix: use default import for SectionWrapper everywhere)
