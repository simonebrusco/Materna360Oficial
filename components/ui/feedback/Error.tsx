'use client'

export function ErrorBlock({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p className="text-sm font-medium text-rose-800">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 inline-flex items-center rounded-xl px-4 py-2 text-xs font-medium shadow focus-visible:ring">
          Try again
        </button>
      ) : null}
    </div>
  )
}
