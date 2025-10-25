'use client'

'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Algo deu errado.</h2>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
      >
        Tentar novamente
      </button>
    </div>
  )
}
