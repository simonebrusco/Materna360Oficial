import type { HTMLAttributes } from 'react'

export function Skeleton(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`animate-pulse rounded-md bg-slate-200 ${props.className ?? ''}`} />
}
