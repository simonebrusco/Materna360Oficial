'use client'

export default function ErrorFallback({ error }: { error: Error }) {
  return <div style={{ padding: 24, color: '#b00' }}>Oops! Algo deu errado. {error?.message}</div>
}
