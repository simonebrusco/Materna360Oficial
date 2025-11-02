'use client'
import * as React from 'react'

type Props = React.HTMLAttributes<HTMLDivElement>

export default function GridRhythm({ className = '', children, ...rest }: Props) {
  const merged = ['grid gap-6 sm:gap-6', className.trim()].filter(Boolean).join(' ')
  return (
    <div className={merged} {...rest}>
      {children}
    </div>
  )
}
