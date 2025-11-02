'use client'
import * as React from 'react'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  highlight?: boolean
  compact?: boolean
}

export function Card({
  className = '',
  children,
  highlight = false,
  compact = false,
  ...rest
}: CardProps) {
  const merged = [
    'rounded-[12px] md:rounded-[16px]',
    'bg-white shadow-card border border-[rgba(47,58,86,0.08)]',
    compact ? 'p-4 md:p-5' : 'p-5 md:p-6',
    highlight && 'shadow-glow',
    className?.trim(),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={merged} role="group" {...rest}>
      {children}
    </div>
  )
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const merged = ['mb-2', props.className?.trim()].filter(Boolean).join(' ')
  return <div {...props} className={merged} />
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  const merged = [
    'text-[18px]/[24px] font-semibold text-ink md:text-[20px]/[28px]',
    props.className?.trim(),
  ]
    .filter(Boolean)
    .join(' ')
  return <h3 {...props} className={merged} />
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const merged = ['text-ash text-[14px]/[20px]', props.className?.trim()]
    .filter(Boolean)
    .join(' ')
  return <div {...props} className={merged} />
}

export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const merged = ['mt-4 flex items-center gap-3', props.className?.trim()]
    .filter(Boolean)
    .join(' ')
  return <div {...props} className={merged} />
}

// Mantém compatibilidade com `import Card from ...`
export default Card
