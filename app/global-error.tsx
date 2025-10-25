'use client'

'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  console.error(error)

  return (
    <html>
      <body>
        <div className="p-6">
          <h2 className="text-xl font-semibold">Ocorreu um erro global.</h2>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
