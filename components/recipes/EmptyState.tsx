'use client'

export default function EmptyState({ hint }: { hint?: string }) {
  return <div style={{ padding: 12, opacity: 0.8 }}>Sem dados ainda. {hint || ''}</div>
}
