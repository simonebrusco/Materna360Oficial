'use client'

import * as React from 'react'

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger'

export type ToastOptions = {
  id?: string
  title?: string
  message: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastState = (ToastOptions & { id: string }) | null

let pushToastImpl: ((t: ToastOptions) => void) | null = null

export function pushToast(t: ToastOptions) {
  if (pushToastImpl) pushToastImpl(t)
}

const DUR = { default: 3000, success: 2500, warning: 4000, danger: 5000 }

export function useToastController() {
  const [current, setCurrent] = React.useState<ToastState>(null)
  const queue = React.useRef<ToastOptions[]>([])
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const showNext = React.useCallback(() => {
    if (current || queue.current.length === 0) return
    const t = queue.current.shift()!
    const id = t.id ?? crypto.randomUUID()
    const variant = t.variant ?? 'default'
    const duration = t.durationMs ?? DUR[variant]
    setCurrent({ ...t, id, variant, durationMs: duration })
    timer.current = setTimeout(() => {
      setCurrent(null)
    }, duration)
  }, [current])

  const push = React.useCallback(
    (t: ToastOptions) => {
      queue.current.push(t)
      showNext()
    },
    [showNext]
  )

  React.useEffect(() => {
    pushToastImpl = push
    return () => {
      pushToastImpl = null
      clearTimer()
    }
  }, [push])

  React.useEffect(() => {
    if (!current) showNext()
  }, [current, showNext])

  return { current, dismiss: () => setCurrent(null) }
}
