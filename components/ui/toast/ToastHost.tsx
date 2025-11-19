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

  // Get icon based on variant
  const getIcon = () => {
    switch (current.variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
      case 'danger':
        return <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
      default:
        return <Info className="h-5 w-5 text-[#ff005e] flex-shrink-0" />
    }
  }

  // Get background color based on variant
  const getBgClass = () => {
    switch (current.variant) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-white border-green-200'
      case 'danger':
        return 'bg-gradient-to-r from-red-50 to-white border-red-200'
      case 'warning':
        return 'bg-gradient-to-r from-amber-50 to-white border-amber-200'
      default:
        return 'bg-gradient-to-r from-[#ffd8e6] to-white border-[#ffb3d9]'
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-3 z-[60] flex justify-center px-4 pointer-events-none"
      role={role}
      aria-live={live}
      aria-atomic="true"
    >
      <div
        className={[
          'rounded-xl border backdrop-blur-md shadow-[0_12px_40px_rgba(47,58,86,0.18)]',
          'px-4 py-3 w-full max-w-[520px] pointer-events-auto',
          'text-[14px] text-[#2f3a56]',
          getBgClass(),
        ].join(' ')}
        style={{
          transition: reduced ? undefined : 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease',
          transform: 'translateY(0) scale(1)',
          opacity: 1,
        }}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="min-w-0 flex-1">
            {current.title && (
              <div className="font-semibold text-[14px] leading-[20px] mb-0.5">{current.title}</div>
            )}
            <div className="text-[13px] leading-[20px] text-[#545454]">{current.message}</div>
          </div>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={dismiss}
            className="ml-3 flex-shrink-0 rounded-lg p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#ffd8e6] transition-colors"
          >
            <X className="h-4 w-4 text-[#545454]" />
          </button>
        </div>
      </div>
    </div>
  )
}
