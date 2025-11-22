'use client'
import * as React from 'react'
import clsx from 'clsx'

export function PageH1({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1
      className={clsx(
        'text-3xl md:text-4xl font-bold text-[var(--color-text-main)] font-poppins',
        className
      )}
    >
      {children}
    </h1>
  )
}
export function SectionH2({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <h2 className={clsx('text-[16px] font-semibold text-[var(--color-text-main)] font-poppins', className)}>{children}</h2>
}
export function BlockH3({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <h3 className={clsx('text-[16px] font-semibold text-[var(--color-text-main)] font-poppins', className)}>{children}</h3>
}
