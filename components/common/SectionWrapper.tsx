// components/common/SectionWrapper.tsx
import * as React from 'react'
import clsx from 'clsx'

type SectionElementTag =
  | 'section' | 'div' | 'main' | 'aside' | 'header' | 'footer' | 'article' | 'nav'

export type SectionWrapperProps = React.HTMLAttributes<HTMLElement> & {
  as?: SectionElementTag
  id?: string
  header?: React.ReactNode
  eyebrow?: React.ReactNode
  /** Aceita string OU ReactNode (ex.: <span>…</span>) */
  title?: React.ReactNode
  /** Aceita string OU ReactNode */
  description?: React.ReactNode
  contentClassName?: string
  role?: string
}

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
  // useId sempre no topo (nunca condicional)
  const autoId = React.useId()
  const headingId = id ?? `sec-${autoId}`

  const ElementTag = as

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

  return (
    <ElementTag
      className={mergedClassName}
      role={role}
      aria-labelledby={title ? headingId : undefined}
      {...rest}
    >
      {header ?? defaultHeader}
      <div className={clsx('SectionWrapper-content space-y-4', contentClassName)}>
        {children}
      </div>
    </ElementTag>
  )
}
