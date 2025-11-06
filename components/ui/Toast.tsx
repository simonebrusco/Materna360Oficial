'use client'

'use client'

import { useEffect, useState } from 'react'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const typeStyles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-primary/10 text-primary border-primary/20',
  }

  return (
    <div className={`fixed bottom-4 right-4 rounded-lg border px-6 py-3 shadow-[0_4px_24px_rgba(47,58,86,0.08)] ${typeStyles[type]}`}>
      {message}
    </div>
  )
}
