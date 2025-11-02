'use client'

import * as React from 'react'
import clsx from 'clsx'

type Props = React.HTMLAttributes<HTMLSpanElement>

export default function Badge({ className, ...rest }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold',
        'bg-[#ffd8e6] text-[#2f3a56]',
        className
      )}
      {...rest}
    />
  )
}
