

cat > components/common/SectionWrapper.tsx <<'TSX'

'use client'

import React, { useId, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type SectionElementTag =
  | 'section' | 'div' | 'main' | 'aside' | 'header' | 'footer' | 'article' | 'nav'

type BaseAttrs = Omit<HTMLAttributes<HTMLElement>, 'title'>

export interface SectionWrapperProps extends BaseAttrs {
  as?: SectionElementTag
  id?: string
  header?: ReactNode
  eyebrow?: ReactNode
  /** Aceita string OU ReactNode (ex.: <span>…</span>) */
  title?: ReactNode
  /** Aceita string OU ReactNode */
  description?: ReactNode
  contentClassName?: string
  role?: string
  children?: ReactNode
}

/**
 * Wrapper semântico de seção com cabeçalho opcional.
 * Implementado com React.createElement para evitar problemas de parsing com JSX dinâmico.
 */
export default function SectionWrapper({
  as = 'section',
  id,
  header,
  eyebrow,
  title,
  description,
  className,
  contentClassName,
  role,
  children,
  ...rest
}: SectionWrapperProps) {
  // id estável para heading e role=region quando não for <section>
  const autoId = useId()
  const headingId = title ? (id ?? `sec-${autoId}`) : undefined
  const regionRole = role ?? ((as !== 'section' && headingId) ? 'region' : undefined)

  const mergedClassName = clsx(
    'SectionWrapper relative rounded-soft-3xl border border-white/60 bg-white/90 p-6 shadow-soft sm:p-7',
    className
  )

  const defaultHeader =
    (eyebrow || title || description) ? (
      <header className="SectionWrapper-header mb-5 space-y-2">
        {eyebrow ? (
          <span className="SectionWrapper-eyebrow text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">
            {eyebrow}
          </span>
        ) : null}
        {title ? (
          <h2 id={headingId} className="SectionWrapper-title text-lg font-semibold text-support-1 md:text-xl">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="SectionWrapper-description text-sm text-support-2/90">
            {description}
          </p>
        ) : null}
      </header>
    ) : null

  const containerProps: HTMLAttributes<HTMLElement> = {
    className: mergedClassName,
    ...(headingId ? { 'aria-labelledby': headingId } : {}),
    ...(regionRole ? { role: regionRole } : {}),
    ...rest,
  }

  const contentNode = (
    <div className={clsx('SectionWrapper-content space-y-4', contentClassName)}>
      {children}
    </div>
  )

  return React.createElement(as, containerProps, header ?? defaultHeader, contentNode)
}
TSX
