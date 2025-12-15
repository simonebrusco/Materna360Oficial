'use client'

import type { ReactNode } from 'react'

type TabPillProps = {
  children: ReactNode
}

export function TabPill({ children }: TabPillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
      {children}
    </span>
  )
}
