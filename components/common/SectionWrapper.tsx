import type { HTMLAttributes, ReactNode } from 'react'

interface SectionWrapperProps extends HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  header?: ReactNode
  headerClassName?: string
  contentClassName?: string
  children: ReactNode
}

export function SectionWrapper({
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
  const mergedClassName = [
    'SectionWrapper',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div className={['SectionWrapper-header', headerClassName].filter(Boolean).join(' ')}>
        {eyebrow ? <span className="SectionWrapper-eyebrow">{eyebrow}</span> : null}
        {title ? <h2 className="SectionWrapper-title">{title}</h2> : null}
        {description ? (
          <p className="SectionWrapper-description">{description}</p>
        ) : null}
      </div>
    ) : null)

  const content = contentClassName ? <div className={contentClassName}>{children}</div> : children

  return (
    <ElementTag className={mergedClassName} {...rest}>
      {renderedHeader}
      {content}
    </ElementTag>
  )
}
