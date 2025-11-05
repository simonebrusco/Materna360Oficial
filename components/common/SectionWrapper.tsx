import type { HTMLAttributes, ReactNode } from 'react'

/* Sanitize section titles to remove emoji/garbled characters */
const STRIP_EMOJI = /([\u2700-\u27BF]|\u24C2|[\uE000-\uF8FF]|[\uFE00-\uFE0F]|[\u2600-\u26FF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]|\u200D)/g
const cleanTitle = (s: string) => s.replace(STRIP_EMOJI, '').replace(/[^\S\r\n]{2,}/g, ' ').replace(/[�]+/g, '').trim()

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>

type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside'

interface SectionWrapperProps extends BaseAttributes {
  as?: SectionElementTag
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
