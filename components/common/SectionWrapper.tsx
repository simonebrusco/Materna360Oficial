import type { HTMLAttributes, ReactNode } from 'react'

/* Sanitize section titles to remove emoji/garbled characters */
const stripEmoji = (s: string) =>
  s
    // remove most emoji/pictographs + VS-16/FE0F
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]/gu, '')
    // remove stray replacement chars often shown as "�"
    .replace(/\uFFFD/g, '')
    .trim()

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

  const renderedTitle = typeof title === 'string' ? stripEmoji(title) : title
  const renderedDescription = typeof description === 'string' ? stripEmoji(description) : description

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div className={['SectionWrapper-header', headerClassName].filter(Boolean).join(' ')}>
        {eyebrow ? <span className="SectionWrapper-eyebrow">{eyebrow}</span> : null}
        {renderedTitle ? <h2 className="SectionWrapper-title">{renderedTitle}</h2> : null}
        {renderedDescription ? (
          <p className="SectionWrapper-description">{renderedDescription}</p>
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
