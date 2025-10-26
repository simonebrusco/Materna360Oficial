import type { HTMLAttributes, ReactNode } from 'react'

export const GRID_RHYTHM_DESCRIPTION_CLAMP_CLASS = 'GridRhythm-descriptionClamp'

interface GridRhythmProps extends HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements
  children: ReactNode
}

export function GridRhythm({ as = 'div', className = '', children, ...rest }: GridRhythmProps) {
  const ElementTag = as
  const mergedClassName = ['GridRhythm', className].filter(Boolean).join(' ')

  return (
    <ElementTag className={mergedClassName} {...rest}>
      {children}
    </ElementTag>
  )
}
