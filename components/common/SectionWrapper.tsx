'use client'

import React, { useId, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'header' | 'aside'

type BaseAttrs = Omit<HTMLAttributes<HTMLElement>, 'title'>

export interface SectionWrapperProps extends BaseAttrs {
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
  // tag dinâmica segura para JSX
  const Tag = as as unknown as keyof JSX.IntrinsicElements

  // A11y: id estável pro heading e role=region quando não for <section>
  const autoId = useId()
  const headingId = title ? `sw-${autoId}` : undefined
  const role =
    as !== 'section' && headingId
      ? 'region'
      : undefined

  const hasHeader = Boolean(header || title || description || eyebrow)

  return (
    <Tag
      className={clsx('SectionWrapper space-y-6', className)}
      aria-labelledby={headingId}
      role={role}
      {...rest}
    >
      {hasHeader && (
        <header className="SectionWrapper-header space-y-2">
          {eyebrow ? (
            <span className="SectionWrapper-eyebrow text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">
              {eyebrow}
            </span>
          ) : null}

          {title

# 1) Garanta refs atualizadas e volte pra main local igual à remota
git fetch --all --prune
git switch -C main origin/main

# 2) Crie uma branch de PR (a main tem regra que bloqueia push direto)
git switch -c fix/sectionwrapper-build

# 3) (A) Sobrescreva SectionWrapper.tsx com uma versão limpa e segura
cat > components/common/SectionWrapper.tsx <<'TSX'
'use client'

import React, { useId, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'header' | 'aside'

type BaseAttrs = Omit<HTMLAttributes<HTMLElement>, 'title'>

export interface SectionWrapperProps extends BaseAttrs {
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
  // tag dinâmica segura para JSX
  const Tag = as as unknown as keyof JSX.IntrinsicElements

  // A11y: id estável pro heading e role=region quando não for <section>
  const autoId = useId()
  const headingId = title ? `sw-${autoId}` : undefined
  const role =
    as !== 'section' && headingId
      ? 'region'
      : undefined

  const hasHeader = Boolean(header || title || description || eyebrow)

  return (
    <Tag
      className={clsx('SectionWrapper space-y-6', className)}
      aria-labelledby={headingId}
      role={role}
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
