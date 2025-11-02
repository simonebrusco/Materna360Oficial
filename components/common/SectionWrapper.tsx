'use client'

import clsx from 'clsx'
import * as React from 'react'

/** Tags semânticas suportadas para o container */
type SectionElementTag =
  | 'section'
  | 'div'
  | 'main'
  | 'aside'
  | 'nav'
  | 'header'
  | 'footer'
  | 'article'

export type SectionWrapperProps = React.HTMLAttributes<HTMLElement> & {
  /** Troca a tag semântica do container (padrão: section) */
  as?: SectionElementTag
  /** Eyebrow opcional acima do título */
  eyebrow?: React.ReactNode
  /** Título da seção – pode ser string ou JSX (com ícones, spans, etc.) */
  title?: React.ReactNode
  /** Descrição curta abaixo do título */
  description?: React.ReactNode
  /** Header totalmente customizado (substitui eyebrow/title/description/actions) */
  header?: React.ReactNode
  /** Ações à direita do título (botões, links, etc.) */
  actions?: React.ReactNode
  /** Classe aplicada na área interna (onde ficam os children) */
  contentClassName?: string
  /** Força um id para o título (aria-labelledby) */
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
  // ID acessível para aria-labelledby/aria-describedby quando possível
  const autoTitleId = React.useId()
  const headingId =
    titleId ??
    (typeof title === 'string' || React.isValidElement(title) ? autoTitleId : undefined)
  const descId = description ? `${headingId ?? React.useId()}-desc` : undefined

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
