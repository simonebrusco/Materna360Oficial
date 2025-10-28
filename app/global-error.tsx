'use client'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', color: '#b00' }}>
          <h1>Erro na aplicação</h1>
          <p>{error.message}</p>
        </div>
      </body>
    </html>
  )
}
