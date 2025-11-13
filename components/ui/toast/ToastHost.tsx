'use client'

import * as React from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToastController } from './controller'

export function ToastHost() {
  const { current, dismiss } = useToastController()
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  if (!current) return null

  const role = current.variant === 'danger' ? 'alert' : 'status'
  const live = current.variant === 'danger' ? 'assertive' : 'polite'

  return (
    <div
      className="fixed inset-x-0 bottom-3 z-[60] flex justify-center px-3"
      role={role}
      aria-live={live}
      aria-atomic="true"
    >
      <div
        className={[
          'rounded-2xl border bg-white/95 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.14)]',
          'px-4 py-3 w-full max-w-[520px]',
          'text-[14px] text-[#2f3a56]',
          current.variant === 'success' ? 'border-[#d9f7e7]' :
          current.variant === 'warning' ? 'border-[#fff3cd]' :
          current.variant === 'danger' ? 'border-[#f8d7da]' : 'border-[#e9ecf2]',
        ].join(' ')}
        style={{
          transition: reduced ? undefined : 'transform 160ms ease, opacity 160ms ease',
          transform: 'translateY(0)',
          opacity: 1,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            {current.title && (
              <div className="font-semibold text-[14px] mb-0.5">{current.title}</div>
            )}
            <div className="text-[14px] leading-[20px]">{current.message}</div>
          </div>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={dismiss}
            className="ml-auto rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
