'use client'
import * as React from 'react'
import clsx from 'clsx'

export function PageH1({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1
      className={clsx(
        'text-[22px]/[28px] md:text-[28px]/[34px] font-semibold tracking-[-0.01em]',
        className
      )}
    >
      {children}
    </h1>
  )
}
export function SectionH2({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <h2 className={clsx('text-[16px] font-semibold', className)}>{children}</h2>
}
export function BlockH3({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <h3 className={clsx('text-[16px] font-semibold', className)}>{children}</h3>
}
