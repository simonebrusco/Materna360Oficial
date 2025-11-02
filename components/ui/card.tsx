'use client'

import * as React from 'react'
import clsx from 'clsx'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card(props: DivProps) {
  const { className, ...rest } = props
  return (
    <div
      className={clsx(
        'rounded-3xl bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80',
        'shadow-[0_8px_28px_rgba(47,58,86,.08),_inset_0_0_0_1px_rgba(47,58,86,.04)]',
        'border border-[#2f3a56]/5 transition-transform duration-300 ease-gentle',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(47,58,86,.10),_inset_0_0_0_1px_rgba(47,58,86,.05)]',
        'focus-within:ring-2 focus-within:ring-[#ff005e]/30',
        className
      )}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: DivProps) {
  return <div className={clsx('p-5 md:p-6', className)} {...rest} />
}

export function CardTitle({ className, ...rest }: DivProps) {
  return (
    <div
      className={clsx(
        'text-[17px] md:text-[18px] font-semibold tracking-[-0.01em] text-[#2f3a56]',
        className
      )}
      {...rest}
    />
  )
}

export function CardContent({ className, ...rest }: DivProps) {
  return <div className={clsx('px-5 pb-5 md:px-6 md:pb-6', className)} {...rest} />
}

export function CardFooter({ className, ...rest }: DivProps) {
  return <div className={clsx('px-5 pb-5 md:px-6 md:pb-6', className)} {...rest} />
}

export default Card
