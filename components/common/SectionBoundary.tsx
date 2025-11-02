'use client'
import * as React from 'react'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  withPageGradient?: boolean
}

export default function SectionBoundary({
  className = '',
  withPageGradient = false,
  children,
  ...rest
}: Props) {
  const merged = [
    'pb-24',
    withPageGradient && 'bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]',
    className.trim(),
  ].filter(Boolean).join(' ')
  return (
    <div className={merged} {...rest}>
      {children}
    </div>
  )
}
