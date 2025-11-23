'use client'

import Link from 'next/link'
import type { ButtonHTMLAttributes } from 'react'

export function PrimaryLinkCTA(
  props: { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const { className = '', ...rest } = props
  return (
    <Link
      {...rest}
      className={`inline-flex items-center rounded-2xl px-5 py-3 text-sm font-medium shadow focus-visible:ring ${className}`}
    />
  )
}

export function PrimaryButtonCTA(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props
  return (
    <button
      {...rest}
      className={`inline-flex items-center rounded-2xl px-5 py-3 text-sm font-medium shadow focus-visible:ring ${className}`}
    />
  )
}
